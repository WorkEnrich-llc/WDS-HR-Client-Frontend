import { Injectable, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Branch } from '../../../../../core/interfaces/branch';
import { Department } from '../../../../../core/interfaces/department';
import { JobTitle } from '../../../../../core/interfaces/job-title';
import { WorkSchedule } from '../../../../../core/interfaces/work-schedule';
import { COUNTRIES, Country } from '../countries-list';

@Injectable({
  providedIn: 'root'
})
export class CreateEmployeeSharedService {
  private fb = new FormBuilder();

  // Reactive Forms
  employeeForm!: FormGroup;

  // Component state as signals
  readonly currentStep = signal<number>(1);
  readonly errMsg = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly branches = signal<Branch[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly sections = signal<any[]>([]);
  readonly jobTitles = signal<JobTitle[]>([]);
  readonly workSchedules = signal<WorkSchedule[]>([]);
  readonly dropdownOpen = signal<boolean>(false);
  readonly isModalOpen = signal<boolean>(false);
  readonly isSuccessModalOpen = signal<boolean>(false);
  readonly selectedJobTitle = signal<JobTitle | null>(null);
  readonly currentSalaryRange = signal<{
    minimum: string | number;
    maximum: string | number;
    currency: string;
  } | null>(null);

  // Options for dropdowns
  readonly genderOptions = signal<{ id: number; name: string }[]>([
    { id: 1, name: 'Male' },
    { id: 2, name: 'Female' }
  ]);
  readonly maritalStatusOptions = signal<{ id: number; name: string }[]>([
    { id: 1, name: 'Single' },
    { id: 2, name: 'Married' },
    { id: 3, name: 'Divorced' },
    { id: 4, name: 'Widowed' }
  ]);
  readonly employmentTypes = signal<{ id: number; name: string }[]>([
    { id: 1, name: 'Full Time' },
    { id: 2, name: 'Part Time' },
    { id: 3, name: 'Per Hour' },
  ]);
  readonly workModes = signal<{ id: number; name: string }[]>([
    { id: 1, name: 'On site' },
    { id: 2, name: 'Remote' },
    { id: 3, name: 'Hybrid' },
  ]);
  readonly countries = signal<Country[]>(COUNTRIES);

  constructor() {
    this.initializeForm();
    this.setupFormWatchers();
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      main_information: this.fb.group({
        code: [''],
        name: ['', [Validators.required, Validators.minLength(2)]],
        gender: [null, Validators.required],
        mobile: this.fb.group({
          country_id: [1, Validators.required],
          number: ['', [Validators.required, Validators.pattern(/^(?:10|11|12|15)\d{8}$/)]]
        }),
        personal_email: ['', [Validators.required, Validators.email]],
        marital_status: [null, Validators.required],
        date_of_birth: ['', Validators.required],
        address: ['', Validators.required]
      }),
      job_details: this.fb.group({
        branch_id: [null, Validators.required],
        department_id: [null, Validators.required],
        section_id: [null],
        job_title_id: [null, Validators.required],
        work_schedule_id: [null, Validators.required],
        activate_attendance_rules: [false]
      }),
      contract_details: this.fb.group({
        start_contract: ['', Validators.required],
        contract_type: [2, Validators.required],
        contract_end_date: [''],
        salary: ['', [Validators.required, Validators.min(0)]]
      }),
      attendance_details: this.fb.group({
        employment_type: [null, Validators.required],
        work_mode: [null, Validators.required],
        days_on_site: ['']
      })
    });
  }

  private setupFormWatchers(): void {
    // Watch for contract type changes to handle end date requirement
    this.contractDetails.get('contract_type')?.valueChanges.subscribe(contractType => {
      const endDateControl = this.contractDetails.get('contract_end_date');
      if (contractType === 1) { // With end date
        endDateControl?.setValidators([Validators.required]);
      } else {
        endDateControl?.clearValidators();
      }
      endDateControl?.updateValueAndValidity();
    });

    // Watch for work mode changes to handle days on site requirement
    this.attendanceDetails.get('work_mode')?.valueChanges.subscribe((workMode: any) => {
      const daysOnSiteControl = this.attendanceDetails.get('days_on_site');
      if (workMode === 3) { // Hybrid
        daysOnSiteControl?.setValidators([Validators.required, Validators.min(1), Validators.max(7)]);
      } else if (workMode === 1) { // On site
        daysOnSiteControl?.setValue(7);
        daysOnSiteControl?.clearValidators();
      } else { // Remote
        daysOnSiteControl?.setValue(0);
        daysOnSiteControl?.clearValidators();
      }
      daysOnSiteControl?.updateValueAndValidity();
    });

    // Watch for job title changes to update salary ranges
    this.jobDetails.get('job_title_id')?.valueChanges.subscribe((jobTitleId: any) => {
      if (jobTitleId) {
        const selectedTitle = this.jobTitles().find(title => title.id == jobTitleId);
        this.selectedJobTitle.set(selectedTitle || null);
        this.updateSalaryRange();
      } else {
        this.selectedJobTitle.set(null);
        this.currentSalaryRange.set(null);
      }
    });

    // Watch for employment type changes to update salary range and validators
    this.attendanceDetails.get('employment_type')?.valueChanges.subscribe((employmentType: any) => {
      this.updateSalaryRange();
    });

    // Strip leading zeros from phone number and enforce prefix pattern
    this.mobileGroup.get('number')?.valueChanges.subscribe(value => {
      if (value != null && typeof value === 'string') {
        const stripped = value.replace(/^0+/, '');
        if (stripped !== value) {
          this.mobileGroup.get('number')?.setValue(stripped, { emitEvent: false });
        }
      }
    });
  }

  // Form getters
  get mainInformation() { return this.employeeForm.get('main_information') as FormGroup; }
  get jobDetails() { return this.employeeForm.get('job_details') as FormGroup; }
  get contractDetails() { return this.employeeForm.get('contract_details') as FormGroup; }
  get attendanceDetails() { return this.employeeForm.get('attendance_details') as FormGroup; }
  get mobileGroup() { return this.mainInformation.get('mobile') as FormGroup; }

  // Country methods
  selectCountry(country: Country) {
    const countryIndex = this.countries().findIndex(c => c.dialCode === country.dialCode);
    this.mobileGroup.get('country_id')?.setValue(countryIndex + 1);
  }

  getSelectedCountry(): Country {
    const countryId = this.mobileGroup.get('country_id')?.value;
    return this.countries()[countryId - 1] || this.countries()[0];
  }

  // Filter methods
  getSections() {
    return this.sections().filter((section) => section.is_active) || [];
  }

  getActiveDepartments(): Department[] {
    return this.departments().filter((d) => d.is_active);
  }

  getActiveJobTitles(): JobTitle[] {
    return this.jobTitles().filter((j) => j.is_active);
  }

  getActiveWorkSchedules(): WorkSchedule[] {
    return this.workSchedules().filter((w) => w.is_active);
  }

  getActiveBranches(): Branch[] {
    return this.branches().filter((b) => b.is_active);
  }

  // Salary range methods
  updateSalaryRange(): void {
    const selectedTitle = this.selectedJobTitle();
    const employmentType = +this.attendanceDetails.get('employment_type')?.value;
    
    if (!selectedTitle || !selectedTitle.salary_ranges || !employmentType) {
      this.currentSalaryRange.set(null);
      this.updateSalaryValidators(null);
      return;
    }

    let salaryRange = null;
    
    switch (employmentType) {
      case 1: // Full Time
        salaryRange = selectedTitle.salary_ranges.full_time;
        break;
      case 2: // Part Time
        salaryRange = selectedTitle.salary_ranges.part_time;
        break;
      case 3: // Per Hour
        salaryRange = selectedTitle.salary_ranges.per_hour;
        break;
    }

    if (salaryRange && salaryRange.status) {
      this.currentSalaryRange.set({
        minimum: salaryRange.minimum,
        maximum: salaryRange.maximum,
        currency: salaryRange.currency
      });
      this.updateSalaryValidators(salaryRange);
    } else {
      this.currentSalaryRange.set(null);
      this.updateSalaryValidators(null);
    }
  }

  updateSalaryValidators(salaryRange: any): void {
    const salaryControl = this.contractDetails.get('salary');
    if (!salaryControl) return;

    if (salaryRange) {
      const minValue = Number(salaryRange.minimum);
      const maxValue = Number(salaryRange.maximum);
      
      salaryControl.setValidators([
        Validators.required,
        Validators.min(minValue),
        Validators.max(maxValue)
      ]);
    } else {
      salaryControl.setValidators([
        Validators.required,
        Validators.min(0)
      ]);
    }
    
    salaryControl.updateValueAndValidity();
  }

  getSalaryRangeDisplay(): { min: string, max: string, currency: string } | null {
    const range = this.currentSalaryRange();
    if (!range) return null;
    
    return {
      min: this.formatCurrency(range.minimum),
      max: this.formatCurrency(range.maximum),
      currency: range.currency
    };
  }

  formatCurrency(value: string | number): string {
    const numValue = Number(value);
    return numValue.toLocaleString();
  }

  // Validation methods
  isFieldInvalid(fieldName: string, formGroup?: FormGroup): boolean {
    const group = formGroup || this.employeeForm;
    const field = group.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string, formGroup?: FormGroup): string {
    const group = formGroup || this.employeeForm;
    const field = group.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['pattern']) return 'Please enter a valid format';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return '';
  }

  // Method to clear field errors and reset touched state
  clearFieldErrors(fieldName: string, formGroup?: FormGroup): void {
    const group = formGroup || this.employeeForm;
    const field = group.get(fieldName);
    if (field) {
      field.setErrors(null);
      field.markAsUntouched();
      field.markAsPristine();
    }
  }

  // Method to clear all error messages
  clearErrorMessages(): void {
    this.errMsg.set('');
  }

  validateCurrentStep(): boolean {
    let isValid = true;
    this.errMsg.set('');

    switch (this.currentStep()) {
      case 1:
        this.mainInformation.markAllAsTouched();
        // Also mark the nested mobile group as touched
        this.mobileGroup.markAllAsTouched();
        if (this.mainInformation.invalid) {
          isValid = false;
          // Find which specific field is invalid for better error messaging
          const invalidFields: string[] = [];
          Object.keys(this.mainInformation.controls).forEach(key => {
            const control = this.mainInformation.get(key);
            if (control?.invalid) {
              if (key === 'mobile') {
                // Check mobile subfields
                Object.keys(this.mobileGroup.controls).forEach(mobileKey => {
                  const mobileControl = this.mobileGroup.get(mobileKey);
                  if (mobileControl?.invalid) {
                    invalidFields.push(`mobile.${mobileKey}`);
                  }
                });
              } else {
                invalidFields.push(key);
              }
            }
          });
          this.errMsg.set('Please fill in all required fields in Main Information');
        }
        break;
      case 2:
        this.jobDetails.markAllAsTouched();
        if (this.jobDetails.invalid) {
          isValid = false;
          this.errMsg.set('Please fill in all required fields in Job Details');
        }
        break;
      case 3:
        this.attendanceDetails.markAllAsTouched();
        if (this.attendanceDetails.invalid) {
          isValid = false;
          this.errMsg.set('Please fill in all required fields in Attendance Details');
        }
        break;
      case 4:
        this.contractDetails.markAllAsTouched();
        if (this.contractDetails.invalid) {
          isValid = false;
          this.errMsg.set('Please fill in all required fields in Contract Details');
        }
        break;
    }
    return isValid;
  }

  // Step navigation
  goNext() {
    // Debug form state before validation
    this.debugFormState();
    
    if (this.validateCurrentStep()) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  goPrev() {
    this.currentStep.set(this.currentStep() - 1);
  }

  // Utility methods
  get withEndDate(): boolean {
    return this.contractDetails.get('contract_type')?.value === 1;
  }

  resetForm(): void {
    this.employeeForm.reset();
    // Set default values after reset
    this.mobileGroup.get('country_id')?.setValue(1);
    this.contractDetails.get('contract_type')?.setValue(2);
    this.currentStep.set(1);
    this.errMsg.set('');
    this.selectedJobTitle.set(null);
    this.currentSalaryRange.set(null);
  }

  // Debug method to help identify validation issues
  debugFormState(): void {
  }
}
