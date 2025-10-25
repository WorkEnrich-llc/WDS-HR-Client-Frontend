import { inject, Injectable, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Branch } from '../../../../../core/interfaces/branch';
import { Department } from '../../../../../core/interfaces/department';
import { JobTitle } from '../../../../../core/interfaces/job-title';
import { WorkSchedule } from '../../../../../core/interfaces/work-schedule';
import { COUNTRIES, Country } from '../countries-list';
import { Employee } from 'app/core/interfaces/employee';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { catchError, debounceTime, distinctUntilChanged, filter, forkJoin, map, of, pairwise, startWith, switchMap } from 'rxjs';
import { BranchesService } from 'app/core/services/od/branches/branches.service';
import { DepartmentsService } from 'app/core/services/od/departments/departments.service';
import { JobsService } from 'app/core/services/od/jobs/jobs.service';
import { arabicNameValidator, fourPartsValidator } from 'app/components/settings/profile-settings/profile.validators';
import { CustomValidators } from 'app/core/validators/custom-validators';
import { WorkSchaualeService } from 'app/core/services/attendance/work-schaduale/work-schauale.service';

// Error message mapping
const FIELD_DISPLAY_NAMES: { [key: string]: string } = {
  'name_english': 'Name',
  'name_arabic': 'Name',
  'email': 'Email',
  'mobile': 'Mobile',
  'personal_email': 'Personal Email',
  'marital_status': 'Marital Status',
  'date_of_birth': 'Date of Birth',
  'address': 'Address',
  'management_level': 'Management Level',
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

@Injectable(
  {
    providedIn: 'root'
  }
)
export class ManageEmployeeSharedService {
  private fb = new FormBuilder();
  private employeeService = inject(EmployeeService);
  private branchesService = inject(BranchesService);
  private departmentsService = inject(DepartmentsService);
  private jobsService = inject(JobsService);
  private workScheduleService = inject(WorkSchaualeService);

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
  readonly isEditMode = signal<boolean>(false);
  suppressWatchers = false;

  constructor() {
    this.initializeForm();
    this.setupFormWatchers();
    this.initializeJobDetailsWatchers();
    // this.loadInitialData()
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      main_information: this.fb.group({
        code: [''],
        name_english: ['', [Validators.required, fourPartsValidator()]],
        name_arabic: ['', [Validators.required, arabicNameValidator()]],
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
        management_level: [null, Validators.required],
        job_title_id: [null, Validators.required],
        years_of_experience: [null]
      }),
      contract_details: this.fb.group({
        start_contract: ['', [Validators.required]],
        contract_type: [2, Validators.required],
        contract_end_date: [''],
        include_probation: [false],
        notice_period: [null],
        salary: ['', [Validators.required, Validators.min(0)]],
        // insurance_salary: ['']
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

  public skipFormGroup(groupName: 'contract_details' | 'job_details' | 'attendance_details' | 'insurance_details'): void {
    if (this.employeeForm.get(groupName)) {
      this.employeeForm.removeControl(groupName);
      console.log(`Form group [${groupName}] has been removed for update mode.`);
    }
  }

  public loadInitialData(): void {
    // if (this.branches().length > 0) {
    //   return;
    // }
    this.isLoading.set(true);
    this.branchesService.getAllBranches(1, 1000).subscribe({
      next: (res) => {
        this.branches.set(res.data.list_items || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load initial branches', err);
        this.isLoading.set(false);
      }
    });
  }

  private fetchJobTitlesForBranch(branchId: number, managementLevel: number): void {
    const jobDetails = this.jobDetails;

    jobDetails.get('job_title_id')?.reset(null, { emitEvent: false });
    this.jobTitles.set([]);

    if (!branchId || !managementLevel) {
      jobDetails.get('job_title_id')?.disable({ emitEvent: false });
      return;
    }
    const params: any = {
      management_level: managementLevel.toString(),
      branch_id: branchId.toString(),
      request_in: 'create'
    };

    this.jobsService.getAllJobTitles(1, 100, params).subscribe({
      next: (res) => {
        const jobTitles = res.data?.list_items || [];
        this.jobTitles.set(jobTitles);

        if (jobTitles.length > 0) {
          jobDetails.get('job_title_id')?.enable({ emitEvent: false });
        } else {
          jobDetails.get('job_title_id')?.disable({ emitEvent: false });
        }
      },
      error: (err) => {
        console.error('Error loading job titles for branch/level', err);
        this.jobTitles.set([]);
        jobDetails.get('job_title_id')?.disable({ emitEvent: false });
      }
    });
  }


  private initializeJobDetailsWatchers(): void {
    const jobDetails = this.jobDetails;
    if (!jobDetails) return;

    const managementCtrl = jobDetails.get('management_level');
    const branchCtrl = jobDetails.get('branch_id');
    const deptCtrl = jobDetails.get('department_id');
    const sectionCtrl = jobDetails.get('section_id');
    const jobTitleCtrl = jobDetails.get('job_title_id');

    this.setInitialJobDetailsState(branchCtrl, deptCtrl, sectionCtrl, jobTitleCtrl);
    this.setupBranchWatcher(branchCtrl, deptCtrl, sectionCtrl, jobTitleCtrl);
    this.setupDepartmentWatcher(deptCtrl, sectionCtrl, jobTitleCtrl);
    this.setupSectionWatcher(sectionCtrl, jobTitleCtrl);
    this.setupManagementLevelWatcher(managementCtrl, jobTitleCtrl, branchCtrl, deptCtrl, sectionCtrl);
    // this.setupJobTitleWatcher(jobTitleCtrl, branchCtrl);
  }

  private setInitialJobDetailsState(
    branchCtrl: AbstractControl | null,
    deptCtrl: AbstractControl | null,
    sectionCtrl: AbstractControl | null,
    jobTitleCtrl: AbstractControl | null
  ): void {
    if (!this.isEditMode()) {
      if (!branchCtrl?.value) deptCtrl?.disable();
      sectionCtrl?.disable();
      jobTitleCtrl?.disable();
    }
    // else {
    // }
  }

  // private setupManagementLevelWatcher(
  //   managementCtrl: AbstractControl | null,
  //   jobTitleCtrl: AbstractControl | null,
  //   branchCtrl: AbstractControl | null,
  //   deptCtrl: AbstractControl | null,
  //   sectionCtrl: AbstractControl | null,
  // ): void {
  //   // const jobDetails = this.jobDetails;
  //   managementCtrl?.valueChanges.pipe(
  //     startWith(managementCtrl?.value)
  //   ).subscribe(currentLevel => {
  //     if (this.suppressWatchers) return;


  //     if (currentLevel && currentLevel !== 5) {
  //       this.loadInitialData();
  //       this.fetchJobTitlesForManagementLevel(currentLevel.toString());
  //       jobTitleCtrl?.setValidators(Validators.required);
  //       jobTitleCtrl?.reset(null, { emitEvent: false });
  //       jobTitleCtrl?.enable();

  //       branchCtrl?.setValidators(Validators.required);
  //       branchCtrl?.disable();
  //       branchCtrl?.reset(null, { emitEvent: false });

  //       // branchCtrl?.disable();
  //       deptCtrl?.disable();
  //       sectionCtrl?.disable();
  //       // branchCtrl?.reset(null, { emitEvent: false });
  //       deptCtrl?.reset(null, { emitEvent: false });
  //       sectionCtrl?.reset(null, { emitEvent: false });

  //       // branchCtrl?.clearValidators();
  //       deptCtrl?.clearValidators();
  //       sectionCtrl?.clearValidators();

  //     } else if (currentLevel === 5) {
  //       this.loadInitialData();
  //       jobTitleCtrl?.clearValidators();
  //       jobTitleCtrl?.disable();
  //       jobTitleCtrl?.reset(null, { emitEvent: false });

  //       branchCtrl?.enable();
  //       branchCtrl?.setValidators(Validators.required);

  //       deptCtrl?.disable();
  //       sectionCtrl?.disable();
  //       deptCtrl?.setValidators(Validators.required);

  //     }
  //     else {
  //       jobTitleCtrl?.clearValidators();
  //       jobTitleCtrl?.disable();
  //       branchCtrl?.clearValidators();
  //       branchCtrl?.disable();
  //       deptCtrl?.clearValidators();
  //       deptCtrl?.disable();
  //       sectionCtrl?.clearValidators();
  //       sectionCtrl?.disable();
  //     }

  //     jobTitleCtrl?.updateValueAndValidity();
  //     branchCtrl?.updateValueAndValidity();
  //     deptCtrl?.updateValueAndValidity();
  //     sectionCtrl?.updateValueAndValidity();
  //   });
  // }

  private setupManagementLevelWatcher(
    managementCtrl: AbstractControl | null,
    jobTitleCtrl: AbstractControl | null,
    branchCtrl: AbstractControl | null,
    deptCtrl: AbstractControl | null,
    sectionCtrl: AbstractControl | null,
  ): void {
    managementCtrl?.valueChanges.pipe(
      startWith(managementCtrl?.value)
    ).subscribe(currentLevel => {
      if (this.suppressWatchers) return;

      jobTitleCtrl?.reset(null, { emitEvent: false });
      branchCtrl?.reset(null, { emitEvent: false });
      deptCtrl?.reset(null, { emitEvent: false });
      sectionCtrl?.reset(null, { emitEvent: false });

      jobTitleCtrl?.disable({ emitEvent: false });
      branchCtrl?.disable({ emitEvent: false });
      deptCtrl?.disable({ emitEvent: false });
      sectionCtrl?.disable({ emitEvent: false });

      jobTitleCtrl?.clearValidators();
      branchCtrl?.clearValidators();
      deptCtrl?.clearValidators();
      sectionCtrl?.clearValidators();

      this.jobTitles.set([]);
      this.departments.set([]);
      this.sections.set([]);


      if (currentLevel == 1) {

        this.fetchJobTitlesForManagementLevel('1', jobTitleCtrl);
        jobTitleCtrl?.setValidators(Validators.required);
        // jobTitleCtrl?.enable();
        this.fetchJobTitlesForManagementLevel('1', jobTitleCtrl);


      } else if (currentLevel >= 2 && currentLevel <= 4) {
        this.loadInitialData();
        branchCtrl?.setValidators(Validators.required);
        branchCtrl?.enable();

        jobTitleCtrl?.setValidators(Validators.required);

      } else if (currentLevel === 5) {

        this.loadInitialData();
        branchCtrl?.setValidators(Validators.required);
        branchCtrl?.enable();

        deptCtrl?.setValidators(Validators.required);
        jobTitleCtrl?.setValidators(Validators.required);
      }

      jobTitleCtrl?.updateValueAndValidity();
      branchCtrl?.updateValueAndValidity();
      deptCtrl?.updateValueAndValidity();
      sectionCtrl?.updateValueAndValidity();
    });
  }


  // private setupJobTitleWatcher(
  //   jobTitleCtrl: AbstractControl | null,
  //   branchCtrl: AbstractControl | null
  // ): void {
  //   jobTitleCtrl?.valueChanges.pipe(
  //     startWith(jobTitleCtrl.value),
  //     filter(() => {
  //       const level = this.jobDetails?.get('management_level')?.value;
  //       return level && level < 5;
  //     })
  //   ).subscribe((jobTitleId) => {
  //     if (this.suppressWatchers) return;

  //     if (jobTitleId) {
  //       branchCtrl?.enable();
  //     } else {
  //       branchCtrl?.disable();
  //       branchCtrl?.reset(null, { emitEvent: false });
  //     }
  //   });
  // }

  // private setupBranchWatcher(
  //   branchCtrl: AbstractControl | null,
  //   deptCtrl: AbstractControl | null,
  //   sectionCtrl: AbstractControl | null,
  //   jobTitleCtrl: AbstractControl | null
  // ): void {
  //   branchCtrl?.valueChanges.pipe(
  //     filter(() => this.jobDetails?.get('management_level')?.value === 5)
  //   ).subscribe((branchId) => {
  //     if (this.suppressWatchers) return;

  //     if (branchId) {
  //       this.fetchDepartmentsForBranch(branchId);
  //       deptCtrl?.enable();
  //       sectionCtrl?.disable();
  //       jobTitleCtrl?.disable();
  //       sectionCtrl?.setValue(null);
  //       jobTitleCtrl?.setValue(null);
  //     } else {
  //       deptCtrl?.disable();
  //       sectionCtrl?.disable();
  //       jobTitleCtrl?.disable();
  //     }
  //   });
  // }

  private setupBranchWatcher(
    branchCtrl: AbstractControl | null,
    deptCtrl: AbstractControl | null,
    sectionCtrl: AbstractControl | null,
    jobTitleCtrl: AbstractControl | null
  ): void {
    branchCtrl?.valueChanges.subscribe((branchId) => {
      if (this.suppressWatchers) return;

      const currentLevel = this.jobDetails?.get('management_level')?.value;

      deptCtrl?.reset(null, { emitEvent: false });
      sectionCtrl?.reset(null, { emitEvent: false });
      jobTitleCtrl?.reset(null, { emitEvent: false });

      this.departments.set([]);
      this.sections.set([]);
      this.jobTitles.set([]);

      if (branchId) {
        if (currentLevel >= 2 && currentLevel <= 4) {
          deptCtrl?.disable({ emitEvent: false });
          sectionCtrl?.disable({ emitEvent: false });

          this.fetchJobTitlesForBranch(branchId, currentLevel);
          jobTitleCtrl?.enable();

        } else if (currentLevel === 5) {
          jobTitleCtrl?.disable({ emitEvent: false });
          sectionCtrl?.disable({ emitEvent: false });

          this.fetchDepartmentsForBranch(branchId);
          deptCtrl?.enable();
        }
      } else {
        deptCtrl?.disable();
        sectionCtrl?.disable();
        jobTitleCtrl?.disable();
      }
    });
  }

  private setupDepartmentWatcher(
    deptCtrl: AbstractControl | null,
    sectionCtrl: AbstractControl | null,
    jobTitleCtrl: AbstractControl | null
  ): void {
    deptCtrl?.valueChanges.pipe(startWith(deptCtrl?.value), pairwise(),
      filter(() => this.jobDetails?.get('management_level')?.value === 5)
    ).subscribe(([prev, current]) => {
      if (this.suppressWatchers) return;

      if (prev !== current) {
        sectionCtrl?.setValue(null);
        jobTitleCtrl?.setValue(null);
      }

      if (current) {
        const selectedDept = this.departments().find(d => d.id == current);
        const deptSections = selectedDept?.sections ?? [];
        this.sections.set(deptSections);

        if (deptSections.length > 0) {
          sectionCtrl?.setValidators(Validators.required);
          sectionCtrl?.enable();
        } else {
          sectionCtrl?.clearValidators();
          sectionCtrl?.disable();
        }
        sectionCtrl?.updateValueAndValidity();

        jobTitleCtrl?.disable();
        jobTitleCtrl?.clearValidators();
        jobTitleCtrl?.updateValueAndValidity();

      } else {
        this.sections.set([]);
        this.jobTitles.set([]);
        sectionCtrl?.disable();
        sectionCtrl?.clearValidators();
        sectionCtrl?.updateValueAndValidity();
        jobTitleCtrl?.disable();
        jobTitleCtrl?.clearValidators();
        jobTitleCtrl?.updateValueAndValidity();
      }
    });
  }

  private setupSectionWatcher(
    sectionCtrl: AbstractControl | null,
    jobTitleCtrl: AbstractControl | null
  ): void {
    sectionCtrl?.valueChanges.pipe(startWith(sectionCtrl?.value), pairwise(),
      filter(() => this.jobDetails?.get('management_level')?.value === 5)
    ).subscribe(([prev, current]) => {
      if (this.suppressWatchers) return;

      if (prev !== current) {
        jobTitleCtrl?.setValue(null);
      }

      if (current) {
        this.fetchJobTitlesForSection(current);
        jobTitleCtrl?.setValidators(Validators.required);
        jobTitleCtrl?.enable();
        jobTitleCtrl?.updateValueAndValidity();
      } else {
        this.jobTitles.set([]);
        jobTitleCtrl?.disable();
        jobTitleCtrl?.clearValidators();
        jobTitleCtrl?.updateValueAndValidity();
      }
    });
  }

  loadEmployeeData(id: number): void {
    this.isLoading.set(true);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        const data = response.data.object_info;
        this.employeeData.set(data);
        this.suppressWatchers = true;
        this.patchEmployeeForm(data);
        this.createdAt.set(data.created_at || '');
        this.updatedAt.set(data.updated_at || '');

        if (data.job_info.branch) {
          this.branches.set([data.job_info.branch]);
        }
        if (data.job_info.department) {
          this.departments.set([data.job_info.department]);
        }
        if (data.job_info.section) {
          this.sections.set([data.job_info.section]);
        }
        if (data.job_info.job_title) {
          this.jobTitles.set([data.job_info.job_title]);
        }
        if (data.job_info.work_schedule) {
          this.workSchedules.set([data.job_info.work_schedule]);
        }
        this.suppressWatchers = false;
        this.jobDetails?.get('management_level')?.updateValueAndValidity({ emitEvent: true });

        this.isLoading.set(false);
        // this.suppressWatchers = false;

      },
      error: (error) => {
        this.isLoading.set(false);
        this.suppressWatchers = false;
        console.error('Failed to load employee', error);
      }
    });
  }

  private fetchJobTitlesForBranchs(branchId: number, managementLevel: number): void {
    const jobDetails = this.jobDetails;

    jobDetails.get('job_title_id')?.reset(null, { emitEvent: false });
    this.jobTitles.set([]);

    if (!branchId || !managementLevel) {
      jobDetails.get('job_title_id')?.disable({ emitEvent: false });
      return;
    }

    jobDetails.get('job_title_id')?.enable({ emitEvent: false });

    const params = {
      branch_id: branchId.toString(),
      management_level: managementLevel.toString()
    };

    this.jobsService.getAllJobTitles(1, 100, params).subscribe({
      next: (res) => {
        const jobTitles = res.data?.list_items || [];
        this.jobTitles.set(jobTitles);
      },
      error: (err) => {
        console.error('Error loading job titles for branch/level', err);
        this.jobTitles.set([]);
      }
    });
  }

  // private fetchJobTitlesForManagementLevel(
  //   management: string,
  //   controlToEnable: AbstractControl | null
  // ): void {
  //   this.jobsService.getAllJobTitles(1, 100, { management_level: management.toString() }).subscribe({
  //     next: (res) => {
  //       if (this.jobDetails.get('management_level')?.value?.toString() === management) {
  //         const jobTitles = res.data?.list_items || [];
  //         this.jobTitles.set(jobTitles);
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error loading job titles for management', err);
  //       this.jobTitles.set([]);
  //     }
  //   });
  // }

  private fetchJobTitlesForManagementLevel(
    management: string,
    controlToEnable: AbstractControl | null
  ): void {

    this.jobsService.getAllJobTitles(1, 100, { management_level: management.toString() }).subscribe({
      next: (res) => {
        if (this.jobDetails.get('management_level')?.value?.toString() === management) {

          const jobTitles = res.data?.list_items || [];
          this.jobTitles.set(jobTitles);

          if (jobTitles.length > 0) {
            controlToEnable?.enable();
          } else {
            controlToEnable?.disable();
          }
        }
      },
      error: (err) => {
        console.error('Error loading job titles for management', err);
        this.jobTitles.set([]);
        controlToEnable?.disable();
      }
    });
  }

  private fetchDepartmentsForBranch(branchId: number): void {
    const jobDetails = this.jobDetails;
    jobDetails.get('department_id')?.reset(null, { emitEvent: false });
    jobDetails.get('section_id')?.reset(null, { emitEvent: false });
    jobDetails.get('job_title_id')?.reset(null, { emitEvent: false });

    this.departments.set([]);
    this.sections.set([]);
    this.jobTitles.set([]);

    jobDetails.get('section_id')?.disable({ emitEvent: false });
    jobDetails.get('job_title_id')?.disable({ emitEvent: false });

    if (!branchId) {
      jobDetails.get('department_id')?.disable({ emitEvent: false });
      return;
    }
    jobDetails.get('department_id')?.enable({ emitEvent: false });

    this.departmentsService.getAllDepartment(1, 100, { branch_id: branchId, status: 'active' }).subscribe({
      next: (res) => {
        // if (this.jobDetails.get('branch_id')?.value === branchId) {
        const depts = res.data?.list_items || [];
        this.departments.set(depts);
        // }
      },
      error: (err) => {
        console.error('Error loading departments for branch', err);
        this.departments.set([]);
      }
    });
  }

  private fetchJobTitlesForSection(sectionId: number): void {
    const jobDetails = this.jobDetails;

    jobDetails.get('job_title_id')?.reset(null, { emitEvent: false });
    this.jobTitles.set([]);
    if (!sectionId) {
      jobDetails.get('job_title_id')?.disable({ emitEvent: false });
      return;
    }

    jobDetails.get('job_title_id')?.enable({ emitEvent: false });
    this.jobsService.getAllJobTitles(1, 100, { section: sectionId.toString() }).subscribe({
      next: (res) => {
        // if (this.jobDetails.get('section_id')?.value === sectionId) {
        const jobTitles = res.data?.list_items || [];
        this.jobTitles.set(jobTitles);
        // }
      },
      error: (err) => {
        console.error('Error loading job titles for section', err);
        this.jobTitles.set([]);
      }
    })
  }


  private patchEmployeeForm(data: Employee): void {
    const options = { emitEvent: false };

    this.mainInformation.patchValue({
      code: data.code,
      // code: data.id.toString(),
      name_english: data.contact_info.name,
      name_arabic: data.contact_info.name_arabic,
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
    if (this.jobDetails) {
      this.jobDetails.patchValue({
        branch_id: data.job_info.branch?.id,
        department_id: data.job_info.department?.id,
        section_id: data.job_info.section?.id,
        management_level: data.job_info.management_level,
        job_title_id: data.job_info.job_title?.id,
        years_of_experience: data.job_info.years_of_experience || 0
      }, options);
    }

    this.contractDetails.patchValue({
      start_contract: this.formatDateForInput(data.job_info.start_contract),
      contract_type: data.job_info.contract_type?.id,
      contract_end_date: this.formatDateForInput(data.job_info.end_contract || ''),
      notice_period: data.job_info.notice_period,
      salary: data.job_info.salary,
      insurance_salary: data.job_info.insurance_salary,
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
    this.updateDaysOnSiteStatus(data.job_info.work_mode?.id);
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

    this.attendanceDetails.get('work_mode')?.valueChanges.subscribe((workModeId: any) => {
      this.updateDaysOnSiteStatus(workModeId);
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

    // Watch for department changes to load relevant work schedules
    // this.jobDetails.get('department_id')?.valueChanges.pipe(
    //   startWith(this.jobDetails.get('department_id')?.value),
    //   distinctUntilChanged(),
    //   switchMap(departmentId => {
    //     if (departmentId) {
    //       return this.workScheduleService.getAllWorkSchadule(1, 100, { department: departmentId.toString() });
    //     }
    //     else {
    //       return this.workScheduleService.getAllWorkSchadule(1, 100);
    //     }
    //   }),
    //   catchError(err => {
    //     console.error('Error loading work schedules', err);
    //     this.workSchedules.set([]);
    //     return of(null);
    //   })
    // ).subscribe(res => {
    //   if (res) {
    //     this.workSchedules.set(res.data?.list_items || []);
    //   }
    // });

    this.jobDetails.get('department_id')?.valueChanges.pipe(
      startWith(this.jobDetails.get('department_id')?.value),

      debounceTime(0),

      map(value => value || null),

      distinctUntilChanged(),

      switchMap(departmentId => {
        const params: { department?: string } = {};
        if (departmentId) {
          params.department = departmentId.toString();
        }
        return this.workScheduleService.getAllWorkSchadule(1, 100, params);
      }),
      catchError(err => {
        console.error('Error loading work schedules', err);
        this.workSchedules.set([]);
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        this.workSchedules.set(res.data?.list_items || []);
      }
    });
  }


  private updateDaysOnSiteStatus(workModeId: number): void {
    const id = Number(workModeId);
    const daysOnSiteControl = this.attendanceDetails.get('days_on_site');
    if (!daysOnSiteControl) return;

    const hybridMode = this.workModes().find(mode => mode.name === 'Hybrid');

    if (id === hybridMode?.id) {
      daysOnSiteControl.enable({ emitEvent: false });
      daysOnSiteControl.setValidators([Validators.required, Validators.min(1), Validators.max(7)]);
    } else {
      // For 'On site' or 'Remote'
      daysOnSiteControl.disable({ emitEvent: false });
      daysOnSiteControl.setValue(0, { emitEvent: false }); // Set value to 0 for consistency
      daysOnSiteControl.clearValidators();
    }
    daysOnSiteControl.updateValueAndValidity({ emitEvent: false });
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

    if (salaryRange && salaryRange.restrict === true) {
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

      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
      if (field.errors['containsSpecialChars']) return `${displayName} cannot contain special characters`;
      if (field.errors['containsArabic']) return `${displayName} cannot contain Arabic characters`;
      if (field.errors['containsEnglish']) return `${displayName} cannot contain English characters`;
      if (field.errors['numbersPattern']) return `${displayName} cannot contain numbers`;
      if (field.errors['fourParts']) return `${displayName} must contain exactly 4 words`;
      if (field.errors['wordTooShort']) return `Each word in ${displayName} must be at least 2 characters long`;
      if (field.errors['pastDate']) return `${displayName}  date cannot be in the past`;

      // if (field.errors['pattern']) {
      //   if (fieldName === 'name_english' || fieldName === 'name_arabic') {
      //     return 'Please enter a valid format';
      //   }
      //   return `${displayName} format is incorrect`;
      // }

      // if (field.errors['pattern']) {
      //   if (fieldName === 'number' || fieldName.endsWith('.number')) {
      //     return 'Number must start with 10, 11, 12, or 15';
      //   }
      //   return `${displayName} format is incorrect`;
      // }

      if (field.errors['pattern']) {
        if (fieldName === 'number' || fieldName.endsWith('.number')) {
          return 'Number must start with 10, 11, 12, or 15';
        }
        if (fieldName === 'name_english' || fieldName === 'name_arabic') {
          return 'Please enter a valid format';
        }
        return `${displayName} format is incorrect`;
      }
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



  // getFormData() {
  //   const formData = this.employeeForm.getRawValue();
  //   const jobDetailsPayload: any = {
  //     years_of_experience: formData.job_details.years_of_experience || 0,
  //     management_level: parseInt(formData.job_details.management_level, 10),
  //     work_schedule_id: parseInt(formData.attendance_details.work_schedule_id, 10),
  //     activate_attendance_rules: formData.attendance_details.activate_attendance_rules || true
  //   };

  //   const managementLevel = jobDetailsPayload.management_level;

  //   if (managementLevel === 5) {
  //     jobDetailsPayload.branch_id = parseInt(formData.job_details.branch_id, 10);
  //     jobDetailsPayload.department_id = parseInt(formData.job_details.department_id, 10);
  //     if (formData.job_details.section_id) {
  //       jobDetailsPayload.section_id = parseInt(formData.job_details.section_id, 10);
  //     }
  //   }

  //   if (formData.job_details.job_title_id) {
  //     jobDetailsPayload.job_title_id = parseInt(formData.job_details.job_title_id, 10);
  //   }

  //   const requestData: any = {
  //     main_information: {
  //       code: formData.main_information.code,
  //       name_english: formData.main_information.name_english,
  //       name_arabic: formData.main_information.name_arabic,
  //       gender: formData.main_information.gender,
  //       mobile: {
  //         country_id: formData.main_information.mobile.country_id,
  //         number: parseInt(formData.main_information.mobile.number)
  //       },
  //       personal_email: formData.main_information.personal_email,
  //       marital_status: formData.main_information.marital_status,
  //       date_of_birth: this.formatDateForAPI(formData.main_information.date_of_birth),
  //       address: formData.main_information.address
  //     },
  //     job_details: jobDetailsPayload
  //   };

  //   // if (!this.isEditMode()) {
  //   if (this.employeeForm.get('contract_details')) {
  //     requestData.contract_details = {
  //       start_contract: this.formatDateForAPI(formData.contract_details.start_contract),
  //       contract_type: formData.contract_details.contract_type,
  //       contract_end_date: formData.contract_details.contract_type === 1
  //         ? this.formatDateForAPI(formData.contract_details.contract_end_date) : '',
  //       employment_type: formData.attendance_details.employment_type,
  //       work_mode: formData.attendance_details.work_mode,
  //       days_on_site: formData.attendance_details.days_on_site
  //         ? parseInt(formData.attendance_details.days_on_site, 10)
  //         : 0,
  //       salary: parseFloat(formData.contract_details.salary),
  //       insurance_salary: formData.insurance_details.include_insurance_salary
  //         ? parseFloat(formData.insurance_details.insurance_salary)
  //         : 0,
  //       gross_insurance: formData.insurance_details.include_gross_insurance_salary
  //         ? parseFloat(formData.insurance_details.gross_insurance_salary)
  //         : 0,
  //       notice_period: formData.contract_details.notice_period
  //         ? parseInt(formData.contract_details.notice_period, 10)
  //         : 0
  //     };
  //   } else {
  //     requestData.contract_details = {
  //       employment_type: formData.attendance_details.employment_type,
  //       work_mode: formData.attendance_details.work_mode,
  //       days_on_site: formData.attendance_details.days_on_site
  //         ? parseInt(formData.attendance_details.days_on_site, 10)
  //         : 0,
  //       salary: 0,
  //     }
  //   }
  //   // }

  //   if (!this.isEditMode()) {
  //     return { request_data: requestData };
  //   }

  //   const originalData = this.employeeData();
  //   if (!originalData) return null;

  //   return {
  //     request_data: {
  //       id: originalData.id,
  //       ...requestData
  //     }
  //   };
  // }

  getFormData() {
    const formData = this.employeeForm.getRawValue();
    const jobDetailsPayload: any = {
      years_of_experience: formData.job_details.years_of_experience || 0,
      management_level: parseInt(formData.job_details.management_level, 10),
      work_schedule_id: parseInt(formData.attendance_details.work_schedule_id, 10),
      activate_attendance_rules: formData.attendance_details.activate_attendance_rules || true
    };

    const managementLevel = jobDetailsPayload.management_level;

    // if (managementLevel === 5) {
    //   jobDetailsPayload.branch_id = parseInt(formData.job_details.branch_id, 10);
    //   jobDetailsPayload.department_id = parseInt(formData.job_details.department_id, 10);
    //   if (formData.job_details.section_id) {
    //     jobDetailsPayload.section_id = parseInt(formData.job_details.section_id, 10);
    //   }
    // }

    if (formData.job_details.job_title_id) {
      jobDetailsPayload.job_title_id = parseInt(formData.job_details.job_title_id, 10);
    }

    if (managementLevel >= 2) {
      if (formData.job_details.branch_id) {
        jobDetailsPayload.branch_id = parseInt(formData.job_details.branch_id, 10);
      }
    }

    if (managementLevel === 5) {
      if (formData.job_details.department_id) {
        jobDetailsPayload.department_id = parseInt(formData.job_details.department_id, 10);
      }
      if (formData.job_details.section_id) {
        jobDetailsPayload.section_id = parseInt(formData.job_details.section_id, 10);
      }
    }

    const requestData: any = {
      main_information: {
        code: formData.main_information.code,
        name_english: formData.main_information.name_english,
        name_arabic: formData.main_information.name_arabic,
        gender: formData.main_information.gender,
        mobile: {
          country_id: formData.main_information.mobile.country_id,
          number: parseInt(formData.main_information.mobile.number)
        },
        personal_email: formData.main_information.personal_email,
        marital_status: formData.main_information.marital_status,
        date_of_birth: this.formatDateForAPI(formData.main_information.date_of_birth),
        address: formData.main_information.address
      },
      job_details: jobDetailsPayload
    };

    let contractDetailsPayload: any = {};
    const isCreateMode = !this.isEditMode();

    if (this.employeeForm.get('contract_details')) {
      contractDetailsPayload = {
        employment_type: formData.attendance_details.employment_type,
        work_mode: formData.attendance_details.work_mode,
        days_on_site: formData.attendance_details.days_on_site
          ? parseInt(formData.attendance_details.days_on_site, 10)
          : 0,
        insurance_salary: formData.insurance_details.include_insurance_salary
          ? parseFloat(formData.insurance_details.insurance_salary)
          : 0,
        gross_insurance: formData.insurance_details.include_gross_insurance_salary
          ? parseFloat(formData.insurance_details.gross_insurance_salary)
          : 0
      };

      if (isCreateMode) {
        contractDetailsPayload = {
          ...contractDetailsPayload,
          start_contract: this.formatDateForAPI(formData.contract_details.start_contract),
          contract_type: formData.contract_details.contract_type,
          contract_end_date: formData.contract_details.contract_type === 1
            ? this.formatDateForAPI(formData.contract_details.contract_end_date) : '',
          salary: parseFloat(formData.contract_details.salary),
          notice_period: formData.contract_details.notice_period
            ? parseInt(formData.contract_details.notice_period, 10)
            : 0
        };
      }

    }
    else {
      contractDetailsPayload = {
        employment_type: formData.attendance_details.employment_type,
        work_mode: formData.attendance_details.work_mode,
        days_on_site: formData.attendance_details.days_on_site
          ? parseInt(formData.attendance_details.days_on_site, 10)
          : 0,
      };
      if (isCreateMode) {
        contractDetailsPayload.salary = 0;
      }
      // requestData.contract_details = {
      //   employment_type: formData.attendance_details.employment_type,
      //   work_mode: formData.attendance_details.work_mode,
      //   days_on_site: formData.attendance_details.days_on_site
      //     ? parseInt(formData.attendance_details.days_on_site, 10)
      //     : 0,
      //   salary: 0,
      // }
    }
    // }
    requestData.contract_details = contractDetailsPayload;
    if (!this.isEditMode()) {
      return { request_data: requestData };
    }

    const originalData = this.employeeData();
    if (!originalData) return null;

    return {
      request_data: {
        id: originalData.id,
        ...requestData
      }
    };
  }


  resetForm(): void {
    this.employeeForm.reset();
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

  // resetForm(): void {
  //   this.initializeForm();
  //   this.setupFormWatchers();
  //   this.initializeJobDetailsWatchers();

  //   this.mobileGroup.get('country_id')?.setValue(1);
  //   this.contractDetails?.get('contract_type')?.setValue(2);
  //   this.contractDetails?.get('include_probation')?.setValue(false);
  //   this.contractDetails?.get('notice_period')?.setValue(null);
  //   this.contractDetails?.get('insurance_salary')?.setValue('');
  //   this.insuranceDetails?.get('include_insurance_salary')?.setValue(false);
  //   this.insuranceDetails?.get('insurance_salary')?.setValue('');
  //   this.insuranceDetails?.get('include_gross_insurance_salary')?.setValue(false);
  //   this.insuranceDetails?.get('gross_insurance_salary')?.setValue('');

  //   this.currentStep.set(1);
  //   this.errMsg.set('');
  //   this.selectedJobTitle.set(null);
  //   this.currentSalaryRange.set(null);
  //   this.isEditMode.set(false);
  // }

  // Debug method to help identify validation issues
  debugFormState(): void {
  }
}
