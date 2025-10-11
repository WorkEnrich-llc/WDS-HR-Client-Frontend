import { inject, Injectable, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Branch } from '../../../../../core/interfaces/branch';
import { Department } from '../../../../../core/interfaces/department';
import { JobTitle } from '../../../../../core/interfaces/job-title';
import { WorkSchedule } from '../../../../../core/interfaces/work-schedule';
import { COUNTRIES, Country } from '../countries-list';
import { Employee } from 'app/core/interfaces/employee';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { catchError, forkJoin, map, of } from 'rxjs';
import { BranchesService } from 'app/core/services/od/branches/branches.service';
import { DepartmentsService } from 'app/core/services/od/departments/departments.service';
import { JobsService } from 'app/core/services/od/jobs/jobs.service';
import { fourPartsValidator } from 'app/components/settings/profile-settings/profile.validators';
import { CustomValidators } from 'app/core/validators/custom-validators';

// Error message mapping
const FIELD_DISPLAY_NAMES: { [key: string]: string } = {
  'name': 'Name',
  'email': 'Gender',
  'mobile': 'Mobile',
  'personal_email': 'Personal Email',
  'marital_status': 'Marital Status',
  'date_of_birth': 'Date of Birth',
  'address': 'Address',
  'branch_id': 'Branch',
  'department_id': 'Department',
  'section_id': 'Section',
  'job_title_id': 'Job Title',
  'years_of_experience': 'Years of Experience',
  'start_contract': 'Start Contract',
  'contract_type': 'Contract Type',
  'contract_end_date': 'Contract End Date',
  'notice_period': 'Notice Period',
  'salary': 'Salary',
  'insurance_salary': 'Insurance Salary',
  'employment_type': 'Employment Type',
  'work_mode': 'Work Mode',
  'days_on_site': 'Days on Site',
  'work_schedule_id': 'Work Schedule',
  'include_insurance_salary': 'Include Insurance Salary',
  'include_gross_insurance_salary': 'Include Gross Insurance Salary',
  'gross_insurance_salary': 'Gross Insurance Salary',
};

@Injectable({
  providedIn: 'root'
})
export class ManageEmployeeSharedService {
  private fb = new FormBuilder();
  private employeeService = inject(EmployeeService);
  private branchesService = inject(BranchesService);
  private departmentsService = inject(DepartmentsService);
  private jobsService = inject(JobsService);

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
  readonly employeeData = signal<Employee | null>(null);
  readonly createdAt = signal<string>('');
  readonly updatedAt = signal<string>('');
  isLoadingData = signal(false);
  currentDate = new Date().toISOString().split('T')[0];


  constructor() {
    this.initializeForm();
    this.setupFormWatchers();
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      main_information: this.fb.group({
        code: [''],
        name: ['', [Validators.required, fourPartsValidator()]],
        // name: ['', [Validators.required, Validators.minLength(2)]],
        gender: [null, Validators.required],
        mobile: this.fb.group({
          country_id: [1, Validators.required],
          number: ['', [Validators.required, Validators.pattern(/^(?:10|11|12|15)\d{8}$/), Validators.minLength(10), Validators.maxLength(10)]]
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
        years_of_experience: [null]
      }),
      contract_details: this.fb.group({
        start_contract: ['', [Validators.required, CustomValidators.futureDate(this.currentDate)]],
        contract_type: [2, Validators.required],
        contract_end_date: [''],
        include_probation: [false],
        notice_period: [null],
        salary: ['', [Validators.required, Validators.min(0)]],
        insurance_salary: ['']
      }, { validators: this.dateRangeValidator.bind(this) }),
      attendance_details: this.fb.group({
        employment_type: [null, Validators.required],
        work_mode: [null, Validators.required],
        days_on_site: ['', [Validators.min(0), Validators.max(7)]],
        work_schedule_id: [null, Validators.required],
        activate_attendance_rules: [false]
      }),
      insurance_details: this.fb.group({
        include_insurance_salary: [false],
        insurance_salary: [''],
        include_gross_insurance_salary: [false],
        gross_insurance_salary: ['']
      })
    });
  }



