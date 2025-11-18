import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router, ActivatedRoute } from '@angular/router';
import { ViewChild } from '@angular/core';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ContractsTabComponent } from '../view-employee/tabs/contracts-tab/contracts-tab.component';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { Employee, Subscription } from '../../../../core/interfaces/employee';
import { WorkSchedule } from '../../../../core/interfaces/work-schedule';
import { WorkSchaualeService } from '../../../../core/services/attendance/work-schaduale/work-schauale.service';
import { OnboardingChecklistComponent, OnboardingListItem } from '../../../shared/onboarding-checklist/onboarding-checklist.component';

@Component({
  selector: 'app-view-new-joiner',
  standalone: true,
  imports: [PageHeaderComponent, CommonModule, PopupComponent, OverlayFilterBoxComponent, FormsModule, ContractsTabComponent, OnboardingChecklistComponent],
  providers: [DatePipe],
  templateUrl: './view-new-joiner.component.html',
  styleUrl: './view-new-joiner.component.css'
})
export class ViewNewJoinerComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private workScheduleService = inject(WorkSchaualeService);
  private route = inject(ActivatedRoute);

  employee: Employee | null = null;
  subscription: Subscription | null = null;
  workScheduleData: WorkSchedule | null = null;
  loading = false;
  employeeId: number = 0;
  todayFormatted: string = '';
  // Reschedule overlay reference
  @ViewChild('rescheduleBox') rescheduleBox!: OverlayFilterBoxComponent;
  // Model for new join date
  newJoinDate: string = '';

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.employeeId = +params['id'];
      if (this.employeeId) {
        this.loadEmployeeData();
      }
    });
  }

  loadEmployeeData(): void {
    this.loading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (response) => {
        this.employee = response.data.object_info;
        this.subscription = response.data.subscription;
        this.loading = false;

        // Load work schedule data if employee has a work schedule
        if (this.employee?.job_info?.work_schedule?.id) {
          this.loadWorkScheduleData(this.employee.job_info.work_schedule.id);
        }
      },
      error: (error) => {
        console.error('Error loading new joiner:', error);
        this.loading = false;
      }
    });
  }

  loadWorkScheduleData(workScheduleId: number): void {
    this.workScheduleService.showWorkSchedule(workScheduleId).subscribe({
      next: (response) => {
        this.workScheduleData = response.data.object_info;
      },
      error: (error) => {
        console.error('Error loading work schedule:', error);
      }
    });
  }

  // Legacy property for backward compatibility with template
  get employeeData() {
    if (!this.employee) {
      return {
        id: 0,
        name: "",
        employeeStatus: "New Joiner",
        accountStatus: "inactive" as 'active' | 'inactive' | 'pending' | 'disabled',
        jobTitle: "",
        branch: "",
        joinDate: ""
      };
    }

    return {
      id: this.employee.id,
      name: this.employee.contact_info.name,
      employeeStatus: this.getEmployeeStatus(this.employee),
      accountStatus: this.getAccountStatus(this.employee.employee_active),
      jobTitle: this.employee.job_info.job_title.name,
      branch: this.employee.job_info.branch.name,
      joinDate: this.employee.job_info.start_contract
    };
  }

  // Helper method to convert string employee_active to account status
  private getAccountStatus(employeeActive: string): 'active' | 'inactive' | 'pending' | 'disabled' {
    switch (employeeActive?.toLowerCase()) {
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      case 'disabled':
        return 'disabled';
      case 'inactive':
      default:
        return 'inactive';
    }
  }

  // Check if employee is active
  get isEmployeeActive(): boolean {
    return this.employee?.employee_active?.toLowerCase() === 'active';
  }

  // Check if employee is pending
  get isEmployeePending(): boolean {
    return this.employee?.employee_active?.toLowerCase() === 'pending';
  }

  // Check if employee is disabled
  get isEmployeeDisabled(): boolean {
    return this.employee?.employee_active?.toLowerCase() === 'disabled';
  }

  // Check if employee is inactive
  get isEmployeeInactive(): boolean {
    const status = this.employee?.employee_active?.toLowerCase();
    return status === 'inactive' || !status;
  }

  // Determine employee status based on contract dates
  private getEmployeeStatus(employee: Employee): string {
    const today = new Date();
    const startDate = new Date(employee.job_info.start_contract);

    if (startDate > today) {
      return 'New Joiner'; // Contract hasn't started yet
    } else if (startDate.toDateString() === today.toDateString()) {
      return 'Joining Today'; // Contract starts today
    } else {
      const daysDiff = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
      if (daysDiff <= 90) {
        return 'New Employee'; // Within first 90 days
      } else {
        return 'Employed'; // More than 90 days
      }
    }
  }

  // Helper method to check subscription permissions
  hasEmployeePermission(action: string): boolean {
    if (!this.subscription) return false;

    const personnelFeature = this.subscription.features.find(f => f.main.name === 'Personnel');
    if (!personnelFeature || !personnelFeature.is_support) return false;

    const employeeSub = personnelFeature.sub_list.find(s => s.sub.name === 'Employees');
    if (!employeeSub || !employeeSub.is_support) return false;

    const allowedAction = employeeSub.allowed_actions.find(a => a.name === action);
    return allowedAction ? allowedAction.status : false;
  }

  // Helper method to get remaining action count
  getEmployeeActionCount(action: string): number {
    if (!this.subscription) return 0;

    const personnelFeature = this.subscription.features.find(f => f.main.name === 'Personnel');
    if (!personnelFeature) return 0;

    const employeeSub = personnelFeature.sub_list.find(s => s.sub.name === 'Employees');
    if (!employeeSub) return 0;

    const allowedAction = employeeSub.allowed_actions.find(a => a.name === action);
    return allowedAction ? allowedAction.count : 0;
  }

  // Helper method to check if action has infinite usage
  hasInfiniteEmployeePermission(action: string): boolean {
    if (!this.subscription) return false;

    const personnelFeature = this.subscription.features.find(f => f.main.name === 'Personnel');
    if (!personnelFeature) return false;

    const employeeSub = personnelFeature.sub_list.find(s => s.sub.name === 'Employees');
    if (!employeeSub) return false;

    const allowedAction = employeeSub.allowed_actions.find(a => a.name === action);
    return allowedAction ? allowedAction.infinity : false;
  }

  // Check if join date is today
  isJoiningToday(): boolean {
    if (!this.employee) return false;
    const today = new Date();
    const joinDate = new Date(this.employee.job_info.start_contract);
    return joinDate.toDateString() === today.toDateString();
  }

  // Check if join date is in the future
  isJoiningFuture(): boolean {
    if (!this.employee) return false;
    const today = new Date();
    const joinDate = new Date(this.employee.job_info.start_contract);
    return joinDate > today;
  }

  // Get formatted join date
  getFormattedJoinDate(): string {
    if (!this.employee) return '';
    return this.datePipe.transform(this.employee.job_info.start_contract, 'dd MMMM yyyy') || '';
  }

  // Get formatted working days
  getWorkingDays(): string {
    if (!this.workScheduleData?.system?.days) return 'N/A';

    const days = this.workScheduleData.system.days;
    const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const workingDays = dayOrder
      .filter(day => (days as any)[day])
      .map(day => day.charAt(0).toUpperCase() + day.slice(1));

    return workingDays.join(', ');
  }

  // Get employment type display
  getEmploymentTypeDisplay(): string {
    if (!this.workScheduleData?.system?.employment_type) return 'N/A';

    const employmentType = this.workScheduleData.system.employment_type;
    switch (employmentType) {
      case 1: return 'Full-time';
      case 2: return 'Part-time';
      case 3: return 'Per Hour';
      default: return 'N/A';
    }
  }

  // Get work schedule type display
  getWorkScheduleTypeDisplay(): string {
    if (!this.workScheduleData?.system?.work_schedule_type) return 'N/A';

    const scheduleType = this.workScheduleData.system.work_schedule_type;
    switch (scheduleType) {
      case 1: return 'Fixed';
      case 2: return 'Flexible';
      case 3: return 'Remote';
      default: return 'N/A';
    }
  }

  // Get shift hours display
  getShiftHoursDisplay(): string {
    if (!this.workScheduleData?.system?.shift_hours) return 'N/A';
    return `${this.workScheduleData.system.shift_hours} hours`;
  }

  // Get shift range display
  getShiftRangeDisplay(): string {
    if (!this.workScheduleData?.system?.shift_range) return 'N/A';
    const range = this.workScheduleData.system.shift_range;
    return `${range.from} to ${range.to}`;
  }

  // Activate employee (mark as joined)
  activateEmployee(): void {
    if (this.employee) {
      this.employeeService.updateEmployeeStatus(this.employee.id, true).subscribe({
        next: (response: any) => {
          // Update local employee status
          if (this.employee) {
            this.employee.employee_active = 'Active';
          }
          this.openSuccessModal();
        },
        error: (error: any) => {
          console.error('Error activating employee:', error);
          this.toasterMessageService.sendMessage('Failed to activate employee');
        }
      });
    }
  }




  // popups
  isModalOpen = false;
  isSuccessModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  // Open the reschedule join date overlay
  openRescheduleOverlay(): void {
    this.rescheduleBox.openOverlay();
  }

  // Submit the rescheduled join date
  submitReschedule(): void {
    if (this.employee && this.newJoinDate) {
      this.employeeService.rescheduleJoinDate(this.employee.id, this.newJoinDate).subscribe({
        next: () => {
          this.toasterMessageService.sendMessage('Join date rescheduled successfully');
          this.rescheduleBox.closeOverlay();
          this.loadEmployeeData();
        },
        error: () => {
          this.toasterMessageService.sendMessage('Failed to reschedule join date');
        }
      });
    }
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/employees/all-employees']);
  }

  openSuccessModal() {
    this.isSuccessModalOpen = true;
  }

  closeSuccessModal() {
    this.isSuccessModalOpen = false;
  }

  viewEmployees() {
    this.closeSuccessModal();
    this.router.navigate(['/employees/all-employees']);
  }

  createAnother() {
    this.closeSuccessModal();
    // Reset form or navigate to create again
  }

  // Resend activation link to employee email
  resendActiveLink(): void {
    if (this.employee) {
      this.employeeService.resendActiveLink(this.employee.id).subscribe({
        next: () => {
          this.toasterMessageService.sendMessage('Activation link resent successfully');
        },
        error: (error) => {
          console.error('Error resending active link:', error);
        }
      });
    }
  }

  // Onboarding checklist properties and methods
  isOnboardingModalOpen: boolean = false;
  loadingChecklistItemTitle: string | null = null;

  get onboardingCompleted(): number {
    if (!this.employee?.onboarding_list) return 0;
    return this.employee.onboarding_list.filter(item => item.status === true).length;
  }

  get onboardingTotal(): number {
    if (!this.employee?.onboarding_list) return 0;
    return this.employee.onboarding_list.length;
  }

  openOnboardingModal(): void {
    this.isOnboardingModalOpen = true;
  }

  closeOnboardingModal(): void {
    this.isOnboardingModalOpen = false;
  }

  onChecklistItemClick(item: OnboardingListItem): void {
    this.updateChecklistItem(item);
  }

  updateChecklistItem(item: { title: string; status: boolean }): void {
    if (!this.employee || item.status || this.loadingChecklistItemTitle) {
      return; // Don't update if already completed or currently loading
    }

    // Set loading state for the clicked item
    this.loadingChecklistItemTitle = item.title;

    // Update the clicked item status to true, keep all others as they were
    const updatedOnboardingList = (this.employee.onboarding_list || []).map(listItem => {
      if (listItem.title === item.title) {
        return { ...listItem, status: true };
      }
      return listItem; // Keep all other items as they were (true or false)
    });

    // Build job_details payload matching manage-employee structure
    const managementLevelId = this.employee.job_info.management_level?.id;
    const jobDetailsPayload: any = {
      years_of_experience: this.employee.job_info.years_of_experience || 0,
      management_level: managementLevelId ? parseInt(String(managementLevelId), 10) : null,
      work_schedule_id: this.employee.job_info.work_schedule?.id ? parseInt(String(this.employee.job_info.work_schedule.id), 10) : null,
      activate_attendance_rules: this.employee.job_info.activate_attendance_rules ?? false
    };

    // Add job_title_id if exists
    if (this.employee.job_info.job_title?.id) {
      jobDetailsPayload.job_title_id = parseInt(String(this.employee.job_info.job_title.id), 10);
    }

    // Add branch/department/section based on management level (matching manage-employee logic)
    if (managementLevelId === 2) {
      if (this.employee.job_info.branch?.id) {
        jobDetailsPayload.branch_id = parseInt(String(this.employee.job_info.branch.id), 10);
      }
    }
    if (managementLevelId === 3) {
      if (this.employee.job_info.branch?.id) {
        jobDetailsPayload.branch_id = parseInt(String(this.employee.job_info.branch.id), 10);
      }
      if (this.employee.job_info.department?.id) {
        jobDetailsPayload.department_id = parseInt(String(this.employee.job_info.department.id), 10);
      }
    }
    if (managementLevelId === 5 || managementLevelId === 4) {
      if (this.employee.job_info.branch?.id) {
        jobDetailsPayload.branch_id = parseInt(String(this.employee.job_info.branch.id), 10);
      }
      if (this.employee.job_info.department?.id) {
        jobDetailsPayload.department_id = parseInt(String(this.employee.job_info.department.id), 10);
      }
      if (this.employee.job_info.section?.id) {
        jobDetailsPayload.section_id = parseInt(String(this.employee.job_info.section.id), 10);
      }
    }

    // Format date for API (YYYY-M-D format)
    const formatDateForAPI = (dateStr: string): string => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    };

    // Build contract_details payload matching manage-employee structure
    const contractDetailsPayload: any = {
      employment_type: this.employee.job_info.employment_type.id,
      work_mode: this.employee.job_info.work_mode.id,
      days_on_site: this.employee.job_info.days_on_site ? parseInt(String(this.employee.job_info.days_on_site), 10) : 0,
      insurance_salary: this.employee.job_info.insurance_salary ? parseFloat(String(this.employee.job_info.insurance_salary)) : 0,
      gross_insurance: this.employee.job_info.gross_insurance ? parseFloat(String(this.employee.job_info.gross_insurance)) : 0
    };

    // Build the complete employee update payload matching manage-employee structure
    const requestData: any = {
      main_information: {
        code: this.employee.code,
        name_english: this.employee.contact_info.name,
        name_arabic: this.employee.contact_info.name_arabic || '',
        gender: this.employee.contact_info.gender.id,
        mobile: {
          country_id: this.employee.contact_info.mobile.country.id,
          number: parseInt(String(this.employee.contact_info.mobile.number), 10)
        },
        personal_email: this.employee.contact_info.email,
        marital_status: this.employee.contact_info.marital_status.id,
        date_of_birth: formatDateForAPI(this.employee.contact_info.date_of_birth),
        address: this.employee.contact_info.address || ''
      },
      job_details: jobDetailsPayload,
      contract_details: contractDetailsPayload,
      onboarding_list: updatedOnboardingList
    };

    const payload = {
      request_data: {
        id: this.employee.id,
        ...requestData
      }
    };

    this.employeeService.updateEmployee(payload).subscribe({
      next: (response: any) => {
        this.toasterMessageService.showSuccess('Checklist item updated successfully');
        // Update local onboarding list so the view reflects the change without reloading the whole page
        if (this.employee) {
          this.employee.onboarding_list = updatedOnboardingList;
        }
        // Clear loading state
        this.loadingChecklistItemTitle = null;
      },
      error: (error: any) => {
        console.error('Error updating checklist item:', error);
        this.toasterMessageService.showError('Failed to update checklist item');
        // Clear loading state on error
        this.loadingChecklistItemTitle = null;
      }
    });
  }
}
