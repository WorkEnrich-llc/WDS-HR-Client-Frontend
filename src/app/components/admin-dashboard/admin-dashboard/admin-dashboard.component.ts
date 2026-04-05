import { Component, OnDestroy, ViewEncapsulation, inject, signal, computed, effect, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartData } from 'chart.js';
import { Subscription, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

import { AdminDashboardService } from 'app/core/services/admin-dashboard/admin-dashboard.service';
import { DepartmentsService } from 'app/core/services/od/departments/departments.service';
import { BranchesService } from 'app/core/services/od/branches/branches.service';
import { LeaveBalanceService } from 'app/core/services/attendance/leave-balance/leave-balance.service';
import { ISystemSetupStepItem, SystemSetupService } from 'app/core/services/main/system-setup.service';
import { LanguageService } from 'app/core/services/language/language.service';
import { LayoutService } from 'app/core/services/layout/layout.service';

interface DashboardTranslations {
  title?: string;
  filters?: {
    all_department?: string;
    all_branches?: string;
    all_leave_balance?: string;
    year?: string;
  };
  cards?: {
    active_employees?: string;
    leave_balance?: string;
    requests?: string;
    goals?: string;
    alerts?: string;
    turnover?: string;
    employee_onboarding?: string;
    employees?: string;
    department_guidelines?: string;
    active_departments?: string;
    payroll_status?: string;
  };
  labels?: {
    total?: string;
    hired?: string;
    terminated?: string;
    resigned?: string;
    no_alerts?: string;
    no_alerts_sub?: string;
    refresh?: string;
    posted?: string;
    salaries?: string;
    employees_count?: string;
    deductions?: string;
    earnings?: string;
    soon?: string;
    year?: string;
    years?: string;
    done?: string;
  };
  months?: {
    this_month?: string;
    last_month?: string;
    jan?: string;
    feb?: string;
    mar?: string;
    apr?: string;
    may?: string;
    jun?: string;
    jul?: string;
    aug?: string;
    sep?: string;
    oct?: string;
    nov?: string;
    dec?: string;
  };
  years?: {
    this_year?: string;
    last_year?: string;
  };
  chart_labels?: {
    on_probation?: string;
    year_1_less?: string;
    years_2_plus?: string;
    years_3_plus?: string;
    rejected?: string;
    expired?: string;
    pending?: string;
    accepted?: string;
    active?: string;
    inactive?: string;
    available?: string;
    used?: string;
    carryover?: string;
    applied?: string;
    not_applied?: string;
    in_progress?: string;
    support?: string;
    technical?: string;
    done_100?: string;
    done_80_plus?: string;
    done_50_80?: string;
    done_30_50?: string;
    done_30_less?: string;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, BaseChartDirective],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- Injections ---
  private adminDashboardService = inject(AdminDashboardService);
  private departmentsService = inject(DepartmentsService);
  private branchesService = inject(BranchesService);
  private leaveBalanceService = inject(LeaveBalanceService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // --- External State (Signals) ---
  readonly currentLang = signal(this.languageService.getLanguage());

  // --- Translation Logic ---
  private readonly dashboardI18n = toSignal(
    toObservable(this.currentLang).pipe(
      switchMap(lang =>
        this.http
          .get<DashboardTranslations>(`./assets/i18n/${lang}/dashboard.json`)
          .pipe(catchError(() => of({} as DashboardTranslations)))
      )
    ),
    { initialValue: {} as DashboardTranslations }
  );

  /** Primary translation accessor signal */
  readonly t = computed(() => this.dashboardI18n());

  // --- Component State (Signals) ---
  readonly getDataLoad = signal(true);
  readonly rawDashboardData = signal<any[]>([]); // Clean, raw data from API

  readonly departments = signal<any[]>([]);
  readonly branches = signal<any[]>([]);
  readonly leaveBalancesData = signal<any[]>([]);
  readonly alerts = signal<any[]>([]);
  
  readonly params = signal<Record<string, any>>({
    department: '',
    request_month: new Date().getMonth() + 1,
    turnover_year: new Date().getFullYear().toString(),
    employees_year: new Date().getFullYear().toString(),
    leave_balance_leave_id: '',
    active_departments_branch_id: ''
  });

  // --- Reactive Mappings (Decoupled from Fetch) ---
  readonly chartsDataMap = computed(() => {
    const dashboardData = this.rawDashboardData();
    const trans = this.t() || {}; // Safe access
    const dataMap: Record<string, any> = {};

    dashboardData.forEach((item: any) => {
      const valuesArray = Array.isArray(item.value) ? item.value : [];
      const chartItems = valuesArray.filter((v: any) => 
        v && typeof v.label === 'string' && typeof v.value === 'number'
      );

      dataMap[item.title] = {
        values: chartItems.map((v: any) => v.value),
        colors: chartItems.map((v: any) => v.color_code || '#e5e7eb50'),
        labels: chartItems.map((v: any) => this.translateDynamicLabel(v.label, trans)),
        raw: valuesArray
      };
    });
    return dataMap;
  });

  // --- Computed Base Views ---
  readonly activeDepartments = computed(() => 
    this.departments().filter(dept => dept.is_active === true)
  );

  readonly monthLabelsForLanguage = computed(() => {
    const m = this.t().months || {};
    return [m.jan, m.feb, m.mar, m.apr, m.may, m.jun, m.jul, m.aug, m.sep, m.oct, m.nov, m.dec]
      .map(name => name || '');
  });

  // --- Chart Setup Configuration ---
  readonly doughnutType: 'doughnut' = 'doughnut';
  readonly barType: 'bar' = 'bar';

  // --- Subscriptions (Cleanup Management) ---
  private subscriptions: Subscription[] = [];

  constructor() {
    effect(() => {
      // Re-fetch only when params change
      this.params();
      this.getDashboardData();
    });

    // Detect language changes from external service
    this.subscriptions.push(
      this.languageService.language$.subscribe((lang: string) => {
        this.currentLang.set(lang);
        this.cdr.markForCheck();
      })
    );
  }

  ngOnInit(): void {
    this.initDateFilters();
    this.loadInitialData();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // --- Core Methods ---

  private initDateFilters(): void {
    const now = new Date();
    this.params.update(p => ({
      ...p,
      request_month: now.getMonth() + 1,
      turnover_year: now.getFullYear().toString(),
      employees_year: now.getFullYear().toString()
    }));
  }

  private loadInitialData(): void {
    this.getAllDepartments();
    this.getAllBranches();
    this.getAllLeaveBalance();
  }

  onParamChangeEvent(key: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.params.update(p => ({ ...p, [key]: value }));
  }

  getDashboardData(): void {
    const sub = this.adminDashboardService.viewDashboard(this.params()).subscribe({
      next: (response) => {
        const dashboardData = response.data.object_info || [];
        this.rawDashboardData.set(dashboardData);

        // Alert Mapping (keep simple)
        const alertsItem = dashboardData.find((x: any) => x.title === 'Alerts');
        if (alertsItem && Array.isArray(alertsItem.value)) {
          this.alerts.set(alertsItem.value.map((a: any) => {
            const extraMeta = a.extra_meta || {};
            const info = extraMeta.info || {};
            return {
              id: a.id,
              title: info.title || a.title || '',
              content: info.body || info.description || a.content || '',
              number: a.number ?? null,
              raw: a
            };
          }));
        } else {
          this.alerts.set([]);
        }

        this.getDataLoad.set(false);
      },
      error: (error) => {
        console.error('Core Dashboard Load Failure:', error);
        this.getDataLoad.set(false);
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Translates labels coming from the API based on the local dictionary
   */
  private translateDynamicLabel(label: string, trans: DashboardTranslations): string {
    if (!label) return '';
    const cl = trans.chart_labels || {};
    // Normalize string: handle all non-standard spaces/chars and lowercase everything
    const cleanLabel = label.replace(/\s+/g, ' ').trim();
    const lower = cleanLabel.toLowerCase();
    
    // --- Specific Label Mapping (Localized version prioritized) ---
    if (lower === 'technical') return cl.technical || (this.currentLang() === 'ar' ? 'تقني' : 'Technical');
    if (lower === 'support') return cl.support || (this.currentLang() === 'ar' ? 'دعم' : 'Support');
    
    // --- Performance Metrics (Handling 'Done' explicitly) ---
    // Use regex to look for "done" at the start of the string
    const doneRegex = /^done\s+/i;
    if (doneRegex.test(lower)) {
      const isArabic = this.currentLang() === 'ar';
      
      // Exact pattern matches from your screenshot
      if (lower === 'done 100%') return cl.done_100 || (isArabic ? 'مكتمل 100%' : 'Done 100%');
      if (lower.includes('80%')) return cl.done_80_plus || (isArabic ? 'أكثر من 80%' : 'Done 80%<');
      if (lower.includes('50-80%')) return cl.done_50_80 || (isArabic ? 'منجز 50-80%' : 'Done 50-80%');
      if (lower.includes('30-50%')) return cl.done_30_50 || (isArabic ? 'منجز 30-50%' : 'Done 30-50%');
      if (lower.includes('30%')) return cl.done_30_less || (isArabic ? 'أقل من 30%' : 'Done 30%>');
      
      // Global fallback for any word starting with 'done'
      const doneLabel = trans.labels?.done || (isArabic ? 'منجز' : 'Done');
      return cleanLabel.replace(/done/i, doneLabel);
    }
    
    // Tenure mapping (Fuzzy)
    if (lower.includes('probation')) return cl.on_probation || label;
    if (lower.includes('year 1') || lower.includes('1 year')) return cl.year_1_less || label;
    if (lower.includes('year 2') || lower.includes('2 year')) return cl.years_2_plus || label;
    if (lower.includes('year 3') || lower.includes('3 year')) return cl.years_3_plus || label;
    
    // Exact match for statuses
    if (lower === 'applied') return cl.applied || label;
    if (lower === 'not applied' || lower === 'not_applied') return cl.not_applied || label;
    if (lower === 'in progress' || lower === 'in_progress') return cl.in_progress || label;
    if (lower === 'rejected') return cl.rejected || label;
    if (lower === 'expired') return cl.expired || label;
    if (lower === 'pending') return cl.pending || label;
    if (lower === 'accepted') return cl.accepted || label;
    if (lower === 'active') return cl.active || label;
    if (lower === 'inactive') return cl.inactive || label;
    if (lower === 'available') return cl.available || label;
    if (lower === 'used') return cl.used || label;
    if (lower === 'carryover') return cl.carryover || label;
    
    return label;
  }

  // --- Reactive Chart Computations ---

  readonly activeEmployeeData = computed<ChartData<'doughnut'>>(() => {
    const data = this.chartsDataMap()['Active Employees'];
    if (!data) return { labels: [], datasets: [] };
    const hasData = (data.values || []).some((v: number) => v > 0);
    return {
      labels: Array.isArray(data.labels) ? [...data.labels] : [],
      datasets: [{
        data: hasData ? [...data.values] : [1],
        backgroundColor: hasData ? [...data.colors] : ['#e5e7eb50']
      }]
    };
  });

  readonly leaveBalanceData = computed<ChartData<'doughnut'>>(() => {
    const data = this.chartsDataMap()['Leave Balance'];
    if (!data) return { labels: [], datasets: [] };
    const hasData = (data.values || []).some((v: number) => v > 0);
    return {
      labels: Array.isArray(data.labels) ? [...data.labels] : [],
      datasets: [{
        data: hasData ? [...data.values] : [1],
        backgroundColor: hasData ? [...data.colors] : ['#e5e7eb50']
      }]
    };
  });

  readonly requestsData = computed<ChartData<'doughnut'>>(() => {
    const data = this.chartsDataMap()['Requests'];
    if (!data) return { labels: [], datasets: [] };
    const hasData = (data.values || []).some((v: number) => v > 0);
    return {
      labels: Array.isArray(data.labels) ? [...data.labels] : [],
      datasets: [{
        data: hasData ? [...data.values] : [1],
        backgroundColor: hasData ? [...data.colors] : ['#e5e7eb50']
      }]
    };
  });

  readonly goalsData = computed<ChartData<'doughnut'>>(() => {
    const data = this.chartsDataMap()['Goals'];
    if (!data) return { labels: [], datasets: [] };
    const hasData = (data.values || []).some((v: number) => v > 0);
    return {
      labels: Array.isArray(data.labels) ? [...data.labels] : [],
      datasets: [{
        data: hasData ? [...data.values] : [1],
        backgroundColor: hasData ? [...data.colors] : ['#e5e7eb50']
      }]
    };
  });

  readonly turnoverData = computed<ChartData<'bar'>>(() => {
    const data = this.chartsDataMap()['Turnover'];
    if (!data) return { labels: [], datasets: [] };
    return {
      labels: this.monthLabelsForLanguage(),
      datasets: [{
        label: this.t().cards?.turnover || 'Turnover',
        data: Array.isArray(data.values) ? [...data.values] : [],
        backgroundColor: Array.isArray(data.colors) ? [...data.colors] : [],
        borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false,
        barPercentage: 1.1,
        categoryPercentage: 0.6
      }]
    };
  });

  readonly employeeOnboardingData = computed<ChartData<'doughnut'>>(() => {
    const data = this.chartsDataMap()['Employee Onboarding'];
    if (!data) return { labels: [], datasets: [] };
    const hasData = (data.values || []).some((v: number) => v > 0);
    return {
      labels: Array.isArray(data.labels) ? [...data.labels] : [],
      datasets: [{
        data: hasData ? [...data.values] : [1],
        backgroundColor: hasData ? [...data.colors] : ['#e5e7eb50']
      }]
    };
  });

  readonly activeDepartmentsData = computed<ChartData<'doughnut'>>(() => {
    const data = this.chartsDataMap()['Active Departments'];
    if (!data) return { labels: [], datasets: [] };
    const hasData = (data.values || []).some((v: number) => v > 0);
    return {
      labels: Array.isArray(data.labels) ? [...data.labels] : [],
      datasets: [{
        data: hasData ? [...data.values] : [1],
        backgroundColor: hasData ? [...data.colors] : ['#e5e7eb50']
      }]
    };
  });

  readonly deptGuidelinesData = computed<ChartData<'doughnut'>>(() => {
    const data = this.chartsDataMap()['Department Guidelines'];
    if (!data) return { labels: [], datasets: [] };
    const hasData = (data.values || []).some((v: number) => v > 0);
    return {
      labels: Array.isArray(data.labels) ? [...data.labels] : [],
      datasets: [{
        data: hasData ? [...data.values] : [1],
        backgroundColor: hasData ? [...data.colors] : ['#e5e7eb50']
      }]
    };
  });

  readonly employeeData = computed<ChartData<'bar'>>(() => {
    const data = this.chartsDataMap()['Employees'];
    if (!data || !Array.isArray(data.raw)) return { labels: [], datasets: [] };
    
    return {
      labels: this.monthLabelsForLanguage(),
      datasets: [
        { label: this.t().labels?.hired || 'Hired', data: data.raw.map((v: any) => v.active?.value ?? 0), backgroundColor: '#98DFC0', borderRadius: { topLeft: 10, topRight: 10 }, borderSkipped: false },
        { label: this.t().labels?.terminated || 'Terminated', data: data.raw.map((v: any) => v.terminate?.value ?? 0), backgroundColor: '#B83D4A', borderRadius: { topLeft: 10, topRight: 10 }, borderSkipped: false },
        { label: this.t().labels?.resigned || 'Resigned', data: data.raw.map((v: any) => v.resign?.value ?? 0), backgroundColor: '#FF8F8F', borderRadius: { topLeft: 10, topRight: 10 }, borderSkipped: false }
      ]
    };
  });

  // --- Select Option ViewModels ---
  readonly months = computed(() => {
    const currentMonth = new Date().getMonth() + 1;
    const m = this.t().months || {};
    const names = [m.jan, m.feb, m.mar, m.apr, m.may, m.jun, m.jul, m.aug, m.sep, m.oct, m.nov, m.dec];
    const results = [{ value: currentMonth, label: m.this_month || 'This Month' }];
    if (currentMonth > 1) results.push({ value: currentMonth - 1, label: m.last_month || 'Last Month' });
    for (let i = currentMonth - 2; i >= 1; i--) results.push({ value: i, label: names[i - 1] || 'Month' });
    return results;
  });

  readonly years = computed(() => {
    const currentYear = new Date().getFullYear();
    const y = this.t().years || {};
    return [
      { value: currentYear.toString(), label: y.this_year || 'This Year' },
      { value: (currentYear - 1).toString(), label: y.last_year || 'Last Year' },
      { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() }
    ];
  });

  // --- Integration Methods ---
  getTotalFor(key: string): number {
    const data = this.chartsDataMap()[key];
    return data ? (data.values || []).reduce((a: number, b: number) => a + b, 0) : 0;
  }

  onAlertClick(alert: any): void { 
    this.router.navigateByUrl('/dashboard'); 
  }

  private getAllDepartments(): void {
    this.departmentsService.getAllDepartment(1, 10000).subscribe(res => this.departments.set(res.data.list_items || []));
  }
  private getAllBranches(): void {
    this.branchesService.getAllBranches(1, 10000).subscribe(res => this.branches.set(res.data.list_items || []));
  }
  private getAllLeaveBalance(): void {
    this.leaveBalanceService.getAllLeaveBalance({page: 1, per_page: 10000}).subscribe(res => this.leaveBalancesData.set(res.data.list_items || []));
  }

  // --- Constant Chart Options ---
  readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    plugins: { legend: { display: false } }
  };

  readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: true, color: '#C2C2C2' }, ticks: { color: '#2C435D', font: { size: 16 } } },
      y: { grid: { display: true, color: '#C2C2C2' }, ticks: { color: '#2C435D', font: { size: 16 } } }
    }
  };
}
