import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ApiToastHelper } from '../../../../core/helpers/api-toast.helper';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';
@Component({
  selector: 'app-create-leave-type',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './create-leave-type.component.html',
  styleUrl: './create-leave-type.component.css'
})
export class CreateLeaveTypeComponent implements OnInit {

  private fb = inject(FormBuilder);

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
    this.setupCheckboxControl('extra_with_age', ['age', 'extraDays']);
    this.setupCheckboxControl('extra_with_service', ['yearsOfService', 'extraDaysService']);
    this.setupCheckboxControl('extra_with_experience', ['yearsOfExperience', 'extraDaysExperience']);
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
        } else {
          this.leaveType3.get(ctrl)?.disable();
          this.leaveType3.get(ctrl)?.reset();
        }
      });
    });
  }

  leaveType1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    description: new FormControl(''),
    employmentType: new FormControl('', [Validators.required]),
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

    age: [{ value: '', disabled: true }],
    extraDays: [{ value: '', disabled: true }],

    yearsOfService: [{ value: '', disabled: true }],
    extraDaysService: [{ value: '', disabled: true }],

    yearsOfExperience: [{ value: '', disabled: true }],
    extraDaysExperience: [{ value: '', disabled: true }],
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
    const request_data = {
      code: this.leaveType1.get('code')?.value,
      name: this.leaveType1.get('name')?.value,
      description: this.leaveType1.get('description')?.value,
      employment_type: Number(this.leaveType1.get('employmentType')?.value),
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
            status: this.leaveType3.get('extra_with_age')?.value || false,
            from: Number(this.leaveType3.get('age')?.value) || 0,
            to: Number(this.leaveType3.get('extraDays')?.value) || 0
          },
          service: {
            status: this.leaveType3.get('extra_with_service')?.value || false,
            from: Number(this.leaveType3.get('yearsOfService')?.value) || 0,
            to: Number(this.leaveType3.get('extraDaysService')?.value) || 0
          },
          experience: {
            status: this.leaveType3.get('extra_with_experience')?.value || false,
            from: Number(this.leaveType3.get('yearsOfExperience')?.value) || 0,
            to: Number(this.leaveType3.get('extraDaysExperience')?.value) || 0
          }
        }
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
