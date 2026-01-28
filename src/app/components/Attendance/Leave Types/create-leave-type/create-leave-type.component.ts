import { Component, inject, OnInit, HostListener, ElementRef } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DatePipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ApiToastHelper } from '../../../../core/helpers/api-toast.helper';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';

export const EMPLOYMENT_OPTIONS: { id: number; name: string }[] = [
  { id: 1, name: 'Full-Time' },
  { id: 2, name: 'Part-Time' },
  { id: 3, name: 'Per Hour' },
  { id: 4, name: 'Freelance' }
];

function employmentTypesRequired(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (!Array.isArray(v) || v.length === 0) return { required: true };
  return null;
}

@Component({
  selector: 'app-create-leave-type',
  imports: [PageHeaderComponent, PopupComponent, FormsModule, ReactiveFormsModule, NgClass],
  providers: [DatePipe],
  templateUrl: './create-leave-type.component.html',
  styleUrl: './create-leave-type.component.css'
})
export class CreateLeaveTypeComponent implements OnInit {

  private fb = inject(FormBuilder);
  private el = inject(ElementRef);

  employmentOptions = EMPLOYMENT_OPTIONS;
  employmentDropdownOpen = false;

  carryoverAllowed: boolean = false;
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService,
    private _LeaveTypeService: LeaveTypeService
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  ngOnInit(): void {
    this.setupCheckboxControl('extra_with_min_days_service', ['minDaysService']);
    this.setupAgeCheckbox();
    this.setupServiceCheckbox();
    this.setupExperienceCheckbox();
    // this.setupAccrualValidation(); // 

    const leaveLimitsControl = this.leaveType2.get('leave_limits');
    const maximumCarryoverControl = this.leaveType2.get('maximum_carryover_days');

    maximumCarryoverControl?.valueChanges.subscribe(() => {
      leaveLimitsControl?.updateValueAndValidity({ emitEvent: false });
      maximumCarryoverControl?.updateValueAndValidity({ emitEvent: false });
      if (this.errMsg && !maximumCarryoverControl?.hasError('exceedsLeaveLimit')) {
        this.errMsg = '';
      }
    });

    leaveLimitsControl?.valueChanges.subscribe(() => {
      maximumCarryoverControl?.updateValueAndValidity({ emitEvent: false });
      if (this.errMsg && !maximumCarryoverControl?.hasError('exceedsLeaveLimit')) {
        this.errMsg = '';
      }
    });
  }

  private validateCarryoverAgainstLimit = (control: AbstractControl): ValidationErrors | null => {
    if (!control) {
      return null;
    }

    const parent = control.parent as FormGroup | null;
    if (!parent) {
      return null;
    }

    if (!this.carryoverAllowed || control.disabled) {
      return null;
    }

    const leaveLimitControl = parent.get('leave_limits');
    const leaveLimitValue = Number(leaveLimitControl?.value);
    const maximumCarryoverValue = Number(control.value);

    if (isNaN(leaveLimitValue) || isNaN(maximumCarryoverValue)) {
      return null;
    }

    return maximumCarryoverValue > leaveLimitValue ? { exceedsLeaveLimit: true } : null;
  };

  private setupCheckboxControl(checkbox: string, dependentControls: string[]) {
    this.leaveType3.get(checkbox)?.valueChanges.subscribe(checked => {
      dependentControls.forEach(ctrl => {
        if (checked) {
          this.leaveType3.get(ctrl)?.enable();
          // Add validators when enabled
          this.leaveType3.get(ctrl)?.setValidators([
            Validators.required,
            Validators.pattern('^\\d+$')
          ]);
          this.leaveType3.get(ctrl)?.updateValueAndValidity();
        } else {
          this.leaveType3.get(ctrl)?.disable();
          this.leaveType3.get(ctrl)?.reset();
          this.leaveType3.get(ctrl)?.clearValidators();
          this.leaveType3.get(ctrl)?.updateValueAndValidity();
        }
      });
    });
  }

  // FormArray methods for age items
  get ageItems(): FormArray {
    return this.leaveType3.get('ageItems') as FormArray;
  }

