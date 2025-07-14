import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateEmployeeRequest, CreateEmployeeResponse } from '../../../../core/interfaces/employee';
import { Branch } from '../../../../core/interfaces/branch';
import { Department } from '../../../../core/interfaces/department';
import { JobTitle } from '../../../../core/interfaces/job-title';
import { WorkSchedule } from '../../../../core/interfaces/work-schedule';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { WorkSchaualeService } from '../../../../core/services/personnel/work-schaduale/work-schauale.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { PageHeaderComponent } from './../../../shared/page-header/page-header.component';
import { COUNTRIES, Country } from './countries-list';

@Component({
  selector: 'app-create-employee',
  imports: [PageHeaderComponent, CommonModule, ReactiveFormsModule, PopupComponent],
  providers: [DatePipe],
  templateUrl: './create-employee.component.html',
  styleUrl: './create-employee.component.css',
})

export class CreateEmployeeComponent implements OnInit {
  // Dependency Injection
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private toasterMessageService = inject(ToasterMessageService);
  private branchesService = inject(BranchesService);
  private departmentsService = inject(DepartmentsService);
  private jobsService = inject(JobsService);
  private workScheduleService = inject(WorkSchaualeService);
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);

  // Reactive Forms
  employeeForm: FormGroup;

  // Component state as signals
  readonly todayFormatted = signal<string>('');
  readonly errMsg = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly branches = signal<Branch[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly sections = signal<any[]>([]);
  readonly jobTitles = signal<JobTitle[]>([]);
  readonly workSchedules = signal<WorkSchedule[]>([]);
  readonly currentStep = signal<number>(1);
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

  // ViewChild

  // --- 1. Constructor: Form Initialization and Watchers ---
  constructor() {
    const today = new Date();
    this.todayFormatted.set(this.datePipe.transform(today, 'dd/MM/yyyy')!);

    // Initialize reactive form
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
        work_schedule_id: [null, Validators.required]
      }),
      contract_details: this.fb.group({
        start_contract: ['', Validators.required],
        contract_type: [2, Validators.required], // Default to without end date
        contract_end_date: [''],
        employment_type: [null, Validators.required],
        work_mode: [null, Validators.required],
        days_on_site: [''],
        salary: ['', [Validators.required, Validators.min(0)]]
      })
    });

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
    this.contractDetails.get('work_mode')?.valueChanges.subscribe(workMode => {
      const daysOnSiteControl = this.contractDetails.get('days_on_site');
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

    // Watch for branch changes to fetch departments and sections
    this.jobDetails.get('branch_id')?.valueChanges.subscribe(branchId => {
      if (branchId) {
        this.loadDepartmentsByBranch(branchId);
        // Reset dependent fields
        this.jobDetails.get('department_id')?.setValue(null);
        this.jobDetails.get('section_id')?.setValue(null);
      } else {
        this.departments.set([]);
        this.sections.set([]);
      }
    });

    // Watch for department changes to reset section and load job titles
      this.jobDetails.get('department_id')?.valueChanges.subscribe(departmentId => {
        // reset dependent fields
        this.jobDetails.get('section_id')?.setValue(null);
        this.jobDetails.get('job_title_id')?.setValue(null);
        if (departmentId) {
          // fetch all job titles for selected department using paginated API
          this.jobsService.getAllJobTitles(1, 100, { department: departmentId.toString() }).subscribe({
            next: res => {
              const titles = res.data?.list_items || [];
              this.jobTitles.set(titles);
              // fetch work schedules for selected department
              this.workScheduleService.getAllWorkSchadule(1, 100, { department: departmentId.toString() }).subscribe({
                next: res => {
                  const schedules = res.data?.list_items || [];
                  this.workSchedules.set(schedules);
                  if (schedules.length) {
                    this.jobDetails.get('work_schedule_id')?.setValue(schedules[0].id);
                  }
                },
                error: err => console.error('Error loading work schedules for department', err)
              });
            },
            error: err => {
              console.error('Error loading job titles for department', err);
              this.jobTitles.set([]);
            }
          });
        } else {
          this.jobTitles.set([]);
        }
      });

    // Watch for job title changes to update salary ranges
    this.jobDetails.get('job_title_id')?.valueChanges.subscribe(jobTitleId => {
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
    this.contractDetails.get('employment_type')?.valueChanges.subscribe(employmentType => {
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

  // --- 2. ngOnInit: Initial Data Loading ---
  ngOnInit(): void {
    this.branchesService.getAllBranches(1, 100).subscribe({
      next: (res) => this.branches.set(res.data.list_items),
      error: (err) => console.error('Error loading branches', err),
    });
    this.workScheduleService.getAllWorkSchadule(1, 100).subscribe({
      next: (res) => this.workSchedules.set(res.data.list_items),
      error: (err) => console.error('Error loading work schedules', err),
    });
  }

  // --- 3. Data Loading Methods ---
  loadDepartmentsByBranch(branchId: number): void {
    // Fetch departments for selected branch using filters
    this.departmentsService.getAllDepartment(1, 100, { branch_id: branchId, status: 'all' }).subscribe({
      next: (res) => {
        const depts = res.data?.list_items || [];
        this.departments.set(depts);
        
        // Extract all sections from all departments
        const allSections: any[] = [];
        depts.forEach((dept: any) => {
          if (dept.sections && Array.isArray(dept.sections)) {
            allSections.push(...dept.sections);
          }
        });
        this.sections.set(allSections);
      },
      error: (err) => {
        console.error('Error loading departments by branch', err);
        this.departments.set([]);
        this.sections.set([]);
      }
    });
  }

  // --- 4. Form Utility Methods and Getters ---
  get mainInformation() { return this.employeeForm.get('main_information') as FormGroup; }
  get jobDetails() { return this.employeeForm.get('job_details') as FormGroup; }
  get contractDetails() { return this.employeeForm.get('contract_details') as FormGroup; }
  get mobileGroup() { return this.mainInformation.get('mobile') as FormGroup; }

  selectCountry(country: Country) {
    const countryIndex = this.countries().findIndex(c => c.dialCode === country.dialCode);
    this.mobileGroup.get('country_id')?.setValue(countryIndex + 1);
  }

  getSelectedCountry(): Country {
    const countryId = this.mobileGroup.get('country_id')?.value;
    return this.countries()[countryId - 1] || this.countries()[0];
  }

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

  // --- Salary Range Methods ---
  updateSalaryRange(): void {
    const selectedTitle = this.selectedJobTitle();
    const employmentType = +this.contractDetails.get('employment_type')?.value;
    
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

  getEmploymentTypeName(typeId: number): string {
    switch (typeId) {
      case 1: return 'full_time';
      case 2: return 'part_time';
      case 3: return 'per_hour';
      default: return '';
    }
  }

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

  // --- 5. Step Navigation and Validation ---
  validateCurrentStep(): boolean {
    let isValid = true;
    this.errMsg.set('');

    switch (this.currentStep()) {
      case 1:
        this.mainInformation.markAllAsTouched();
        if (this.mainInformation.invalid) {
          isValid = false;
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
        this.contractDetails.markAllAsTouched();
        if (this.contractDetails.invalid) {
          isValid = false;
          this.errMsg.set('Please fill in all required fields in Contract Details');
        }
        break;
    }
    return isValid;
  }

  goNext() {
    if (this.validateCurrentStep()) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  goPrev() {
    this.currentStep.set(this.currentStep() - 1);
  }

  // --- 6. Dropdown/Modal Handlers ---
  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(target)) {
      this.dropdownOpen.set(false);
    }
  }

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  confirmAction() {
    this.isModalOpen.set(false);
    this.router.navigate(['/employees/all-employees']);
  }

  openSuccessModal() {
    this.isSuccessModalOpen.set(true);
  }

  closeSuccessModal() {
    this.isSuccessModalOpen.set(false);
  }

  viewEmployees() {
    this.closeSuccessModal();
    this.router.navigate(['/employees/all-employees']);
  }

  createAnother() {
    this.closeSuccessModal();
    this.employeeForm.reset();
    this.currentStep.set(1);
  }

  // --- 7. Other Utility Methods ---
  get withEndDate(): boolean {
    return this.contractDetails.get('contract_type')?.value === 1;
  }

  // --- 8. Form Submission ---
  onSubmit() {
    if (this.employeeForm.valid) {
      this.isLoading.set(true);
      this.errMsg.set('');

      const formData = this.employeeForm.value;

      // Transform form data to match the API contract
      const employeeData: CreateEmployeeRequest = {
        request_data: {
          main_information: {
            code: formData.main_information.code || '',
            name: formData.main_information.name,
            gender: parseInt(formData.main_information.gender, 10),
            mobile: {
              country_id: formData.main_information.mobile.country_id,
              number: parseInt(formData.main_information.mobile.number)
            },
            personal_email: formData.main_information.personal_email,
            marital_status: parseInt(formData.main_information.marital_status, 10),
            date_of_birth: formData.main_information.date_of_birth,
            address: formData.main_information.address
          },
          job_details: {
            branch_id: parseInt(formData.job_details.branch_id, 10),
            department_id: parseInt(formData.job_details.department_id, 10),
            section_id: formData.job_details.section_id ? parseInt(formData.job_details.section_id, 10) : undefined,
            job_title_id: parseInt(formData.job_details.job_title_id, 10),
            work_schedule_id: parseInt(formData.job_details.work_schedule_id, 10)
          },
          contract_details: {
            start_contract: formData.contract_details.start_contract,
            contract_type: formData.contract_details.contract_type,
            contract_end_date: formData.contract_details.contract_type === 1 ? formData.contract_details.contract_end_date : undefined,
            employment_type: parseInt(formData.contract_details.employment_type, 10),
            work_mode: parseInt(formData.contract_details.work_mode, 10),
            days_on_site: formData.contract_details.days_on_site ? parseInt(formData.contract_details.days_on_site, 10) : undefined,
            salary: parseFloat(formData.contract_details.salary)
          }
        }
      };

      console.log('Employee Data to Submit:', employeeData);

      // Call the real employee service
      this.employeeService.createEmployee(employeeData).subscribe({
        next: (response: CreateEmployeeResponse) => {
          this.isLoading.set(false);
          this.toasterMessageService.sendMessage('Employee created successfully!');
          this.openSuccessModal();
        },
        error: (error: any) => {
          this.isLoading.set(false);
          this.errMsg.set(error.message || 'An error occurred while creating the employee');
          this.toasterMessageService.sendMessage('Failed to create employee');
        }
      });
    } else {
      this.employeeForm.markAllAsTouched();
      this.errMsg.set('Please fill in all required fields');

      // Scroll to first invalid field
      const firstInvalidField = document.querySelector('.is-invalid');
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  getFormDataFormatted(): CreateEmployeeRequest | null {
    if (this.employeeForm.valid) {
      const formData = this.employeeForm.value;
      return {
        request_data: {
          main_information: {
            code: formData.main_information.code || '',
            name: formData.main_information.name,
            gender: formData.mainInformation.gender,
            mobile: {
              country_id: formData.main_information.mobile.country_id,
              number: parseInt(formData.main_information.mobile.number)
            },
            personal_email: formData.main_information.personal_email,
            marital_status: formData.main_information.marital_status,
            date_of_birth: formData.main_information.date_of_birth,
            address: formData.main_information.address
          },
          job_details: {
            branch_id: formData.job_details.branch_id,
            department_id: formData.job_details.department_id,
            section_id: formData.job_details.section_id || undefined,
            job_title_id: formData.job_details.job_title_id,
            work_schedule_id: formData.job_details.work_schedule_id
          },
          contract_details: {
            start_contract: formData.contract_details.start_contract,
            contract_type: formData.contract_details.contract_type,
            contract_end_date: formData.contract_details.contract_type === 1 ? formData.contract_details.contract_end_date : undefined,
            employment_type: formData.contract_details.employment_type,
            work_mode: formData.contract_details.work_mode,
            days_on_site: formData.contract_details.days_on_site ? parseInt(formData.contract_details.days_on_site) : undefined,
            salary: parseFloat(formData.contract_details.salary)
          }
        }
      };
    }
    return null;
  }

  @ViewChild('dropdownContainer') dropdownRef!: ElementRef;
}
