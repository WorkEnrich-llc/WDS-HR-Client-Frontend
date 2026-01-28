import { Component, inject, OnInit, HostListener, ElementRef } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DatePipe, NgClass } from '@angular/common';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';

const EMPLOYMENT_OPTIONS_UPDATE: { id: number; name: string }[] = [
  { id: 1, name: 'Full-Time' },
  { id: 2, name: 'Part-Time' },
  { id: 3, name: 'Per Hour' },
  { id: 4, name: 'Freelance' }
];

function employmentTypesRequiredUpdate(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (!Array.isArray(v) || v.length === 0) return { required: true };
  return null;
}

@Component({
  selector: 'app-update-leave-types',
  imports: [PageHeaderComponent, PopupComponent, FormsModule, ReactiveFormsModule, NgClass],
  templateUrl: './update-leave-types.component.html',
  providers: [DatePipe],
  styleUrl: './update-leave-types.component.css'
})
export class UpdateLeaveTypesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private el = inject(ElementRef);

  employmentOptions = EMPLOYMENT_OPTIONS_UPDATE;
  employmentDropdownOpen = false;
  isFormChanged = false;
  carryoverAllowed: boolean = false;
  errMsg: string = '';
  isLoading: boolean = false;
  loadingData: boolean = false;
  leaveTypeData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  leaveId: string | null = null;
  originalConditions: any[] = []; // Store original conditions to track changes
  documentStatus: number = 3; // Default: Optional - 3
  permission: string = 'day_off'; // Default permission
  isInitializing: boolean = false; // Flag to prevent change detection during initialization
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

    this.setupCheckboxControl('extra_with_min_days_service', ['minDaysService']);
    this.setupAgeCheckbox();
    this.setupServiceCheckbox();
    this.setupExperienceCheckbox();

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

  addAgeItem(conditionId?: number): void {
    const isChecked = this.leaveType3.get('extra_with_age')?.value;
    const ageItem = this.fb.group({
      id: [conditionId || null], // Store condition ID if it exists
      age: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]],
      extraDays: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]]
    });
    this.ageItems.push(ageItem);
    if (!this.isInitializing) {
      this.leaveType3.markAsDirty();
      this.checkFormChanges();
    }
  }

  removeAgeItem(index: number): void {
    this.ageItems.removeAt(index);
    if (!this.isInitializing) {
      this.leaveType3.markAsDirty();
      this.checkFormChanges();
    }
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

  addServiceItem(conditionId?: number): void {
    const isChecked = this.leaveType3.get('extra_with_service')?.value;
    const serviceItem = this.fb.group({
      id: [conditionId || null], // Store condition ID if it exists
      yearsOfService: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]],
      extraDays: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]]
    });
    this.serviceItems.push(serviceItem);
    if (!this.isInitializing) {
      this.leaveType3.markAsDirty();
      this.checkFormChanges();
    }
  }

  removeServiceItem(index: number): void {
    this.serviceItems.removeAt(index);
    if (!this.isInitializing) {
      this.leaveType3.markAsDirty();
      this.checkFormChanges();
    }
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

  addExperienceItem(conditionId?: number): void {
    const isChecked = this.leaveType3.get('extra_with_experience')?.value;
    const experienceItem = this.fb.group({
      id: [conditionId || null],
      yearsOfExperience: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]],
      extraDays: ['', isChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]]
    });
    this.experienceItems.push(experienceItem);
    this.leaveType3.markAsDirty();
    this.checkFormChanges();
  }

  removeExperienceItem(index: number): void {
    this.experienceItems.removeAt(index);
    this.leaveType3.markAsDirty();
    this.checkFormChanges();
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

  getLeaveJob(leaveId: number) {
    this.loadingData = true;
    this.isInitializing = true; // Set flag to prevent change detection during initialization
    this._LeaveTypeService.showLeaveType(leaveId).subscribe({
      next: (response) => {
        this.loadingData = false;
        this.leaveTypeData = response.data.object_info;

        const settings = this.leaveTypeData.settings;
        this.carryoverAllowed = settings.allow_carryover;

        // Load document_status and permission
        this.documentStatus = this.leaveTypeData.document_status?.id || 3;
        this.permission = this.leaveTypeData.permission || 'day_off';

        const employmentIds: number[] = Array.isArray(this.leaveTypeData.employment_types)
          ? this.leaveTypeData.employment_types.map((x: any) => (typeof x === 'object' && x?.id != null) ? x.id : Number(x)).filter((n: number) => !isNaN(n))
          : (this.leaveTypeData.employment_type?.id != null ? [this.leaveTypeData.employment_type.id] : []);
        this.leaveType1.patchValue({
          code: this.leaveTypeData.code,
          name: this.leaveTypeData.name,
          description: this.leaveTypeData.description,
          employmentType: employmentIds.length ? employmentIds : []
        });

        this.leaveType2.patchValue({
          accrual_rate: settings.accrual_rate,
          leave_limits: settings.leave_limits,
          max_review_days: settings.max_review_days,
          maximum_carryover_days: settings.maximum_carryover_days
        });

        this.leaveType3.patchValue({
          extra_with_min_days_service: settings.extra_conditions?.min_days_service?.status || false,
          minDaysService: settings.extra_conditions?.min_days_service?.value || null,

          extra_with_age: settings.extra_conditions?.age?.status || false,

          extra_with_service: settings.extra_conditions?.service?.status || false,

          extra_with_experience: settings.extra_conditions?.experience?.status || false
        });

        // Store original conditions for tracking changes
        this.originalConditions = this.leaveTypeData.conditions || [];

        // Load age items from conditions array (condition.id === 1 means Age)
        this.ageItems.clear();
        const ageConditions = this.leaveTypeData.conditions?.filter((cond: any) =>
          cond.condition?.id === 1 && cond.is_active
        ) || [];

        if (ageConditions.length > 0) {
          const isAgeChecked = this.leaveType3.get('extra_with_age')?.value;
          ageConditions.forEach((condition: any) => {
            const ageItem = this.fb.group({
              id: [condition.id || null], // Store original condition ID
              age: [condition.value || '', isAgeChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]],
              extraDays: [condition.days || '', isAgeChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]]
            });
            this.ageItems.push(ageItem);
          });
          if (isAgeChecked) {
            this.ageItems.enable();
          }
        } else {
          // Initialize with one empty item if no data exists
          this.addAgeItem();
        }

        // Load service items from conditions array (condition.id === 2 means Service)
        this.serviceItems.clear();
        const serviceConditions = this.leaveTypeData.conditions?.filter((cond: any) =>
          cond.condition?.id === 2 && cond.is_active
        ) || [];

        if (serviceConditions.length > 0) {
          const isServiceChecked = this.leaveType3.get('extra_with_service')?.value;
          serviceConditions.forEach((condition: any) => {
            const serviceItem = this.fb.group({
              id: [condition.id || null], // Store original condition ID
              yearsOfService: [condition.value || '', isServiceChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]],
              extraDays: [condition.days || '', isServiceChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]]
            });
            this.serviceItems.push(serviceItem);
          });
          if (isServiceChecked) {
            this.serviceItems.enable();
          }
        } else {
          // Initialize with one empty item if no data exists
          this.addServiceItem();
        }

        // Load experience items from conditions array (condition.id === 3 means Experience)
        this.experienceItems.clear();
        const experienceConditions = this.leaveTypeData.conditions?.filter((cond: any) =>
          cond.condition?.id === 3 && cond.is_active
        ) || [];

        if (experienceConditions.length > 0) {
          const isExperienceChecked = this.leaveType3.get('extra_with_experience')?.value;
          experienceConditions.forEach((condition: any) => {
            const experienceItem = this.fb.group({
              id: [condition.id || null], // Store original condition ID
              yearsOfExperience: [condition.value || '', isExperienceChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]],
              extraDays: [condition.days || '', isExperienceChecked ? [Validators.required, Validators.pattern('^\\d+$')] : [Validators.pattern('^\\d+$')]]
            });
            this.experienceItems.push(experienceItem);
          });
          if (isExperienceChecked) {
            this.experienceItems.enable();
          }
        } else {
          // Initialize with one empty item if no data exists
          this.addExperienceItem();
        }

        // Apply validators if checkboxes are checked when loading existing data
        if (settings.extra_conditions?.min_days_service?.status) {
          this.leaveType3.get('minDaysService')?.enable();
          this.leaveType3.get('minDaysService')?.setValidators([
            Validators.required,
            Validators.pattern('^\\d+$')
          ]);
          this.leaveType3.get('minDaysService')?.updateValueAndValidity();
        }
        if (settings.extra_conditions?.service?.status) {
          this.leaveType3.get('yearsOfService')?.enable();
          this.leaveType3.get('yearsOfService')?.setValidators([
            Validators.required,
            Validators.pattern('^\\d+$')
          ]);
          this.leaveType3.get('yearsOfService')?.updateValueAndValidity();
          this.leaveType3.get('extraDaysService')?.enable();
          this.leaveType3.get('extraDaysService')?.setValidators([
            Validators.required,
            Validators.pattern('^\\d+$')
          ]);
          this.leaveType3.get('extraDaysService')?.updateValueAndValidity();
        }

        this.toggleCarryoverValidators();

        this.leaveType2.get('leave_limits')?.updateValueAndValidity({ emitEvent: false });

        const created = this.leaveTypeData?.created_at;
        const updated = this.leaveTypeData?.updated_at;
        if (created) this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        if (updated) this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;

        // Initialize form change tracking after all data is loaded
        this.isInitializing = false;
        this.isFormChanged = false; // Ensure it starts as false
        this.monitorFormChanges();
      },
      error: (err) => {
        this.loadingData = false;
        console.log(err.error?.details);
      }
    });
  }


  initialLeaveType1: any = null;
  initialLeaveType2: any = null;
  initialLeaveType3: any = null;

  monitorFormChanges() {
    this.initialLeaveType1 = this.leaveType1.getRawValue();
    this.initialLeaveType2 = this.leaveType2.getRawValue();
    this.initialLeaveType3 = this.getLeaveType3RawValue();

    this.leaveType1.valueChanges.subscribe(() => {
      this.checkFormChanges();
    });

    this.leaveType2.valueChanges.subscribe(() => {
      this.checkFormChanges();
    });

    this.leaveType3.valueChanges.subscribe(() => {
      this.checkFormChanges();
    });
  }

  checkFormChanges(): void {
    // Don't check changes during initialization or if initial values aren't set
    if (this.isInitializing || !this.initialLeaveType1 || !this.initialLeaveType2 || !this.initialLeaveType3) {
      return;
    }

    const current1 = this.leaveType1.getRawValue();
    const current2 = this.leaveType2.getRawValue();
    const current3 = this.getLeaveType3RawValue();

    this.isFormChanged =
      JSON.stringify(current1) !== JSON.stringify(this.initialLeaveType1) ||
      JSON.stringify(current2) !== JSON.stringify(this.initialLeaveType2) ||
      JSON.stringify(current3) !== JSON.stringify(this.initialLeaveType3);
  }

  getLeaveType3RawValue(): any {
    return {
      extra_with_min_days_service: this.leaveType3.get('extra_with_min_days_service')?.value,
      minDaysService: this.leaveType3.get('minDaysService')?.value,
      extra_with_age: this.leaveType3.get('extra_with_age')?.value,
      extra_with_service: this.leaveType3.get('extra_with_service')?.value,
      extra_with_experience: this.leaveType3.get('extra_with_experience')?.value,
      ageItems: this.ageItems.controls.map(control => ({
        id: control.get('id')?.value,
        age: control.get('age')?.value,
        extraDays: control.get('extraDays')?.value
      })),
      serviceItems: this.serviceItems.controls.map(control => ({
        id: control.get('id')?.value,
        yearsOfService: control.get('yearsOfService')?.value,
        extraDays: control.get('extraDays')?.value
      })),
      experienceItems: this.experienceItems.controls.map(control => ({
        id: control.get('id')?.value,
        yearsOfExperience: control.get('yearsOfExperience')?.value,
        extraDays: control.get('extraDays')?.value
      }))
    };
  }


  leaveType1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    description: new FormControl(''),
    employmentType: new FormControl<number[]>([], [employmentTypesRequiredUpdate]),
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

    // Get min_days_service value - can be number or string
    const minDaysServiceValue = this.leaveType3.get('minDaysService')?.value;
    const minDaysServiceValueFinal = minDaysServiceValue !== null && minDaysServiceValue !== ''
      ? (isNaN(Number(minDaysServiceValue)) ? minDaysServiceValue : Number(minDaysServiceValue))
      : null;

    // Build conditions arrays: create, update, delete
    const conditionsToCreate: any[] = [];
    const conditionsToUpdate: any[] = [];
    const conditionsToDelete: any[] = [];

    // Process age items (condition.id === 1)
    this.ageItems.controls.forEach(control => {
      const id = control.get('id')?.value;
      const age = control.get('age')?.value;
      const extraDays = control.get('extraDays')?.value;

      // Only process if both values are filled
      if (age && extraDays) {
        const conditionData = {
          condition: 1, // 1 = Age
          value: Number(age) || 0,
          value_to: 0,
          days: Number(extraDays) || 0,
          status: true
        };

        if (id) {
          // Existing condition - check if it changed
          const originalCondition = this.originalConditions.find((c: any) => c.id === id);
          if (originalCondition) {
            const hasChanged =
              originalCondition.value !== conditionData.value ||
              originalCondition.days !== conditionData.days;

            if (hasChanged) {
              conditionsToUpdate.push({
                id: id,
                ...conditionData
              });
            }
          }
        } else {
          // New condition
          conditionsToCreate.push(conditionData);
        }
      }
    });

    // Process service items (condition.id === 2)
    this.serviceItems.controls.forEach(control => {
      const id = control.get('id')?.value;
      const yearsOfService = control.get('yearsOfService')?.value;
      const extraDays = control.get('extraDays')?.value;

      // Only process if both values are filled
      if (yearsOfService && extraDays) {
        const conditionData = {
          condition: 2, // 2 = Service
          value: Number(yearsOfService) || 0,
          value_to: Number(extraDays) || 0,
          days: Number(extraDays) || 0,
          status: true
        };

        if (id) {
          // Existing condition - check if it changed
          const originalCondition = this.originalConditions.find((c: any) => c.id === id);
          if (originalCondition) {
            const hasChanged =
              originalCondition.value !== conditionData.value ||
              originalCondition.value_to !== conditionData.value_to ||
              originalCondition.days !== conditionData.days;

            if (hasChanged) {
              conditionsToUpdate.push({
                id: id,
                ...conditionData
              });
            }
          }
        } else {
          // New condition
          conditionsToCreate.push(conditionData);
        }
      }
    });

    // Process experience items (condition.id === 3)
    this.experienceItems.controls.forEach(control => {
      const id = control.get('id')?.value;
      const yearsOfExperience = control.get('yearsOfExperience')?.value;
      const extraDays = control.get('extraDays')?.value;

      // Only process if both values are filled
      if (yearsOfExperience && extraDays) {
        const conditionData = {
          condition: 3, // 3 = Experience
          value: Number(yearsOfExperience) || 0,
          value_to: Number(extraDays) || 0,
          days: Number(extraDays) || 0,
          status: true
        };

        if (id) {
          // Existing condition - check if it changed
          const originalCondition = this.originalConditions.find((c: any) => c.id === id);
          if (originalCondition) {
            const hasChanged =
              originalCondition.value !== conditionData.value ||
              originalCondition.value_to !== conditionData.value_to ||
              originalCondition.days !== conditionData.days;

            if (hasChanged) {
              conditionsToUpdate.push({
                id: id,
                ...conditionData
              });
            }
          }
        } else {
          // New condition
          conditionsToCreate.push(conditionData);
        }
      }
    });

    // Find deleted conditions (were in original but not in current FormArrays)
    const currentAgeIds = this.ageItems.controls
      .map(control => control.get('id')?.value)
      .filter(id => id !== null && id !== undefined);

    const currentServiceIds = this.serviceItems.controls
      .map(control => control.get('id')?.value)
      .filter(id => id !== null && id !== undefined);

    const currentExperienceIds = this.experienceItems.controls
      .map(control => control.get('id')?.value)
      .filter(id => id !== null && id !== undefined);

    const allCurrentIds = [...currentAgeIds, ...currentServiceIds, ...currentExperienceIds];

    this.originalConditions.forEach((originalCondition: any) => {
      if (originalCondition.is_active && !allCurrentIds.includes(originalCondition.id)) {
        conditionsToDelete.push({ id: originalCondition.id });
      }
    });

    const request_data = {
      id: Number(this.leaveTypeData.id),
      code: this.leaveType1.get('code')?.value,
      name: this.leaveType1.get('name')?.value,
      permission: this.permission,
      description: this.leaveType1.get('description')?.value,
      employment_types: (this.leaveType1.get('employmentType')?.value as number[]) ?? [],
      document_status: this.documentStatus,
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
            value: minDaysServiceValueFinal || 0
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
        create: conditionsToCreate,
        update: conditionsToUpdate,
        delete: conditionsToDelete
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
        this.toasterMessageService.showSuccess("Leave Type Updated successfully", "Updated Successfully");

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
    return v.map(id => EMPLOYMENT_OPTIONS_UPDATE.find(o => o.id === id)?.name ?? id).join(', ');
  }

  get isSaveDisabled(): boolean {
    const isInvalid = this.leaveType1.invalid || this.leaveType2.invalid || this.leaveType3.invalid;
    return isInvalid || !this.isFormChanged || this.isLoading;
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