  addAgeItem(): void {
    const isChecked = this.leaveType3.get('extra_with_age')?.value;
    const ageItem = this.fb.group({
      age: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]],
      extraDays: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]]
    });
    this.ageItems.push(ageItem);
  }

  removeAgeItem(index: number): void {
    this.ageItems.removeAt(index);
  }

  private setupAgeCheckbox(): void {
    // Initialize with one item if empty
    if (this.ageItems.length === 0) {
      this.addAgeItem();
    }

    this.leaveType3.get('extra_with_age')?.valueChanges.subscribe(checked => {
      if (checked) {
        this.ageItems.enable();
        // Add required validators when checkbox is checked
        this.ageItems.controls.forEach(control => {
          control.get('age')?.setValidators([Validators.required, Validators.pattern('^\\d+$')]);
          control.get('age')?.updateValueAndValidity({ emitEvent: false });
          control.get('extraDays')?.setValidators([Validators.required, Validators.pattern('^\\d+$')]);
          control.get('extraDays')?.updateValueAndValidity({ emitEvent: false });
        });
      } else {
        this.ageItems.disable();
        // Remove required validators when checkbox is unchecked
        this.ageItems.controls.forEach(control => {
          control.get('age')?.setValidators([Validators.pattern('^\\d+$')]);
          control.get('age')?.updateValueAndValidity({ emitEvent: false });
          control.get('extraDays')?.setValidators([Validators.pattern('^\\d+$')]);
          control.get('extraDays')?.updateValueAndValidity({ emitEvent: false });
        });
      }
    });
    // Initially disable the FormArray
    this.ageItems.disable();
  }

  get serviceItems(): FormArray {
    return this.leaveType3.get('serviceItems') as FormArray;
  }

  addServiceItem(): void {
    const isChecked = this.leaveType3.get('extra_with_service')?.value;
    const serviceItem = this.fb.group({
      yearsOfService: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]],
      extraDays: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]]
    });
    this.serviceItems.push(serviceItem);
  }

  removeServiceItem(index: number): void {
    this.serviceItems.removeAt(index);
  }

  private setupServiceCheckbox(): void {
    // Initialize with one item if empty
    if (this.serviceItems.length === 0) {
      this.addServiceItem();
    }

    this.leaveType3.get('extra_with_service')?.valueChanges.subscribe(checked => {
      if (checked) {
        this.serviceItems.enable();
        // Add required validators when checkbox is checked
        this.serviceItems.controls.forEach(control => {
          control.get('yearsOfService')?.setValidators([Validators.required, Validators.pattern('^\\d+$')]);
          control.get('yearsOfService')?.updateValueAndValidity({ emitEvent: false });
          control.get('extraDays')?.setValidators([Validators.required, Validators.pattern('^\\d+$')]);
          control.get('extraDays')?.updateValueAndValidity({ emitEvent: false });
        });
      } else {
        this.serviceItems.disable();
        // Remove required validators when checkbox is unchecked
        this.serviceItems.controls.forEach(control => {
          control.get('yearsOfService')?.setValidators([Validators.pattern('^\\d+$')]);
          control.get('yearsOfService')?.updateValueAndValidity({ emitEvent: false });
          control.get('extraDays')?.setValidators([Validators.pattern('^\\d+$')]);
          control.get('extraDays')?.updateValueAndValidity({ emitEvent: false });
        });
      }
    });
    // Initially disable the FormArray
    this.serviceItems.disable();
  }

  get experienceItems(): FormArray {
    return this.leaveType3.get('experienceItems') as FormArray;
  }

  addExperienceItem(): void {
    const isChecked = this.leaveType3.get('extra_with_experience')?.value;
    const experienceItem = this.fb.group({
      yearsOfExperience: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]],
      extraDays: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]]
    });
    this.experienceItems.push(experienceItem);
  }

  removeExperienceItem(index: number): void {
    this.experienceItems.removeAt(index);
  }

  private setupExperienceCheckbox(): void {
    // Initialize with one item if empty
    if (this.experienceItems.length === 0) {
      this.addExperienceItem();
    }

    this.leaveType3.get('extra_with_experience')?.valueChanges.subscribe(checked => {
      if (checked) {
        this.experienceItems.enable();
        // Add required validators when checkbox is checked
        this.experienceItems.controls.forEach(control => {
          control.get('yearsOfExperience')?.setValidators([Validators.required, Validators.pattern('^\\d+$')]);
          control.get('yearsOfExperience')?.updateValueAndValidity({ emitEvent: false });
          control.get('extraDays')?.setValidators([Validators.required, Validators.pattern('^\\d+$')]);
          control.get('extraDays')?.updateValueAndValidity({ emitEvent: false });
        });
      } else {
        this.experienceItems.disable();
        // Remove required validators when checkbox is unchecked
        this.experienceItems.controls.forEach(control => {
          control.get('yearsOfExperience')?.setValidators([Validators.pattern('^\\d+$')]);
          control.get('yearsOfExperience')?.updateValueAndValidity({ emitEvent: false });
          control.get('extraDays')?.setValidators([Validators.pattern('^\\d+$')]);
          control.get('extraDays')?.updateValueAndValidity({ emitEvent: false });
        });
      }
    });
    // Initially disable the FormArray
    this.experienceItems.disable();
  }

  leaveType1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    description: new FormControl(''),
    employmentType: new FormControl<number[]>([], [employmentTypesRequired]),
  });



  leaveLimitGreaterOrEqualValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const group = form as FormGroup;
    const accrualCtrl = group.get('accrual_rate');
    const limitCtrl = group.get('leave_limits');

    if (!accrualCtrl || !limitCtrl) return null;

    const accrual = accrualCtrl.value;
    const limit = limitCtrl.value;
    if (accrual === null || accrual === '' || limit === null || limit === '') {
      if (limitCtrl.errors?.['limitTooSmall']) {
        const { limitTooSmall, ...others } = limitCtrl.errors;
        limitCtrl.setErrors(Object.keys(others).length ? others : null);
      }
      return null;
    }

    const accrualNum = Number(accrual);
    const limitNum = Number(limit);

    if (limitNum < accrualNum) {
      limitCtrl.setErrors({ ...(limitCtrl.errors || {}), limitTooSmall: true });
    } else {
      if (limitCtrl.errors) {
        delete limitCtrl.errors['limitTooSmall'];
        if (!Object.keys(limitCtrl.errors).length) {
          limitCtrl.setErrors(null);
        }
      }
    }

    return null;
  };


  leaveType2: FormGroup = new FormGroup(
    {
      accrual_rate: new FormControl('', [
        Validators.required,
        Validators.pattern('^\\d+(\\.\\d+)?$')
      ]),
      leave_limits: new FormControl('', [
        Validators.required,
        Validators.pattern('^\\d+(\\.\\d+)?$')
      ]),
      max_review_days: new FormControl('', [
        Validators.required,
        Validators.pattern('^\\d+(\\.\\d+)?$')
      ]),
      maximum_carryover_days: new FormControl(
        { value: '', disabled: true },
        [
          Validators.pattern('^\\d+(\\.\\d+)?$'),
          this.validateCarryoverAgainstLimit
        ]
      )
    },
    { validators: this.leaveLimitGreaterOrEqualValidator }
  );


  // private setupAccrualValidation() {
  //   const accrualRate = this.leaveType2.get('accrual_rate');
  //   const leaveLimits = this.leaveType2.get('leave_limits');

  //   // Listen to accrual rate changes
  //   accrualRate?.valueChanges.subscribe(() => {
  //     leaveLimits?.updateValueAndValidity({ emitEvent: false });
  //   });

  //   // Listen to leave limits changes
  //   leaveLimits?.valueChanges.subscribe(() => {
  //     leaveLimits?.updateValueAndValidity({ emitEvent: false });
  //   });

  //   // Add custom validator to leave_limits
  //   leaveLimits?.addValidators(this.accrualAlignmentValidator.bind(this));
  // }

  // private accrualAlignmentValidator(control: any) {
  //   const accrualRate = this.leaveType2.get('accrual_rate')?.value;
  //   const leaveLimits = control.value;

  //   if (!accrualRate || !leaveLimits) {
  //     return null;
  //   }

  //   const expectedLeaveLimits = Number(accrualRate) * 12;
  //   const actualLeaveLimits = Number(leaveLimits);

  //   // Allow a small tolerance for floating point comparison
  //   const tolerance = 0.01;
  //   if (Math.abs(actualLeaveLimits - expectedLeaveLimits) > tolerance) {
  //     return { accrualMismatch: { expectedLeaveLimits, accrualRate } };
  //   }

  //   return null;
  // }



  leaveType3 = this.fb.group({
    // checkboxes
    extra_with_min_days_service: [false],
    extra_with_age: [false],
    extra_with_service: [false],
    extra_with_experience: [false],

    // inputs 
    minDaysService: [{ value: '', disabled: true }],

    // FormArray for age items
    ageItems: this.fb.array([]),

    // FormArray for service items
    serviceItems: this.fb.array([]),

    // FormArray for experience items
    experienceItems: this.fb.array([]),
  });





  toggleCarryoverValidators() {
    const control = this.leaveType2.get('maximum_carryover_days');
    if (this.carryoverAllowed) {
      control?.enable();
      control?.setValidators([
        Validators.required,
        Validators.pattern('^\\d+(\\.\\d+)?$'),
        this.validateCarryoverAgainstLimit
      ]);
    } else {
      control?.disable();
      control?.clearValidators();
      control?.setValue('');
    }
    control?.updateValueAndValidity({ emitEvent: false });
    this.leaveType2.get('leave_limits')?.updateValueAndValidity({ emitEvent: false });
    if (this.errMsg && !control?.hasError('exceedsLeaveLimit')) {
      this.errMsg = '';
    }
  }

  createleaveType() {
    if (this.isLoading) {
      return;
    }

    if (this.leaveType1.invalid || this.leaveType2.invalid || this.leaveType3.invalid) {
      this.leaveType1.markAllAsTouched();
      this.leaveType2.markAllAsTouched();
      this.leaveType3.markAllAsTouched();

      if (this.leaveType2.get('maximum_carryover_days')?.hasError('exceedsLeaveLimit')) {
        this.errMsg = 'Maximum Carryover Days cannot be more than Leave Limits.';
      }
      return;
    }

    this.errMsg = '';
    this.isLoading = true;

    // Build conditions.create array from age items
    const ageConditions = this.ageItems.controls
      .filter(control => control.get('age')?.value && control.get('extraDays')?.value)
      .map(control => ({
        condition: 1, // 1 = Age
        value: Number(control.get('age')?.value) || 0,
        value_to: 0, // or limit the value to
        days: Number(control.get('extraDays')?.value) || 0,
        status: true
      }));

    // Build conditions.create array from service items
    const serviceConditions = this.serviceItems.controls
      .filter(control => control.get('yearsOfService')?.value && control.get('extraDays')?.value)
      .map(control => ({
        condition: 2, // 2 = Service
        value: Number(control.get('yearsOfService')?.value) || 0,
        value_to: Number(control.get('extraDays')?.value) || 0,
        days: Number(control.get('extraDays')?.value) || 0,
        status: true
      }));

    // Build conditions.create array from experience items
    const experienceConditions = this.experienceItems.controls
      .filter(control => control.get('yearsOfExperience')?.value && control.get('extraDays')?.value)
      .map(control => ({
        condition: 3, // 3 = Experience
        value: Number(control.get('yearsOfExperience')?.value) || 0,
        value_to: Number(control.get('extraDays')?.value) || 0,
        days: Number(control.get('extraDays')?.value) || 0,
        status: true
      }));

    const request_data = {
      code: this.leaveType1.get('code')?.value,
      name: this.leaveType1.get('name')?.value,
      permission: "day_off", // Default value, adjust if needed
      description: this.leaveType1.get('description')?.value,
      employment_types: (this.leaveType1.get('employmentType')?.value as number[]) ?? [],
      document_status: 3, // Default: Optional - 3, adjust if needed
      settings: {
        accrual_rate: Number(this.leaveType2.get('accrual_rate')?.value),
        leave_limits: Number(this.leaveType2.get('leave_limits')?.value),
        max_review_days: Number(this.leaveType2.get('max_review_days')?.value),
        allow_carryover: this.carryoverAllowed,
        maximum_carryover_days: this.carryoverAllowed
          ? Number(this.leaveType2.get('maximum_carryover_days')?.value)
          : 0,
        extra_conditions: {
          min_days_service: {
            status: this.leaveType3.get('extra_with_min_days_service')?.value || false,
            value: (() => {
              const val = this.leaveType3.get('minDaysService')?.value;
              if (val === null || val === '') return 0;
              // Check if it's a number, otherwise return as string
              return isNaN(Number(val)) ? val : Number(val);
            })()
          },
          age: {
            status: this.ageItems.length > 0 && this.leaveType3.get('extra_with_age')?.value,
            from: this.ageItems.length > 0 ? Number(this.ageItems.controls[0].get('age')?.value) || 0 : 0,
            to: this.ageItems.length > 0 ? Number(this.ageItems.controls[0].get('extraDays')?.value) || 0 : 0
          },
          service: {
            status: this.serviceItems.length > 0 && this.leaveType3.get('extra_with_service')?.value,
            from: this.serviceItems.length > 0 ? Number(this.serviceItems.controls[0].get('yearsOfService')?.value) || 0 : 0,
            to: this.serviceItems.length > 0 ? Number(this.serviceItems.controls[0].get('extraDays')?.value) || 0 : 0
          },
          experience: {
            status: this.experienceItems.length > 0 && this.leaveType3.get('extra_with_experience')?.value,
            from: this.experienceItems.length > 0 ? Number(this.experienceItems.controls[0].get('yearsOfExperience')?.value) || 0 : 0,
            to: this.experienceItems.length > 0 ? Number(this.experienceItems.controls[0].get('extraDays')?.value) || 0 : 0
          }
        }
      },
      conditions: {
        create: [...ageConditions, ...serviceConditions, ...experienceConditions],
        update: [],
        delete: []
      }
    };
    const finalData = { request_data };
    this._LeaveTypeService.createLeavetype(finalData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';

        // Show success toast
        this.toasterMessageService.showSuccess("Leave Type created successfully", "Created Successfully");

        // Navigate to list page
        this.router.navigate(['/leave-types/all-leave-types']);
      },
      error: (err) => {
        this.isLoading = false;
        const statusCode = err?.status;
        const errorHandling = err?.error?.data?.error_handling;

        if (statusCode === 400) {
          if (Array.isArray(errorHandling) && errorHandling.length > 0) {
            this.currentStep = errorHandling[0].tap;
            this.errMsg = errorHandling[0].error;
          } else if (err?.error?.details) {
            this.errMsg = err.error.details;
          } else {
            this.errMsg = "An unexpected error occurred. Please try again later.";
          }
        } else {
          this.errMsg = "An unexpected error occurred. Please try again later.";
          // Use the helper for general error handling
          ApiToastHelper.handleApiError(err, this.toasterMessageService);
        }
      }
    });
  }

  // next and prev
  currentStep = 1;

  goNext() {
    this.currentStep++;

  }

  goPrev() {
    this.currentStep--;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event) {
    if (!this.el.nativeElement.contains(e.target)) this.employmentDropdownOpen = false;
  }

  openEmploymentDropdown() {
    this.employmentDropdownOpen = !this.employmentDropdownOpen;
    this.leaveType1.get('employmentType')?.markAsTouched();
  }

  closeEmploymentDropdown() {
    this.employmentDropdownOpen = false;
  }

  toggleEmploymentOption(id: number) {
    const ctrl = this.leaveType1.get('employmentType');
    const current: number[] = Array.isArray(ctrl?.value) ? [...ctrl.value] : [];
    const idx = current.indexOf(id);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(id);
    current.sort((a, b) => a - b);
    ctrl?.setValue(current);
    ctrl?.updateValueAndValidity();
  }

  isEmploymentSelected(id: number): boolean {
    const v = this.leaveType1.get('employmentType')?.value;
    return Array.isArray(v) && v.includes(id);
  }

  getEmploymentDisplay(): string {
    const v = this.leaveType1.get('employmentType')?.value as number[] | null;
    if (!Array.isArray(v) || v.length === 0) return 'Select types';
    return v.map(id => EMPLOYMENT_OPTIONS.find(o => o.id === id)?.name ?? id).join(', ');
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

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/leave-types/all-leave-types']);
  }

}
