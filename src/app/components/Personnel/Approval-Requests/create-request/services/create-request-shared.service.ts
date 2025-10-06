import { Injectable, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class CreateRequestSharedService {
  private fb = new FormBuilder();
  // Reactive Forms
  requestForm!: FormGroup;

  // Component state as signals
  readonly currentStep = signal<number>(1);
  readonly errMsg = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly isModalOpen = signal<boolean>(false);
  readonly isSuccessModalOpen = signal<boolean>(false);

  // Options for dropdowns
  readonly employees = signal<{ id: number; name: string }[]>([
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Mike Johnson' }
  ]);

  readonly requestTypes = signal<{ id: number; name: string }[]>([
    { id: 1, name: 'Leave Request' },
    { id: 2, name: 'Overtime Request' },
    { id: 3, name: 'Permission Request' }
  ]);

  readonly leaveTypes = signal<{ id: number; name: string }[]>([
    { id: 1, name: 'Annual Leave' },
    { id: 2, name: 'Sick Leave' },
    { id: 3, name: 'Emergency Leave' },
    { id: 4, name: 'Maternity Leave' }
  ]);

  constructor() {
    this.initializeForm();
    this.setupFormWatchers();
  }

  private initializeForm(): void {
    // Split request details into typed sub-groups (leave, overtime, permission)
    // This keeps each type's logic isolated and makes it easy to add fields later.
    this.requestForm = this.fb.group({
      main_information: this.fb.group({
        employee_id: ['', Validators.required],
        request_type: ['', Validators.required]
      }),
      request_details: this.fb.group({
        // Leave-specific fields
        leave: this.fb.group({
          leave_type: ['', Validators.required],
          from_date: ['',Validators.required],
          to_date: [''],
          reason: ['']
        }),
        // Permission-specific fields
        permission: this.fb.group({
          permission_type: ['early',Validators.required], // 'early' | 'late'
          date: ['',Validators.required],
          time: ['']
        }),
        // Overtime-specific fields
        overtime: this.fb.group({
          date: ['',Validators.required],
          employee_logged: [false],
          from: [''],
          to: [''],
          override_rates: [false],
          custom_rate: ['']
        })
      })
    });
  }

  private setupFormWatchers(): void {
    // Watch for request type changes to handle leave type requirement
    this.mainInformation.get('request_type')?.valueChanges.subscribe(requestType => {
      const details = this.requestDetails;

      // Clear validators for all type-specific controls first
      // Leave
      const leave = details.get('leave') as FormGroup;
      const leaveType = leave.get('leave_type');

      // Permission
      const permission = details.get('permission') as FormGroup;
      const permDate = permission.get('date');
      const permTime = permission.get('time');
      const permType = permission.get('permission_type');

      // Overtime
      const overtime = details.get('overtime') as FormGroup;
      const otDate = overtime.get('date');
      const otFrom = overtime.get('from');
      const otTo = overtime.get('to');

      // Reset validators
      leaveType?.clearValidators();
      leave.get('from_date')?.clearValidators();
      leave.get('to_date')?.clearValidators();
      leave.get('reason')?.clearValidators();

      permDate?.clearValidators();
      permTime?.clearValidators();
      permType?.clearValidators();

      otDate?.clearValidators();
      otFrom?.clearValidators();
      otTo?.clearValidators();

      // Apply validators based on selected type
      if (requestType === 1) { // Leave Request
        leaveType?.setValidators([Validators.required]);
        leave.get('from_date')?.setValidators([Validators.required]);
        leave.get('to_date')?.setValidators([Validators.required]);
        leave.get('reason')?.setValidators([Validators.required, Validators.minLength(10)]);
      } else if (requestType === 2) { // Overtime Request
        otDate?.setValidators([Validators.required]);
        otFrom?.setValidators([Validators.required]);
        otTo?.setValidators([Validators.required]);
      } else if (requestType === 3) { // Permission Request
        permType?.setValidators([Validators.required]);
        permDate?.setValidators([Validators.required]);
        permTime?.setValidators([Validators.required]);
      }

      // Update validity of all changed controls
      [leaveType, leave.get('from_date'), leave.get('to_date'), leave.get('reason'), permType, permDate, permTime, otDate, otFrom, otTo]
        .forEach(c => c?.updateValueAndValidity());
    });
  }

  // Navigation methods
  nextStep(): void {
    if (this.currentStep() < 2) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 2) {
      this.currentStep.set(step);
    }
  }

  // Form reset
  resetForm(): void {
    this.requestForm.reset();
    this.currentStep.set(1);
    this.errMsg.set('');
    this.isLoading.set(false);
    this.isModalOpen.set(false);
    this.isSuccessModalOpen.set(false);
  }

  // Getters for form groups
  get mainInformation(): FormGroup {
    return this.requestForm.get('main_information') as FormGroup;
  }

  get requestDetails(): FormGroup {
    return this.requestForm.get('request_details') as FormGroup;
  }
}
