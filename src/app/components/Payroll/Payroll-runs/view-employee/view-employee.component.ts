import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { PayrollRunService } from '../../../../core/services/payroll/payroll-run.service';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ViewEmployeeSkeletonLoaderComponent } from './view-employee-skeleton-loader.component';

@Component({
  selector: 'app-view-employee',
  imports: [PageHeaderComponent, CommonModule, ViewEmployeeSkeletonLoaderComponent],
  templateUrl: './view-employee.component.html',
  styleUrl: './view-employee.component.css'
})
export class ViewEmployeeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private employeeService = inject(EmployeeService);
  private payrollRunService = inject(PayrollRunService);

  employeeId: number = 0;
  payrollRunId: number = 0;
  employeeDetails: any = null;
  isLoading: boolean = true;

  // Parsed data properties
  contactInfo: any = null;
  jobInfo: any = null;
  currentContract: any = null;
  employeeStatus: string = '';
  employeeActive: string = '';
  onboardingList: any[] = [];
  onboarding: { basic?: any[] } = {};

  // Payroll data properties
  payrollTitle: string = '';
  payrollHeaders: any[] = [];
  payrollRow: any = null;

  // Make Math available in template
  Math = Math;

  ngOnInit(): void {
    // Get employee ID and payroll run ID from route params
    // Route pattern: view-employee-payroll/:payrollId/:id
    this.route.params.subscribe(params => {
      this.payrollRunId = +params['payrollId'];
      this.employeeId = +params['id'];
      if (this.employeeId && this.payrollRunId) {
        this.fetchEmployeeDetails();
      }
    });
  }

  private fetchEmployeeDetails(): void {
    this.isLoading = true;

    // Call both endpoints concurrently
    forkJoin({
      employeeDetails: this.employeeService.getEmployeeById(this.employeeId),
      payrollRunEmployee: this.payrollRunService.getViewEmployee(this.payrollRunId, this.employeeId)
    }).subscribe({
      next: (responses: any) => {
        const response = responses.employeeDetails;
        const payrollResponse = responses.payrollRunEmployee;

        this.employeeDetails = response.data;
        if (response.data && response.data.object_info) {
          const objectInfo = response.data.object_info;

          // Parse contact info
          this.contactInfo = objectInfo.contact_info || {};

          // Parse job info
          this.jobInfo = objectInfo.job_info || {};

          // Parse current contract
          this.currentContract = objectInfo.current_contract || {};

          // Parse status fields
          this.employeeStatus = objectInfo.employee_status || '';
          this.employeeActive = objectInfo.employee_active || '';

          // Parse onboarding list
          const objectInfoAny = objectInfo as any;
          this.onboarding = objectInfoAny.onboarding || {};
          if (this.onboarding && this.onboarding.basic && Array.isArray(this.onboarding.basic)) {
            this.onboardingList = this.onboarding.basic.filter((item: any) => item.is_active);
          }
        }

        // Handle payroll run employee response
        if (payrollResponse && payrollResponse.data) {
          this.payrollTitle = payrollResponse.data.title || '';
          this.payrollHeaders = payrollResponse.data.headers || [];
          this.payrollRow = payrollResponse.data.row || {};
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching employee details:', err);
        this.isLoading = false;
      }
    });
  }

  // Helper method to check if employee is active
  get isEmployeeActive(): boolean {
    return this.employeeActive?.toLowerCase() === 'active';
  }

  // Helper method to check if employee is pending
  get isEmployeePending(): boolean {
    return this.employeeActive?.toLowerCase() === 'pending';
  }

  // Helper method to check if employee is disabled
  get isEmployeeDisabled(): boolean {
    return this.employeeActive?.toLowerCase() === 'disabled';
  }

  // Helper method to check if employee is inactive
  get isEmployeeInactive(): boolean {
    return this.employeeActive?.toLowerCase() === 'inactive';
  }

  // Helper method to get mobile number formatted
  getFormattedMobile(): string {
    if (!this.contactInfo || !this.contactInfo.mobile) return '';
    const mobile = this.contactInfo.mobile;
    const prefix = mobile.country?.phone_prefix || '+20';
    return `${prefix} ${mobile.number || ''}`;
  }

  // Helper method to get contract status color
  getContractStatusColor(status: string): string {
    if (!status) return 'text-secondary';

    const statusLower = status.toLowerCase();

    if (statusLower === 'active') {
      return 'text-success';
    } else if (statusLower === 'expired') {
      return 'text-danger';
    } else if (statusLower === 'pending') {
      return 'text-warning';
    }

    return 'text-secondary';
  }
}
