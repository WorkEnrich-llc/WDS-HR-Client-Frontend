import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';

@Component({
  selector: 'app-update-leave-types',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './update-leave-types.component.html',
  styleUrl: './update-leave-types.component.css'
})
export class UpdateLeaveTypesComponent implements OnInit {
  private fb = inject(FormBuilder);
  isFormChanged = false;
  carryoverAllowed: boolean = false;
  errMsg: string = '';
  isLoading: boolean = false;
  leaveTypeData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  leaveId: string | null = null;
  constructor(
    private _LeaveTypeService: LeaveTypeService,
    private router: Router,
    private route: ActivatedRoute,
    private toasterMessageService: ToasterMessageService,
    private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.leaveId = this.route.snapshot.paramMap.get('id');
    // this.getLeaveJob(Number(this.leaveId));
    if (this.leaveId) {
      this.getLeaveJob(Number(this.leaveId));
    }

    this.setupCheckboxControl('extra_with_age', ['age', 'extraDays']);
    this.setupCheckboxControl('extra_with_service', ['yearsOfService', 'extraDaysService']);
    this.setupCheckboxControl('extra_with_experience', ['yearsOfExperience', 'extraDaysExperience']);

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

  getLeaveJob(leaveId: number) {

    this._LeaveTypeService.showLeaveType(leaveId).subscribe({
      next: (response) => {
        this.leaveTypeData = response.data.object_info;

        const settings = this.leaveTypeData.settings;
        this.carryoverAllowed = settings.allow_carryover;

        this.leaveType1.patchValue({
          code: this.leaveTypeData.code,
          name: this.leaveTypeData.name,
          description: this.leaveTypeData.description,
          employmentType: this.leaveTypeData.employment_type?.id || ''
        });

        this.leaveType2.patchValue({
          accrual_rate: settings.accrual_rate,
          leave_limits: settings.leave_limits,
          max_review_days: settings.max_review_days,
          maximum_carryover_days: settings.maximum_carryover_days
        });

        this.leaveType3.patchValue({
          extra_with_age: settings.extra_conditions?.age?.status || false,
          age: settings.extra_conditions?.age?.from || null,
          extraDays: settings.extra_conditions?.age?.to || null,

          extra_with_service: settings.extra_conditions?.service?.status || false,
          yearsOfService: settings.extra_conditions?.service?.from || null,
          extraDaysService: settings.extra_conditions?.service?.to || null,

          extra_with_experience: settings.extra_conditions?.experience?.status || false,
          yearsOfExperience: settings.extra_conditions?.experience?.from || null,
          extraDaysExperience: settings.extra_conditions?.experience?.to || null
        });

        this.toggleCarryoverValidators();

        this.monitorFormChanges();
        this.leaveType2.get('leave_limits')?.updateValueAndValidity({ emitEvent: false });

        const created = this.leaveTypeData?.created_at;
        const updated = this.leaveTypeData?.updated_at;
        if (created) this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        if (updated) this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }


  monitorFormChanges() {
    const initialLeaveType1 = this.leaveType1.getRawValue();
    const initialLeaveType2 = this.leaveType2.getRawValue();

    this.leaveType1.valueChanges.subscribe(() => {
      const current1 = this.leaveType1.getRawValue();
      this.isFormChanged = JSON.stringify(current1) !== JSON.stringify(initialLeaveType1) ||
        JSON.stringify(this.leaveType2.getRawValue()) !== JSON.stringify(initialLeaveType2);
    });

    this.leaveType2.valueChanges.subscribe(() => {
      const current2 = this.leaveType2.getRawValue();
      this.isFormChanged = JSON.stringify(this.leaveType1.getRawValue()) !== JSON.stringify(initialLeaveType1) ||
        JSON.stringify(current2) !== JSON.stringify(initialLeaveType2);
    });
  }


  leaveType1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    description: new FormControl(''),
    employmentType: new FormControl('', [Validators.required]),
  });

  leaveType2: FormGroup = new FormGroup({
    accrual_rate: new FormControl('', [Validators.required, Validators.pattern('^\\d+(\\.\\d+)?$')]),
    leave_limits: new FormControl('', [
      Validators.required,
      Validators.pattern('^\\d+(\\.\\d+)?$')
    ]),
    max_review_days: new FormControl('', [Validators.required, Validators.pattern('^\\d+(\\.\\d+)?$')]),
    maximum_carryover_days: new FormControl(
      { value: '', disabled: true },
      [
        Validators.pattern('^\\d+(\\.\\d+)?$'),
        this.validateCarryoverAgainstLimit
      ]
    )
  });

  leaveType3 = this.fb.group({
    // checkboxes
    extra_with_age: [false],
    extra_with_service: [false],
    extra_with_experience: [false],

    // inputs 
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

  updateLeaveType() {
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
      id: Number(this.leaveTypeData.id),
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
          : 0
      }
    };
    const finalData = { request_data };
    console.log(finalData);

    this._LeaveTypeService.updateLeaveType(finalData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/leave-types/all-leave-types']);
        this.toasterMessageService.sendMessage("Leave Type Updated successfully");

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



  get isSaveDisabled(): boolean {
    const isInvalid = this.leaveType1.invalid || this.leaveType2.invalid || this.leaveType3.invalid;
    const isUnchanged = this.leaveType1.pristine && this.leaveType2.pristine && this.leaveType3.pristine;
    return isInvalid || isUnchanged || this.isLoading;
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
