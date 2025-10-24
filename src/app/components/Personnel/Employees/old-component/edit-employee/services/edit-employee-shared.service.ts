import { Injectable, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { COUNTRIES, Country } from '../../create-employee/countries-list';
// import { Employee } from '../../../../../core/interfaces/employee';
import { CreateEmployeeSharedService } from '../../create-employee/services/create-employee-shared.service';
import { Employee } from 'app/core/interfaces/employee';

@Injectable({
   providedIn: 'root'
})
export class EditEmployeeSharedService {
   private fb = new FormBuilder();

   // Reactive Forms
   employeeForm!: FormGroup;

   // Component state as signals
   readonly currentStep = signal<number>(1);
   readonly errMsg = signal<string>('');
   readonly isLoading = signal<boolean>(false);
   readonly dropdownOpen = signal<boolean>(false);
   readonly isModalOpen = signal<boolean>(false);
   readonly isSuccessModalOpen = signal<boolean>(false);
   readonly employeeData = signal<Employee | null>(null);
   // Create service injected in constructor
   private createService: CreateEmployeeSharedService;

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
   readonly countries = signal<Country[]>(COUNTRIES);
   readonly workSchedules = signal<any[]>([]);
   readonly branches = signal<any[]>([]);


   constructor(createService: CreateEmployeeSharedService) {
      this.createService = createService;
      this.initializeForm();
      this.setupFormWatchers();
   }

   private initializeForm(): void {
      this.employeeForm = this.fb.group({
         main_information: this.fb.group({
            code: [''],
            name: ['', [Validators.required, Validators.minLength(2)]],
            gender: [null], // Make gender optional since it's not in the API response
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
            branch_id: [null, Validators.required],             // editable
            department_id: [{ value: null, disabled: true }],   // read-only
            section_id: [{ value: null, disabled: true }],      // read-only
            job_title_id: [{ value: null, disabled: true }],    // read-only
            years_of_experience: [null]                          // editable
         }),
         contract_details: this.fb.group({
            start_contract: [{ value: '', disabled: true }],
            contract_type: [{ value: 2, disabled: true }],
            contract_end_date: [{ value: '', disabled: true }],
            notice_period: [{ value: null, disabled: true }],
            salary: [{ value: '', disabled: true }],
            insurance_salary: ['', [Validators.min(0)]]
         }),
         insurance_details: this.fb.group({
            include_insurance_salary: [false],
            insurance_salary: [''],
            include_gross_insurance_salary: [false],
            gross_insurance_salary: ['']
         }),
         attendance_details: this.fb.group({
            employment_type: [{ value: null, disabled: true }],   // read-only
            work_mode: [{ value: null, disabled: true }],        // read-only
            days_on_site: ['', Validators.min(0)],               // editable
            work_schedule_id: [null, Validators.required]        // editable
            // activate_attendance_rules remains checkbox in template (always disabled)
         })
      });
   }

   private setupFormWatchers(): void {
      // Strip leading zeros from phone number and enforce prefix pattern
      this.mobileGroup.get('number')?.valueChanges.subscribe(value => {
         if (value && typeof value === 'string') {
            let cleanValue = value.replace(/^0+/, '');

            if (cleanValue && !cleanValue.match(/^(10|11|12|15)/)) {
               if (cleanValue.length > 0 && !['1', '2', '5'].includes(cleanValue[0])) {
                  cleanValue = '';
               } else if (cleanValue.length === 1 && cleanValue === '1') {
                  cleanValue = '1';
               } else if (cleanValue.length === 2) {
                  if (!['10', '11', '12', '15'].includes(cleanValue)) {
                     cleanValue = cleanValue[0];
                  }
               }
            }

            if (cleanValue !== value) {
               this.mobileGroup.get('number')?.setValue(cleanValue, { emitEvent: false });
            }
         }
      });

      // Watch for insurance salary inclusion changes (edit)
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

      this.insuranceDetails.get('include_gross_insurance_salary')?.valueChanges.subscribe(includeGross => {
         const grossControl = this.insuranceDetails.get('gross_insurance_salary');
         if (includeGross) {
            grossControl?.setValidators([Validators.required, Validators.min(0)]);
         } else {
            grossControl?.clearValidators();
            grossControl?.setValue('');
         }
         grossControl?.updateValueAndValidity();
      });
   }

   // Form getter for insurance details
   get insuranceDetails() { return this.employeeForm.get('insurance_details') as FormGroup; }

   // Form getters
   get mainInformation() { return this.employeeForm.get('main_information') as FormGroup; }
   get jobDetails() { return this.employeeForm.get('job_details') as FormGroup; }
   get contractDetails() { return this.employeeForm.get('contract_details') as FormGroup; }
   get attendanceDetails() { return this.employeeForm.get('attendance_details') as FormGroup; }
   get mobileGroup() { return this.mainInformation.get('mobile') as FormGroup; }

   // Country methods
   selectCountry(country: Country) {
      // For now, we'll use index + 1 as ID since Country interface doesn't have id
      const countryIndex = this.countries().findIndex(c => c.name === country.name);
      this.mobileGroup.get('country_id')?.setValue(countryIndex + 1);
      this.dropdownOpen.set(false);
   }

   getSelectedCountry(): Country {
      const countryId = this.mobileGroup.get('country_id')?.value;
      // Use index-based lookup (countryId - 1)
      return this.countries()[countryId - 1] || this.countries()[0];
   }

   // Branches
   getActiveBranches() {
      return this.createService.getActiveBranches();
   }

   // Work schedules`
   getActiveWorkSchedules() {
      return this.workSchedules().filter((w) => w.is_active);
   }

   // Load employee data and populate form
   loadEmployeeData(data: Employee): void {
      this.employeeData.set(data);

      // Populate main information (editable)
      this.mainInformation.patchValue({
         code: data.id.toString(),
         name: data.contact_info.name,
         gender: data.contact_info.gender?.id || null,  // Gender is not in the Employee interface, will need to handle separately
         mobile: {
            country_id: data.contact_info.mobile?.country?.id || 1,
            number: data.contact_info.mobile?.number?.toString()
         },
         personal_email: data.contact_info.email,
         marital_status: data.contact_info.marital_status?.id,
         date_of_birth: this.formatDateForInput(data.contact_info.date_of_birth),
         address: data.contact_info.address
      });

      // Populate job details (read-only)
      this.jobDetails.patchValue({
         branch_id: data.job_info.branch?.id,
         department_id: data.job_info.department?.id,
         section_id: data.job_info.section?.id,
         job_title_id: data.job_info.job_title?.id,
         years_of_experience: 0 // Not available in Employee interface
      });

      // Populate contract details (mostly read-only, except insurance_salary)
      this.contractDetails.patchValue({
         start_contract: this.formatDateForInput(data.job_info.start_contract),
         contract_type: data.job_info.contract_type?.id,
         contract_end_date: this.formatDateForInput(data.job_info.end_contract || ''),
         notice_period: null, // Add this if available in API
         salary: data.job_info.salary,
         insurance_salary: '' // This is editable, leave empty initially
      });

      // Populate attendance details (read-only)
      this.attendanceDetails.patchValue({
         employment_type: data.job_info.employment_type?.id,
         work_mode: data.job_info.work_mode?.id,
         days_on_site: data.job_info.days_on_site,
         work_schedule_id: data.job_info.work_schedule?.id
      });

      // Populate insurance details (editable)
      const hasInsuranceSalary = data.job_info.insurance_salary != null && data.job_info.insurance_salary !== 0;
      const hasGrossInsurance = data.job_info.gross_insurance != null && data.job_info.gross_insurance !== 0;

      this.insuranceDetails.patchValue({
         include_insurance_salary: hasInsuranceSalary,
         insurance_salary: hasInsuranceSalary ? data.job_info.insurance_salary : '',
         include_gross_insurance_salary: hasGrossInsurance,
         gross_insurance_salary: hasGrossInsurance ? data.job_info.gross_insurance : ''
      });
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

   // Validation methods
   isFieldInvalid(fieldName: string, formGroup?: FormGroup): boolean {
      const group = formGroup || this.employeeForm;
      const field = group.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
   }

   getFieldError(fieldName: string, formGroup?: FormGroup): string {
      const group = formGroup || this.employeeForm;
      const field = group.get(fieldName);

      if (field && field.errors) {
         if (field.errors['required']) {
            return `${this.getFieldDisplayName(fieldName)} is required.`;
         }
         if (field.errors['email']) {
            return 'Please enter a valid email address.';
         }
         if (field.errors['minlength']) {
            const minLength = field.errors['minlength'].requiredLength;
            return `${this.getFieldDisplayName(fieldName)} must be at least ${minLength} characters long.`;
         }
         if (field.errors['pattern']) {
            if (fieldName === 'number') {
               return 'Phone number must start with 10, 11, 12, or 15 and be 11 digits total.';
            }
            return `${this.getFieldDisplayName(fieldName)} format is invalid.`;
         }
         if (field.errors['min']) {
            return `${this.getFieldDisplayName(fieldName)} must be greater than or equal to ${field.errors['min'].min}.`;
         }
      }
      return '';
   }

   private getFieldDisplayName(fieldName: string): string {
      const displayNames: { [key: string]: string } = {
         'name': 'Full Name',
         'gender': 'Gender',
         'mobile': 'Mobile Number',
         'number': 'Phone Number',
         'personal_email': 'Personal Email',
         'marital_status': 'Marital Status',
         'date_of_birth': 'Date of Birth',
         'address': 'Address',
         'insurance_salary': 'Insurance Salary',
         'gross_insurance_salary': 'Gross Insurance Salary'
      };
      return displayNames[fieldName] || fieldName;
   }

   // Step navigation
   goNext() {
      if (this.currentStep() < 4) {
         this.currentStep.set(this.currentStep() + 1);
      }
   }

   goPrev() {
      if (this.currentStep() > 1) {
         this.currentStep.set(this.currentStep() - 1);
      }
   }

   goToStep(step: number) {
      if (step >= 1 && step <= 4) {
         this.currentStep.set(step);
      }
   }

   // Get form data for submission
   getFormData() {
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
               years_of_experience: formData.job_details.years_of_experience || 0,
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

   resetEmployeeData(): void {
      // clear form and all related signals
      this.mainInformation.reset();
      this.jobDetails.reset();
      this.contractDetails.reset();
      this.attendanceDetails.reset();
      this.insuranceDetails.reset();

      // reset signals
      this.currentStep.set(1);
      this.isModalOpen.set(false);
      this.isLoading.set(false);
      this.errMsg.set('');
   }
}
