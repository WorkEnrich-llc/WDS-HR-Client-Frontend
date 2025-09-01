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
    this.requestForm = this.fb.group({
      main_information: this.fb.group({
        employee_id: [null, Validators.required],
        request_type: [null, Validators.required]
      }),
      request_details: this.fb.group({
        leave_type: [null],
        from_date: ['', Validators.required],
        to_date: ['', Validators.required],
        reason: ['', [Validators.required, Validators.minLength(10)]],
        notes: ['']
      })
    });
  }

  private setupFormWatchers(): void {
    // Watch for request type changes to handle leave type requirement
    this.mainInformation.get('request_type')?.valueChanges.subscribe(requestType => {
      const leaveTypeControl = this.requestDetails.get('leave_type');
      if (requestType === 1) { // Leave Request
        leaveTypeControl?.setValidators([Validators.required]);
      } else {
        leaveTypeControl?.clearValidators();
      }
      leaveTypeControl?.updateValueAndValidity();
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
