import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { EditEmployeeSharedService } from './services/edit-employee-shared.service';
import { EditStepperNavigationComponent } from './edit-stepper-navigation/edit-stepper-navigation.component';
import { EditMainInformationStepComponent } from './edit-main-information-step/edit-main-information-step.component';
import { EditJobDetailsStepComponent } from './edit-job-details-step/edit-job-details-step.component';
import { EditAttendanceDetailsStepComponent } from './edit-attendance-details-step/edit-attendance-details-step.component';
import { EditInsuranceDetailsStepComponent } from './edit-insurance-details-step/edit-insurance-details-step.component';

@Component({
  standalone: true,
  selector: 'app-edit-employee',
  imports: [
    PageHeaderComponent,
    PopupComponent,
    ReactiveFormsModule,
    EditStepperNavigationComponent,
    EditMainInformationStepComponent,
    EditJobDetailsStepComponent,
    EditAttendanceDetailsStepComponent,
    EditInsuranceDetailsStepComponent
  ],
  providers: [DatePipe],
  templateUrl: './edit-employee.component.html',
  styleUrls: ['./edit-employee.component.css']
})
export class EditEmployeeComponent implements OnInit {
  // Dependency Injection
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private datePipe = inject(DatePipe);
  private employeeService = inject(EmployeeService);
  private toasterMessageService = inject(ToasterMessageService);
  public sharedService = inject(EditEmployeeSharedService);

  employeeId!: number;

  ngOnInit(): void {
    console.log('[EditEmployee] Component initialized');
    console.log('[EditEmployee] Shared service:', this.sharedService);
    console.log('[EditEmployee] Employee form exists:', !!this.sharedService.employeeForm);

    if (this.sharedService.employeeForm) {
      this.logFormState('Initial form state');
    }

    this.sharedService.currentStep.set(1);
    this.route.params.subscribe(params => {
      this.employeeId = +params['id'];
      console.log('[EditEmployee] Route params received, employeeId:', this.employeeId);
      if (this.employeeId) {
        this.loadEmployee();
      } else {
        console.warn('[EditEmployee] No employee ID found in route params');
      }
    });
  }

  private logFormState(label: string): void {
    console.log(`[EditEmployee] ===== ${label} =====`);
    const form = this.sharedService.employeeForm;

    if (!form) {
      console.error('[EditEmployee] Form is null or undefined!');
      return;
    }

    console.log('[EditEmployee] Form status:', form.status);
    console.log('[EditEmployee] Form valid:', form.valid);
    console.log('[EditEmployee] Form invalid:', form.invalid);
    console.log('[EditEmployee] Form errors:', form.errors);
    console.log('[EditEmployee] Form value:', form.value);
    console.log('[EditEmployee] Form raw value:', form.getRawValue());

    // Check all form groups and their controls
    this.logFormGroupErrors('main_information', form.get('main_information'));
    this.logFormGroupErrors('job_details', form.get('job_details'));
    this.logFormGroupErrors('contract_details', form.get('contract_details'));
    this.logFormGroupErrors('attendance_details', form.get('attendance_details'));
    this.logFormGroupErrors('insurance_details', form.get('insurance_details'));

    // Check hasChanges
    const hasChanges = this.sharedService.hasChanges();
    console.log('[EditEmployee] hasChanges():', hasChanges);

    // Check button disabled state
    const isDisabled = this.isSaveButtonDisabled();
    console.log('[EditEmployee] Save button disabled:', isDisabled);
    console.log(`[EditEmployee] ===== End ${label} =====`);
  }

  private logFormGroupErrors(groupName: string, group: any): void {
    if (!group) {
      console.warn(`[EditEmployee] Form group '${groupName}' is null`);
      return;
    }

    console.log(`[EditEmployee] --- ${groupName} ---`);
    console.log(`  Status: ${group.status}, Valid: ${group.valid}, Invalid: ${group.invalid}`);
    console.log(`  Errors:`, group.errors);
    console.log(`  Value:`, group.value);

    if (group.invalid) {
      Object.keys(group.controls || {}).forEach(controlName => {
        const control = group.get(controlName);
        if (control && control.invalid) {
          console.log(`  [INVALID] ${controlName}:`, {
            errors: control.errors,
            value: control.value,
            disabled: control.disabled,
            touched: control.touched,
            dirty: control.dirty
          });
        }
      });
    }
  }

  private loadEmployee(): void {
    this.sharedService.resetEmployeeData();
    this.sharedService.currentStep.set(1);
    this.sharedService.isLoading.set(true);
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: res => {
        const employeeData = res.data.object_info;
        console.log('[EditEmployee] Loading employee data:', employeeData);
        this.sharedService.loadEmployeeData(employeeData);
        this.sharedService.isLoading.set(false);
        console.log('[EditEmployee] Employee data loaded, form initialized');

        // Log form state after data is loaded
        setTimeout(() => {
          this.logFormState('After employee data loaded');
        }, 100);
      },
      error: err => {
        console.error('[EditEmployee] Error loading employee:', err);
        this.sharedService.errMsg.set('Failed to load employee data.');
        this.sharedService.isLoading.set(false);
      }
    });
  }

  openModal() {
    this.sharedService.isModalOpen.set(true);
  }

  closeModal() {
    this.sharedService.isModalOpen.set(false);
  }

  confirmAction() {
    this.sharedService.isModalOpen.set(false);
    this.router.navigate(['/employees/all-employees']);
  }

  // Method to check button disabled state and log details
  isSaveButtonDisabled(): boolean {
    const hasChanges = this.sharedService.hasChanges();
    const isInvalid = this.sharedService.employeeForm.invalid;
    const isLoading = this.sharedService.isLoading();
    const isDisabled = !hasChanges || isInvalid || isLoading;

    console.log('[EditEmployee] Save button disabled state check:');
    console.log('  - hasChanges():', hasChanges);
    console.log('  - employeeForm.invalid:', isInvalid);
    console.log('  - isLoading():', isLoading);
    console.log('  - Final disabled state:', isDisabled);
    console.log('  - Form errors:', this.sharedService.employeeForm.errors);
    console.log('  - Form status:', this.sharedService.employeeForm.status);

    return isDisabled;
  }

  onSubmit(): void {
    if (this.sharedService.isLoading()) {
      return;
    }

    if (this.sharedService.employeeForm.invalid) {
      this.sharedService.errMsg.set('Please correct errors in the form.');
      return;
    }

    this.sharedService.errMsg.set('');
    this.sharedService.isLoading.set(true);

    const payload = this.sharedService.getFormData();

    if (!payload) {
      this.sharedService.errMsg.set('Employee data not loaded.');
      this.sharedService.isLoading.set(false);
      return;
    }

    this.employeeService.updateEmployee(payload).subscribe({
      next: () => {
        this.toasterMessageService.showSuccess('Employee updated successfully');
        this.router.navigate(['/employees/all-employees']);
      },
      error: (err: any) => {
        this.sharedService.isLoading.set(false);

        // Handle API error response with error_handling array
        if (err?.error?.data?.error_handling && Array.isArray(err.error.data.error_handling)) {
          this.sharedService.errMsg.set('Please check the form for errors.');
        } else {
          this.sharedService.errMsg.set(err?.error?.message || 'An error occurred while updating the employee.');
        }
      }
    });
  }
}
