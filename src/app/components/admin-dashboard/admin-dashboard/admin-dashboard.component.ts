import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
import { Subscription } from 'rxjs';

import { AdminDashboardService } from 'app/core/services/admin-dashboard/admin-dashboard.service';
import { DepartmentsService } from 'app/core/services/od/departments/departments.service';
import { BranchesService } from 'app/core/services/od/branches/branches.service';
import { LeaveBalanceService } from 'app/core/services/attendance/leave-balance/leave-balance.service';
import { ISystemSetupStepItem, SystemSetupService } from 'app/core/services/main/system-setup.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [PageHeaderComponent, BaseChartDirective],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminDashboardComponent implements OnDestroy {
  private subscriptions: Subscription[] = [];
  private readonly systemSetupDismissKey = 'system_setup_board_dismissed';
  private readonly systemSetupTourDoneKey = 'system_setup_tour_done';
  private readonly systemSetupTourCompletedKey = 'system_setup_tour_completed_steps';
  private readonly systemSetupTourCurrentKey = 'system_setup_tour_current_step';
  private readonly systemSetupTourSessionClosedKey = 'system_setup_tour_session_closed';

  tourCurrentIndex = 0;
  tourTargetRect: { top: number; left: number; width: number; height: number; right: number; bottom: number } | null = null;
  tourCardPos: { top: number; left: number; placement: 'right' | 'left' } = { top: 0, left: 0, placement: 'right' };

  private resizeHandler?: () => void;
  private anchorRetryCount = 0;
  constructor(
    private adminDashboardService: AdminDashboardService,
    private _DepartmentsService: DepartmentsService,
    private _BranchesService: BranchesService,
    private leaveBalanceService: LeaveBalanceService,
    private systemSetupService: SystemSetupService
  ) { }
  getDataLoad: boolean = true;

  // -----------------------------
  // System Setup Board
  // -----------------------------
  systemSetupLoading = true;
  systemSetupItems: ISystemSetupStepItem[] = [];
  systemSetupError: string | null = null;

  // ---------- Tour persistence ----------
  private get tourDone(): boolean {
    return localStorage.getItem(this.systemSetupTourDoneKey) === 'true';
  }

  private set tourDone(val: boolean) {
    localStorage.setItem(this.systemSetupTourDoneKey, val ? 'true' : 'false');
  }

  private get tourCompletedSteps(): number[] {
    try {
      const raw = localStorage.getItem(this.systemSetupTourCompletedKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'number') : [];
    } catch {
      return [];
    }
  }

  private set tourCompletedSteps(steps: number[]) {
    const unique = Array.from(new Set(steps)).sort((a, b) => a - b);
    localStorage.setItem(this.systemSetupTourCompletedKey, JSON.stringify(unique));
  }

  private get tourCurrentStep(): number | null {
    const raw = localStorage.getItem(this.systemSetupTourCurrentKey);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }

  private set tourCurrentStep(step: number | null) {
    if (step === null) {
      localStorage.removeItem(this.systemSetupTourCurrentKey);
      return;
    }
    localStorage.setItem(this.systemSetupTourCurrentKey, String(step));
  }

  get shouldShowSystemSetupTour(): boolean {
    // Show tour until user actually completes all steps OR chooses "Skip all"
    const completedAll = this.systemSetupTotal > 0 && this.tourCompletedCount >= this.systemSetupTotal;
    if (this.tourDone && completedAll) return false;

    // If user closed it for this session, keep it hidden until refresh/navigation ends.
    // (We still allow it to show if it has never successfully anchored yet)
    const sessionClosed = sessionStorage.getItem(this.systemSetupTourSessionClosedKey) === 'true';
    if (sessionClosed && this.tourTargetRect) return false;

    return (this.systemSetupLoading || !!this.systemSetupError || this.systemSetupTotal > 0);
  }

  closeTourForSession(): void {
    sessionStorage.setItem(this.systemSetupTourSessionClosedKey, 'true');
  }

  get tourCompletedCount(): number {
    const set = new Set(this.tourCompletedSteps);
    return this.systemSetupItems.filter(i => set.has(i.step)).length;
  }

  get tourProgressPercent(): number {
    if (!this.systemSetupTotal) return 0;
    return Math.round((this.tourCompletedCount / this.systemSetupTotal) * 100);
  }

  get currentTourItem(): ISystemSetupStepItem | null {
    if (!this.systemSetupItems.length) return null;
    const idx = Math.min(Math.max(this.tourCurrentIndex, 0), this.systemSetupItems.length - 1);
    return this.systemSetupItems[idx] || null;
  }

  isTourStepCompleted(step: number): boolean {
    return new Set(this.tourCompletedSteps).has(step);
  }

  private syncTourIndexFromStorage(): void {
    if (!this.systemSetupItems.length) {
      this.tourCurrentIndex = 0;
      return;
    }

    const completed = new Set(this.tourCompletedSteps);
    const storedStep = this.tourCurrentStep;

    if (storedStep !== null) {
      const idx = this.systemSetupItems.findIndex(i => i.step === storedStep);
      if (idx >= 0 && !completed.has(storedStep)) {
        this.tourCurrentIndex = idx;
        return;
      }
    }

    const firstIncompleteIdx = this.systemSetupItems.findIndex(i => !completed.has(i.step));
    this.tourCurrentIndex = firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0;

    const item = this.systemSetupItems[this.tourCurrentIndex];
    if (item && !completed.has(item.step)) {
      this.tourCurrentStep = item.step;
    }
  }

  private getTourSidebarTargetKey(title: string): 'od' | 'attendance' | 'personnel' {
    const normalized = (title || '').trim().toLowerCase();
    if (normalized === 'work schedules') return 'attendance';
    if (normalized === 'employees') return 'personnel';
    // Goals/Departments/Branches/Job Titles → Operations Development
    return 'od';
  }

  private updateTourAnchor(): void {
    const item = this.currentTourItem;
    if (!item) {
      this.tourTargetRect = null;
      return;
    }

    const key = this.getTourSidebarTargetKey(item.title);
    const el = document.querySelector(`[data-system-setup-target="${key}"]`) as HTMLElement | null;
    if (!el) {
      this.tourTargetRect = null;
      return;
    }

    const r = el.getBoundingClientRect();
    this.tourTargetRect = { top: r.top, left: r.left, width: r.width, height: r.height, right: r.right, bottom: r.bottom };

    // Tooltip placement near sidebar element
    const margin = 14;
    const cardWidth = 360; // used for placement decisions
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let placement: 'right' | 'left' = 'right';
    let left = r.right + margin;

    if (left + cardWidth > viewportW - 12) {
      placement = 'left';
      left = Math.max(12, r.left - margin - cardWidth);
    }

    // Top aligned to target, clamped into viewport
    const desiredTop = r.top - 6;
    const top = Math.min(Math.max(12, desiredTop), Math.max(12, viewportH - 12 - 260));

    this.tourCardPos = { top, left, placement };
  }

  private ensureTourAnchor(): void {
    this.updateTourAnchor();
    if (this.tourTargetRect) {
      this.anchorRetryCount = 0;
      return;
    }

    if (this.anchorRetryCount >= 10) return;
    this.anchorRetryCount += 1;
    setTimeout(() => this.ensureTourAnchor(), 150);
  }

  ngAfterViewInit(): void {
    // Wait a tick for sidebar/layout paint
    setTimeout(() => this.ensureTourAnchor(), 0);
    this.resizeHandler = () => this.updateTourAnchor();
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('scroll', this.resizeHandler, true);
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];

    // Remove event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('scroll', this.resizeHandler, true);
    }
  }

  nextTourStep(): void {
    const item = this.currentTourItem;
    if (!item) return;

    const completed = new Set(this.tourCompletedSteps);
    completed.add(item.step);
    this.tourCompletedSteps = Array.from(completed);

    const nextIdx = this.systemSetupItems.findIndex((x, idx) => idx > this.tourCurrentIndex && !completed.has(x.step));
    if (nextIdx >= 0) {
      this.tourCurrentIndex = nextIdx;
      this.tourCurrentStep = this.systemSetupItems[nextIdx].step;
      setTimeout(() => this.ensureTourAnchor(), 0);
      return;
    }

    const anyIncomplete = this.systemSetupItems.findIndex(x => !completed.has(x.step));
    if (anyIncomplete >= 0) {
      this.tourCurrentIndex = anyIncomplete;
      this.tourCurrentStep = this.systemSetupItems[anyIncomplete].step;
      setTimeout(() => this.ensureTourAnchor(), 0);
      return;
    }

    this.tourDone = true;
    // fully finished: persist and close
    sessionStorage.setItem(this.systemSetupTourSessionClosedKey, 'true');
  }

  prevTourStep(): void {
    if (!this.systemSetupItems.length) return;
    this.tourCurrentIndex = Math.max(0, this.tourCurrentIndex - 1);
    const item = this.systemSetupItems[this.tourCurrentIndex];
    if (item && !this.isTourStepCompleted(item.step)) {
      this.tourCurrentStep = item.step;
    }
    setTimeout(() => this.updateTourAnchor(), 0);
  }

  skipAllTourSteps(): void {
    this.tourDone = true;
    this.tourCurrentStep = null;
    sessionStorage.setItem(this.systemSetupTourSessionClosedKey, 'true');
  }

  get systemSetupDismissed(): boolean {
    return localStorage.getItem(this.systemSetupDismissKey) === 'true';
  }

  dismissSystemSetup(): void {
    localStorage.setItem(this.systemSetupDismissKey, 'true');
  }

  resetSystemSetupDismiss(): void {
    localStorage.removeItem(this.systemSetupDismissKey);
  }

  get systemSetupTotal(): number {
    return this.systemSetupItems.length;
  }

  get systemSetupCompleted(): number {
    return this.systemSetupItems.filter(x => x.checked).length;
  }

  get systemSetupProgressPercent(): number {
    if (!this.systemSetupTotal) return 0;
    return Math.round((this.systemSetupCompleted / this.systemSetupTotal) * 100);
  }

  get systemSetupIsDone(): boolean {
    return this.systemSetupTotal > 0 && this.systemSetupCompleted === this.systemSetupTotal;
  }

  get currentLang(): 'en' | 'ar' {
    return (localStorage.getItem('lang') === 'ar' ? 'ar' : 'en');
  }

  getSystemSetupMessage(item: ISystemSetupStepItem): string {
    const msg = item?.message?.[this.currentLang] || item?.message?.en || item?.message?.ar;
    if (item.checked) return msg || 'Completed';
    return 'Not completed yet';
  }

  getSystemSetupRoute(title: string): string | null {
    const normalized = (title || '').trim().toLowerCase();
    if (normalized === 'goals') return '/goals/all-goals';
    if (normalized === 'departments') return '/departments/all-departments';
    if (normalized === 'branches') return '/branches/all-branches';
    if (normalized === 'job titles' || normalized === 'job titles ') return '/jobs/all-job-titles';
    if (normalized === 'work schedules') return '/schedule/work-schedule';
    if (normalized === 'employees') return '/employees/all-employees';
    return null;
  }

  months: { value: number, label: string }[] = [];

  years: { value: string, label: string }[] = [];

  public chartsData: {
    [key: string]: { labels: string[], values: number[], colors: string[] }
  } = {};

  ngOnInit(): void {
    this.loadSystemSetupBoard();
    // get monthes selects 
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    this.months = [];
    this.months.push({ value: currentMonth, label: "This Month" });
    if (currentMonth > 1) {
      this.months.push({ value: currentMonth - 1, label: "Last Month" });
    }
    for (let m = currentMonth - 2; m >= 1; m--) {
      this.months.push({ value: m, label: monthNames[m - 1] });
    }

    // get last three years
    this.years = [
      { value: (currentYear).toString(), label: `This Year` },
      { value: (currentYear - 1).toString(), label: `Last Year` },
      { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() }
    ];

    // defult selects values
    this.params.request_month = currentMonth;
    this.params.turnover_year = currentYear.toString();
    this.params.employees_year = currentYear.toString();

    // get departments and branchs and leave balance
    this.getAllDepartment(this.currentPage);
    this.getAllBranchs(this.currentPage);
    this.getAllLeaveBalance();

    // get dashboard data
    this.getDashboardData();
  }

  private loadSystemSetupBoard(): void {
    // Check localStorage flag to skip API call if all steps completed
    const allDoneFlag = localStorage.getItem('system_setup_tour_all_done');
    if (allDoneFlag === 'true') {
      this.systemSetupLoading = false;
      this.systemSetupError = null;
      this.systemSetupItems = [];
      return;
    }

    this.systemSetupLoading = true;
    this.systemSetupError = null;
    const sub = this.systemSetupService.getSystemSetup().subscribe({
      next: (res) => {
        const items = res?.data?.list_items || [];
        // ensure stable ordering by step
        this.systemSetupItems = [...items].sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
        this.systemSetupLoading = false;
        this.syncTourIndexFromStorage();
        setTimeout(() => this.ensureTourAnchor(), 0);
        // If all items are checked, set the flag in localStorage
        if (this.systemSetupItems.length > 0 && this.systemSetupItems.every(item => item.checked === true)) {
          localStorage.setItem('system_setup_tour_all_done', 'true');
        }
      },
      error: (err) => {
        this.systemSetupLoading = false;
        this.systemSetupItems = [];
        this.systemSetupError = err?.error?.details || 'Failed to load system setup.';
      }
    });
    this.subscriptions.push(sub);
  }




  params: any = {
    department: '',
    request_month: '',
    turnover_year: '',
    employees_year: '',
    leave_balance_leave_id: '',
    active_departments_branch_id: ''
  };

  onParamChangeEvent(key: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    // console.log("Changed:", key, value);
    this.params[key] = value;
    this.getDashboardData();
  }


  getDashboardData(): void {
    const sub = this.adminDashboardService.viewDashboard(this.params).subscribe({
      next: (response) => {
        const dashboardData = response.data.object_info;
        dashboardData.forEach((item: any) => {
          const valuesArray = Array.isArray(item.value) ? item.value : [];

          this.chartsData[item.title] = {
            labels: valuesArray.map((v: any) =>
              v?.label ?? v?.name ?? ''
            ),
            values: valuesArray.map((v: any) => v?.value ?? 0),
            colors: valuesArray.map((v: any) => v?.color_code ?? '#e5e7eb50')
          };
        });
        this.getDataLoad = false;
        // console.log("Charts Data:", this.chartsData);

        // -----------------------------
        // Active Employees
        // -----------------------------
        const activeEmployees = this.chartsData['Active Employees'];
        if (activeEmployees) {
          this.activeEmployeeLabels = activeEmployees.labels;
          this.activeEmployeeValues = activeEmployees.values;
          this.activeEmployeeColors = activeEmployees.colors;

          this.activeEmployeeData = {
            labels: this.activeEmployeeLabels,
            datasets: [
              {
                data: this.activeEmployeeValues.every(v => v === 0)
                  ? [1]
                  : this.activeEmployeeValues,
                backgroundColor: this.activeEmployeeValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.activeEmployeeColors
              }
            ]
          };

          if (this.activeEmployeeValues.every(v => v === 0)) {
            this.activeEmployeeOptions = this.getEmptyChartOptions();
          } else {
            this.activeEmployeeOptions = {
              responsive: true,
              cutout: '50%',
              animation: {
                animateRotate: true,
                animateScale: true
              },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
              }
            };
          }
        }

        // -----------------------------
        // Leave Balance
        // -----------------------------
        const leaveBalance = this.chartsData['Leave Balance'];
        if (leaveBalance) {
          this.leaveBalanceLabels = leaveBalance.labels;
          this.leaveBalanceValues = leaveBalance.values;
          this.leaveBalanceColors = leaveBalance.colors;

          this.leaveBalanceData = {
            labels: this.leaveBalanceLabels,
            datasets: [
              {
                data: this.leaveBalanceValues.every(v => v === 0)
                  ? [1]
                  : this.leaveBalanceValues,
                backgroundColor: this.leaveBalanceValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.leaveBalanceColors
              }
            ]
          };

          if (this.leaveBalanceValues.every(v => v === 0)) {
            this.leaveBalanceOptions = this.getEmptyChartOptions();
          } else {
            this.leaveBalanceOptions = {
              responsive: true,
              cutout: '50%',
              animation: {
                animateRotate: true,
                animateScale: true
              },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
              }
            };
          }
        }


        // -----------------------------
        // Requests
        // -----------------------------
        const requests = this.chartsData['Requests'];
        if (requests) {
          this.requestsLabels = requests.labels;
          this.requestsValues = requests.values;
          this.requestsColors = requests.colors;

          this.requestsData = {
            labels: this.requestsLabels,
            datasets: [
              {
                data: this.requestsValues.every(v => v === 0)
                  ? [1]
                  : this.requestsValues,
                backgroundColor: this.requestsValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.requestsColors
              }
            ]
          };

          if (this.requestsValues.every(v => v === 0)) {
            // no data
            this.requestsOptions = this.getEmptyChartOptions();
          } else {
            // has data
            this.requestsOptions = {
              responsive: true,
              cutout: '50%',
              animation: {
                animateRotate: true,
                animateScale: true
              },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
              }
            };
          }
        }


        // -----------------------------
        // Goals
        // -----------------------------
        const goals = this.chartsData['Goals'];
        if (goals) {
          this.goalsLabels = goals.labels;
          this.goalsValues = goals.values;
          this.goalsColors = goals.colors;

          this.goalsData = {
            labels: this.goalsLabels,
            datasets: [
              {
                data: this.goalsValues.every(v => v === 0)
                  ? [1]
                  : this.goalsValues,
                backgroundColor: this.goalsValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.goalsColors
              }
            ]
          };

          if (this.goalsValues.every(v => v === 0)) {
            this.goalsOptions = this.getEmptyChartOptions();
          } else {
            this.goalsOptions = {
              responsive: true,
              cutout: '50%',
              animation: {
                animateRotate: true,
                animateScale: true
              },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
              }
            };
          }
        }


        // -----------------------------
        // Turnover
        // -----------------------------
        const turnover = this.chartsData['Turnover'];
        if (turnover) {
          this.turnoverValues = turnover.values;
          this.turnoverColors = turnover.colors;

          this.turnoverData = {
            labels: this.turnoverLabels,
            datasets: [
              {
                label: 'Turnover',
                data: this.turnoverValues,
                backgroundColor: this.turnoverColors,
                borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
                borderSkipped: false,
                barPercentage: 1.1,
                categoryPercentage: 0.6
              }
            ]
          };
        }

        // -----------------------------
        // Employees chart
        // -----------------------------
        const employeesItem = dashboardData.find((x: any) => x.title === 'Employees');
        if (employeesItem && Array.isArray(employeesItem.value)) {
          const valuesArray = employeesItem.value;

          this.hiredValues = valuesArray.map((v: any) => v.active?.value ?? 0);
          this.terminatedValues = valuesArray.map((v: any) => v.terminate?.value ?? 0);
          this.resignedValues = valuesArray.map((v: any) => v.resign?.value ?? 0);

          this.employeeData = {
            labels: this.employeeLabels,
            datasets: [
              {
                label: 'Hired',
                data: this.hiredValues,
                backgroundColor: '#98DFC0',
                borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
                borderSkipped: false
              },
              {
                label: 'Terminated',
                data: this.terminatedValues,
                backgroundColor: '#B83D4A',
                borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
                borderSkipped: false
              },
              {
                label: 'Resigned',
                data: this.resignedValues,
                backgroundColor: '#FF8F8F',
                borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
                borderSkipped: false
              }
            ]
          };
        }

        // -----------------------------
        // Department Guidelines
        // -----------------------------
        const deptGuidelines = this.chartsData['Department Guidelines'];
        if (deptGuidelines) {
          this.deptGuidelinesLabels = deptGuidelines.labels;
          this.deptGuidelinesValues = deptGuidelines.values;
          this.deptGuidelinesColors = deptGuidelines.colors;

          this.deptGuidelinesData = {
            labels: this.deptGuidelinesLabels,
            datasets: [
              {
                data: this.deptGuidelinesValues.every(v => v === 0)
                  ? [1]
                  : this.deptGuidelinesValues,
                backgroundColor: this.deptGuidelinesValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.deptGuidelinesColors
              }
            ]
          };

          if (this.deptGuidelinesValues.every(v => v === 0)) {
            this.deptGuidelinesOptions = this.getEmptyChartOptions();
          } else {
            this.deptGuidelinesOptions = {
              responsive: true,
              cutout: '50%',
              animation: {
                animateRotate: true,
                animateScale: true
              },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
              }
            };
          }
        }

        // ------------------
        // Active Departments
        // -------------------
        const activeDeps = this.chartsData['Active Departments'];
        if (activeDeps) {
          this.activeDepartmentsLabels = activeDeps.labels;
          this.activeDepartmentsValues = activeDeps.values;
          this.activeDepartmentsColors = activeDeps.colors;

          this.activeDepartmentsData = {
            labels: this.activeDepartmentsLabels,
            datasets: [
              {
                data: this.activeDepartmentsValues.every(v => v === 0)
                  ? [1]
                  : this.activeDepartmentsValues,
                backgroundColor: this.activeDepartmentsValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.activeDepartmentsColors
              }
            ]
          };

          if (this.activeDepartmentsValues.every(v => v === 0)) {

            this.activeDepartmentsOptions = this.getEmptyChartOptions();
          } else {
            this.activeDepartmentsOptions = {
              responsive: true,
              cutout: '50%',
              animation: {
                animateRotate: true,
                animateScale: true
              },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
              }
            };
          }
        }

        // -----------------------------
        // Employee Onboarding
        // -----------------------------
        const employeeOnboarding = this.chartsData['Employee Onboarding'];
        if (employeeOnboarding) {
          this.employeeOnboardingLabels = employeeOnboarding.labels;
          this.employeeOnboardingValues = employeeOnboarding.values;
          this.employeeOnboardingColors = employeeOnboarding.colors;

          this.employeeOnboardingData = {
            labels: this.employeeOnboardingLabels,
            datasets: [
              {
                data: this.employeeOnboardingValues.every(v => v === 0)
                  ? [1]
                  : this.employeeOnboardingValues,
                backgroundColor: this.employeeOnboardingValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.employeeOnboardingColors
              }
            ]
          };

          if (this.employeeOnboardingValues.every(v => v === 0)) {
            this.employeeOnboardingOptions = this.getEmptyChartOptions();
          } else {
            this.employeeOnboardingOptions = {
              responsive: true,
              cutout: '50%',
              animation: {
                animateRotate: true,
                animateScale: true
              },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
              }
            };
          }
        }




      },
      error: (error) => {
        console.error('Error fetching dashboard data:', error);
        this.getDataLoad = false;

      }
    });
    this.subscriptions.push(sub);
  }

  // empty chart
  getEmptyChartOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      cutout: '50%',
      animation: {
        animateRotate: true,
        animateScale: true
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: () => '',
            title: () => 'No data'
          }
        }
      }
    };
  }



  departments: any[] = [];
  branches: any[] = [];
  leaveBalance: any[] = [];
  selectAll: boolean = false;
  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;

  // Getter to filter only active departments
  get activeDepartments(): any[] {
    return this.departments.filter(dept => dept.is_active === true);
  }

  // get departemnt
  getAllDepartment(pageNumber: number, searchTerm: string = '') {
    const sub = this._DepartmentsService.getAllDepartment(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {
        this.departments = response.data.list_items;
      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
    this.subscriptions.push(sub);
  }

  // get branches
  getAllBranchs(pageNumber: number, searchTerm: string = '') {
    const sub = this._BranchesService.getAllBranches(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {

        this.branches = response.data.list_items;
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
    this.subscriptions.push(sub);
  }


  // get leave balance
  getAllLeaveBalance(): void {
    const sub = this.leaveBalanceService.getAllLeaveBalance({
      page: 1,
      per_page: 10000
    }).subscribe({
      next: (response) => {
        this.leaveBalance = response.data.list_items;
        // console.log(this.leaveBalance);
      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
    this.subscriptions.push(sub);
  }

  // -----------------------------
  // Active Employees Chart
  // -----------------------------
  public activeEmployeeType: 'doughnut' = 'doughnut';

  public activeEmployeeLabels: string[] = [];
  public activeEmployeeValues: number[] = [];
  public activeEmployeeColors: string[] = [];

  public activeEmployeeData: any;
  public activeEmployeeOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };

  public get activeEmployeeTotal() {
    return this.activeEmployeeValues.reduce((a, b) => a + b, 0);
  }

  // -----------------------------
  // Leave Balance Chart
  // -----------------------------
  public leaveBalanceType: 'doughnut' = 'doughnut';

  public leaveBalanceLabels: string[] = [];
  public leaveBalanceValues: number[] = [];
  public leaveBalanceColors: string[] = [];

  public leaveBalanceData: any;
  public leaveBalanceOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };

  public get leaveBalanceTotal() {
    return this.leaveBalanceValues.reduce((a, b) => a + b, 0);
  }


  // -----------------------------
  // Requests Chart
  // -----------------------------
  public requestsType: 'doughnut' = 'doughnut';

  public requestsLabels: string[] = [];
  public requestsValues: number[] = [];
  public requestsColors: string[] = [];

  public requestsData: any;
  public requestsOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };

  public get requestsTotal() {
    return this.requestsValues.reduce((a, b) => a + b, 0);
  }

  // -----------------------------
  // Goals Chart
  // -----------------------------
  public goalsType: 'doughnut' = 'doughnut';

  public goalsLabels: string[] = [];
  public goalsValues: number[] = [];
  public goalsColors: string[] = [];

  public goalsData: any;
  public goalsOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };

  public get goalsTotal() {
    return this.goalsValues.reduce((a, b) => a + b, 0);
  }


  // -----------------------------
  // Alerts
  // -----------------------------
  alerts = [
    {
      number: 2,
      title: 'Probation Alert',
      content: 'The probation period for John Doe will end on 2025-09-30. Please review and take action.'
    },
    {
      number: 1,
      title: 'Leave Alert',
      content: 'Alice Smith has 2 days of leave pending approval. Please review.'
    },
    {
      title: 'Compliance Alert',
      content: 'The compliance training for Michael Brown is overdue. Please follow up.'
    },
    {
      number: 2,
      title: 'Contract Renewal',
      content: 'The contract for Sarah Johnson will expire on 2025-10-15. Action required.'
    },
    {
      number: 1,
      title: 'Probation Alert',
      content: 'The probation period for David Lee will end on 2025-10-01. Please review.'
    }
  ];
  // -----------------------------
  // Turnover Bar Chart
  // -----------------------------
  public turnoverType: 'bar' = 'bar';

  public turnoverLabels: string[] = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  public turnoverValues: number[] = [];
  public turnoverColors: string[] = [];

  public turnoverData: any;
  public turnoverOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: true
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: '#C2C2C2',
          drawTicks: true,
          lineWidth: 1
        },
        ticks: {
          color: '#2C435D',
          font: { size: 16 }
        }
      },
      y: {
        grid: {
          display: true,
          color: '#C2C2C2',
          drawTicks: true,
          lineWidth: 1
        },
        ticks: {
          color: '#2C435D',
          font: { size: 16 }
        }
      }
    }
  };

  // -----------------------------
  // Employees Chart
  // ----------------------------- 
  public employeeLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  public hiredValues: number[] = [];
  public terminatedValues: number[] = [];
  public resignedValues: number[] = [];

  public employeeData: any;
  public employeeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: '#C2C2C2',
          drawTicks: true,
          lineWidth: 1
        },
        ticks: {
          color: '#2C435D',
          font: { size: 16 }
        }
      },
      y: {
        grid: {
          display: true,
          color: '#C2C2C2',
          drawTicks: true,
          lineWidth: 1
        },
        ticks: {
          color: '#2C435D',
          font: { size: 16 },
        }
      }
    }
  };

  public employeeType: 'bar' = 'bar';

  // -----------------------------
  // Department Guidelines Chart
  // -----------------------------
  public deptGuidelinesType: 'doughnut' = 'doughnut';

  public deptGuidelinesLabels: string[] = [];
  public deptGuidelinesValues: number[] = [];
  public deptGuidelinesColors: string[] = [];

  public deptGuidelinesData: any;
  public deptGuidelinesOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };


  // -----------------------------
  // Active Departments Chart
  // -----------------------------
  public activeDepartmentsType: 'doughnut' = 'doughnut';
  public activeDepartmentsLabels: string[] = [];
  public activeDepartmentsValues: number[] = [];
  public activeDepartmentsColors: string[] = [];
  public activeDepartmentsData: any;
  public activeDepartmentsOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: { animateRotate: true, animateScale: true },
    plugins: { legend: { display: false } }
  };
  public get activeDepartmentsTotal() {
    return this.activeDepartmentsValues.reduce((a, b) => a + b, 0);
  }

  // -----------------------------
  // Employee Onboarding Chart
  // -----------------------------
  public employeeOnboardingType: 'doughnut' = 'doughnut';
  public employeeOnboardingLabels: string[] = [];
  public employeeOnboardingValues: number[] = [];
  public employeeOnboardingColors: string[] = [];
  public employeeOnboardingData: any;
  public employeeOnboardingOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: { animateRotate: true, animateScale: true },
    plugins: { legend: { display: false } }
  };
  public get employeeOnboardingTotal() {
    return this.employeeOnboardingValues.reduce((a, b) => a + b, 0);
  }


}