  loadEmployeeData(id: number): void {
    this.isLoading.set(true);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        const data = response.data.object_info;
        this.employeeData.set(data);
        this.patchEmployeeForm(data);
        this.createdAt.set(data.created_at || '');
        this.updatedAt.set(data.updated_at || '');

        const branchId = data.job_info.branch?.id;
        const sectionId = data.job_info.section?.id;

        if (branchId && sectionId) {
          this.loadDropdownDataInSameTime(branchId, sectionId);
        } else {
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Failed to load employee', error);
      }
    });
  }

  private loadDropdownDataInSameTime(branchId: number, sectionId: number): void {
    const departments$ = this.departmentsService.getAllDepartment(1, 100, { branch_id: branchId, status: 'all' }).pipe(
      map(res => res.data?.list_items || []),
      catchError(() => of([]))
    );

    const jobTitles$ = this.jobsService.getAllJobTitles(1, 100, { section: sectionId.toString() }).pipe(
      map(res => res.data?.list_items || []),
      catchError(() => of([]))
    );

    forkJoin({
      departments: departments$,
      jobTitles: jobTitles$
    }).subscribe(({ departments, jobTitles }) => {
      this.departments.set(departments);

      const currentDeptId = this.jobDetails.get('department_id')?.value;
      const selectedDept = departments.find((d: any) => d.id == currentDeptId);
      if (selectedDept) {
        const deptSections = Array.isArray(selectedDept.sections) ? selectedDept.sections : [];
        this.sections.set(deptSections);
      }

      this.jobTitles.set(jobTitles);

      this.jobDetails.get('department_id')?.enable();
      this.jobDetails.get('section_id')?.enable();
      this.jobDetails.get('job_title_id')?.enable();

      this.isLoading.set(false);
    });
  }


  private patchEmployeeForm(data: Employee): void {
    const options = { emitEvent: false };

    this.mainInformation.patchValue({
      code: data.id.toString(),
      name: data.contact_info.name,
      gender: data.contact_info.gender?.id || null,
      mobile: {
        country_id: data.contact_info.mobile?.country?.id || 1,
        number: data.contact_info.mobile?.number?.toString()
      },
      personal_email: data.contact_info.email,
      marital_status: data.contact_info.marital_status?.id,
      date_of_birth: this.formatDateForInput(data.contact_info.date_of_birth),
      address: data.contact_info.address
    }, options);

    this.jobDetails.patchValue({
      branch_id: data.job_info.branch?.id,
      department_id: data.job_info.department?.id,
      section_id: data.job_info.section?.id,
      job_title_id: data.job_info.job_title?.id,
      years_of_experience: data.job_info.years_of_experience || 0
    }, options);

    this.contractDetails.patchValue({
      start_contract: this.formatDateForInput(data.job_info.start_contract),
      contract_type: data.job_info.contract_type?.id,
      contract_end_date: this.formatDateForInput(data.job_info.end_contract || ''),
      notice_period: null,
      salary: data.job_info.salary,
      insurance_salary: ''
    }, options);

    this.attendanceDetails.patchValue({
      employment_type: data.job_info.employment_type?.id,
      work_mode: data.job_info.work_mode?.id,
      days_on_site: data.job_info.days_on_site,
      work_schedule_id: data.job_info.work_schedule?.id
    }, options);

    const hasInsuranceSalary = data.job_info.insurance_salary != null && data.job_info.insurance_salary !== 0;
    const hasGrossInsurance = data.job_info.gross_insurance != null && data.job_info.gross_insurance !== 0;

    this.insuranceDetails.patchValue({
      include_insurance_salary: hasInsuranceSalary,
      insurance_salary: hasInsuranceSalary ? data.job_info.insurance_salary : '',
      include_gross_insurance_salary: hasGrossInsurance,
      gross_insurance_salary: hasGrossInsurance ? data.job_info.gross_insurance : ''
    }, options);

  }



  private formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  formatDateForAPI(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
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
    // this.attendanceDetails.get('work_mode')?.valueChanges.subscribe((workMode: any) => {
    //   const daysOnSiteControl = this.attendanceDetails.get('days_on_site');
    //   if (workMode === 3) { // Hybrid
    //     daysOnSiteControl?.enable({ emitEvent: false });
    //     daysOnSiteControl?.setValidators([Validators.required, Validators.min(1), Validators.max(7)]);
    //   } else if (workMode === 1) { // On site
    //     daysOnSiteControl?.enable({ emitEvent: false });
    //     daysOnSiteControl?.setValue(7);
    //     daysOnSiteControl?.clearValidators();
    //   } else { // Remote
    //     daysOnSiteControl?.enable({ emitEvent: false });
    //     daysOnSiteControl?.setValue(0);
    //     daysOnSiteControl?.clearValidators();
    //   }
    //   // daysOnSiteControl?.updateValueAndValidity();
    //   daysOnSiteControl?.updateValueAndValidity({ emitEvent: false });
    // });


    // Watch for work mode changes to handle days on site requirement
    this.attendanceDetails.get('work_mode')?.valueChanges.subscribe((workModeId: any) => {
      const id = Number(workModeId);
      const daysOnSiteControl = this.attendanceDetails.get('days_on_site');

      const hybridMode = this.workModes().find(mode => mode.name === 'Hybrid');
      const onSiteMode = this.workModes().find(mode => mode.name === 'On site');
      const remoteMode = this.workModes().find(mode => mode.name === 'Remote');

      if (id === hybridMode?.id) {
        daysOnSiteControl?.enable({ emitEvent: false });
        daysOnSiteControl?.setValidators([Validators.required, Validators.min(1), Validators.max(7)]);
      } else if (id === onSiteMode?.id) {
        daysOnSiteControl?.disable({ emitEvent: false });
        daysOnSiteControl?.setValue(0);
        daysOnSiteControl?.clearValidators();
      } else if (id === remoteMode?.id) {
        daysOnSiteControl?.disable({ emitEvent: false });
        daysOnSiteControl?.setValue(0);
        daysOnSiteControl?.clearValidators();
      }

      daysOnSiteControl?.updateValueAndValidity({ emitEvent: false });
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

    // Watch for insurance salary inclusion changes
    this.insuranceDetails.get('include_insurance_salary')?.valueChanges.subscribe(includeInsurance => {
      const insuranceSalaryControl = this.insuranceDetails.get('insurance_salary');
      if (includeInsurance) {
        insuranceSalaryControl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        insuranceSalaryControl?.clearValidators();
        insuranceSalaryControl?.setValue('');
      }
      insuranceSalaryControl?.updateValueAndValidity();
    });

    // Watch for gross insurance salary inclusion changes
    this.insuranceDetails.get('include_gross_insurance_salary')?.valueChanges.subscribe(includeGrossInsurance => {
      const grossInsuranceSalaryControl = this.insuranceDetails.get('gross_insurance_salary');
      if (includeGrossInsurance) {
        grossInsuranceSalaryControl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        grossInsuranceSalaryControl?.clearValidators();
        grossInsuranceSalaryControl?.setValue('');
      }
      grossInsuranceSalaryControl?.updateValueAndValidity();
    });
  }

  // Form getters
  get mainInformation() { return this.employeeForm.get('main_information') as FormGroup; }
  get jobDetails() { return this.employeeForm.get('job_details') as FormGroup; }
  get contractDetails() { return this.employeeForm.get('contract_details') as FormGroup; }
  get attendanceDetails() { return this.employeeForm.get('attendance_details') as FormGroup; }
  get insuranceDetails() { return this.employeeForm.get('insurance_details') as FormGroup; }
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

  getDisplayName(fieldName: string): string {
    return FIELD_DISPLAY_NAMES[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string, formGroup?: FormGroup): boolean {
    const group = formGroup || this.employeeForm;
    const field = group.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string, formGroup?: FormGroup): string {
    const group = formGroup || this.employeeForm;
    const field = group.get(fieldName);
    const displayName = this.getDisplayName(fieldName)

    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${displayName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
      if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength}`;
      if (field.errors['pattern']) return 'Number must start with 10, 11, 12, or 15';
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
      if (field.errors['fourParts']) return `${displayName} must contain exactly 4 words`;
      if (field.errors['wordTooShort']) return `Each word in ${displayName} must be at least 3 characters long`;
      if (field.errors['invalidCharacters']) return `${displayName} cannot contain special characters`;
      if (field.errors['pastDate']) return `${displayName}  date cannot be in the past`;
    }

    if (fieldName === 'contract_end_date' && group.errors && group.errors['dateRange']) {
      return `${displayName} date must be after start date`;
    }
    return '';
  }

  // date range validation

  dateRangeValidator(control: any) {
    const form = control as FormGroup;
    const fromDate = form.get('start_contract')?.value;
    const toDate = form.get('contract_end_date')?.value;

    if (fromDate && toDate && new Date(fromDate) >= new Date(toDate)) {
      return { dateRange: true };
    }
    return null;
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
      case 5:
        this.insuranceDetails.markAllAsTouched();
        if (this.insuranceDetails.invalid) {
          isValid = false;
          this.errMsg.set('Please fill in all required fields in Insurance Details');
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

  // resetEmployeeData(): void {
  //   // clear form and all related signals
  //   this.mainInformation.reset();
  //   this.jobDetails.reset();
  //   this.contractDetails.reset();
  //   this.attendanceDetails.reset();
  //   this.insuranceDetails.reset();

  //   // reset signals
  //   this.currentStep.set(1);
  //   this.isModalOpen.set(false);
  //   this.isLoading.set(false);
  //   this.errMsg.set('');
  // }



  getFormData(isEditMode: boolean) {
    const formData = this.employeeForm.value;
    const originalData = this.employeeData();
    if (!originalData) return null;
    return {
      request_data: {
        id: originalData.id,
        main_information: {
          code: formData.main_information.code || originalData.id.toString(),
          name: formData.main_information.name,
          gender: formData.main_information.gender || 1, // Default to 1 (Male) if not provided
          mobile: {
            country_id: formData.main_information.mobile.country_id,
            number: parseInt(formData.main_information.mobile.number)
          },
          personal_email: formData.main_information.personal_email,
          marital_status: formData.main_information.marital_status,
          date_of_birth: this.formatDateForAPI(formData.main_information.date_of_birth),
          address: formData.main_information.address
        },
        job_details: {
          years_of_experience: formData.job_details.years_of_experience,
          branch_id: originalData.job_info.branch?.id,
          department_id: originalData.job_info.department?.id,
          section_id: originalData.job_info.section?.id,
          job_title_id: originalData.job_info.job_title?.id,
          work_schedule_id: formData.attendance_details.work_schedule_id || originalData.job_info.work_schedule?.id
        },
        contract_details: {
          start_contract: this.formatDateForAPI(originalData.job_info.start_contract),
          contract_type: originalData.job_info.contract_type?.id || 1, // 1 With End Date, 2 Without End Date
          contract_end_date: originalData.job_info.end_contract ? this.formatDateForAPI(originalData.job_info.end_contract) : '',
          employment_type: originalData.job_info.employment_type?.id || 1, // 1 Full Time, 2 Part Time, 3 Per Hour
          work_mode: originalData.job_info.work_mode?.id || 1, // 1 On Site, 2 Remote, 3 Hybrid
          days_on_site: formData.attendance_details.days_on_site || 0,
          salary: originalData.job_info.salary ? parseFloat(originalData.job_info.salary.toString()) : 0,
          insurance_salary: formData.insurance_details?.include_insurance_salary && formData.insurance_details?.insurance_salary
            ? parseFloat(formData.insurance_details.insurance_salary)
            : (originalData.job_info.insurance_salary || 0),
          gross_insurance: formData.insurance_details?.include_gross_insurance_salary && formData.insurance_details?.gross_insurance_salary
            ? parseFloat(formData.insurance_details.gross_insurance_salary)
            : (originalData.job_info.gross_insurance || 0),
          notice_period: formData.contract_details.notice_period || 0
        }
      }
    };
  }


  resetForm(): void {
    this.employeeForm.reset();
    // Set default values after reset
    this.mobileGroup.get('country_id')?.setValue(1);
    this.contractDetails.get('contract_type')?.setValue(2);
    this.contractDetails.get('include_probation')?.setValue(false);
    this.contractDetails.get('notice_period')?.setValue(null);
    this.contractDetails.get('insurance_salary')?.setValue('');
    this.insuranceDetails.get('include_insurance_salary')?.setValue(false);
    this.insuranceDetails.get('insurance_salary')?.setValue('');
    this.insuranceDetails.get('include_gross_insurance_salary')?.setValue(false);
    this.insuranceDetails.get('gross_insurance_salary')?.setValue('');
    this.currentStep.set(1);
    this.errMsg.set('');
    this.selectedJobTitle.set(null);
    this.currentSalaryRange.set(null);
  }

  // Debug method to help identify validation issues
  debugFormState(): void {
  }
}
