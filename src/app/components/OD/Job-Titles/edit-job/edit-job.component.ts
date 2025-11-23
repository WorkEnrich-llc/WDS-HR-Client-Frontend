import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, map, of, Subject, catchError } from 'rxjs';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { forkJoin } from 'rxjs';
export const multipleMinMaxValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const errors: any = {};

  const pairs = [
    { min: 'fullTime_minimum', max: 'fullTime_maximum', label: 'fullTime' },
    { min: 'partTime_minimum', max: 'partTime_maximum', label: 'partTime' },
    { min: 'hourly_minimum', max: 'hourly_maximum', label: 'hourly' },
  ];

  let hasError = false;

  for (const pair of pairs) {
    const min = group.get(pair.min)?.value;
    const max = group.get(pair.max)?.value;

    if (min !== null && max !== null && min !== '' && max !== '' && +min > +max) {
      errors[pair.label] = true;
      hasError = true;
    }
  }

  return hasError ? errors : null;
};
@Component({
  selector: 'app-edit-job',
  imports: [PageHeaderComponent, CommonModule, SkelatonLoadingComponent, TableComponent, ReactiveFormsModule, FormsModule, PopupComponent],
  providers: [DatePipe],
  templateUrl: './edit-job.component.html',
  styleUrls: ['./../../../shared/table/table.component.css', './edit-job.component.css']
})
export class EditJobComponent {
  jobTitleData: any = { sections: [] };
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  jobId: string | null = '';
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  departments: any[] = [];
  sections: any[] = [];
  filterForm!: FormGroup;
  hasChanges: boolean = false;
  originalData: any;
  originalAssignedIds: number[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    private toasterMessageService: ToasterMessageService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private _DepartmentsService: DepartmentsService,
    private _JobsService: JobsService,
    private datePipe: DatePipe,
    private router: Router,
    private route: ActivatedRoute,
    private subService: SubscriptionService
  ) {

    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;

  }


  jobTitleSub: any;
  ngOnInit(): void {
    // subscription data
    this.subService.subscription$.subscribe(sub => {
      this.jobTitleSub = sub?.Branches;
      // if (this.jobTitleSub) {
      //   console.log("info:", this.jobTitleSub.info);
      //   console.log("create:", this.jobTitleSub.create);
      //   console.log("update:", this.jobTitleSub.update);
      //   console.log("delete:", this.jobTitleSub.delete);
      // }
    });

    this.jobId = this.route.snapshot.paramMap.get('id');
    if (this.jobId) {
      this.getJobTitle(Number(this.jobId));
    }

    this.getAllDepartment(this.currentPage);
    this.jobStep4 = new FormGroup({
      jobDescription: new FormControl('', [Validators.required, Validators.minLength(10)]),
      jobAnalysis: new FormControl('', [Validators.required, Validators.minLength(10)]),

    });
    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllJobTitles(this.currentPage, value);
    });

    this.watchFormChanges();
  }

  get numericJobId(): number | null {
    return this.jobId !== null ? +this.jobId : null;
  }

  jobStep1: FormGroup = new FormGroup({
    code: new FormControl('', Validators.maxLength(26)),
    jobName: new FormControl('', [Validators.required, Validators.maxLength(80)]),
    managementLevel: new FormControl('', [Validators.required]),
    jobLevel: new FormControl('', [Validators.required]),
    department: new FormControl({ value: '', disabled: true }),
    section: new FormControl({ value: '', disabled: true }),
  });


  toggleDepartment(enable: boolean) {
    this.isDepartmentSelected = enable;
    const control = this.jobStep1.get('department');
    enable ? control?.enable() : control?.disable();
  }

  loadData: boolean = false;
  departmentsLoading: boolean = false;
  sectionsLoading: boolean = false;
  getJobTitle(jobId: number) {
    this.loadData = true;

    this._JobsService.showJobTitle(jobId).subscribe({
      next: (jobRes) => {
        this.jobTitleData = jobRes.data.object_info;
        const jobDept = this.jobTitleData.department;
        const jobSection = this.jobTitleData.section;

        const dept$ = this.getAllDepartment(this.currentPage, '', {}, jobDept);
        let section$ = of([]);

        if (jobDept?.id && (this.jobTitleData.management_level === 4 || this.jobTitleData.management_level === 5)) {
          section$ = this.getsections(jobDept.id, jobSection);
        }
        this.originalAssignedIds = this.jobTitleData.assigns?.map((a: any) => a.id) || [];


        forkJoin([dept$, section$]).subscribe({
          next: ([departments, sections]) => {
            this.departments = departments;
            this.sections = sections;
            this.patchJobForm();
            this.loadData = false;
          },
          error: () => (this.loadData = false)
        });
      },
      error: () => (this.loadData = false)
    });
  }


  patchJobForm() {
    const created = this.jobTitleData?.created_at;
    const updated = this.jobTitleData?.updated_at;

    if (created) this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
    if (updated) this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;

    // --- Step 1 ---
    this.jobStep1.get('managementLevel')?.setValue(this.jobTitleData.management_level || '', { emitEvent: false });
    this.jobStep1.patchValue({
      code: this.jobTitleData.code || '',
      jobName: this.jobTitleData.name || '',
      jobLevel: this.jobTitleData.job_level !== null && this.jobTitleData.job_level !== undefined
        ? this.jobTitleData.job_level
        : '',
      department: this.jobTitleData.department?.id || '',
      section: this.jobTitleData.section?.id || ''
    });

    // --- Step 2 (Salary Ranges) ---
    const salary = this.jobTitleData.salary_ranges;
    if (salary) {
      this.jobStep2.patchValue({
        fullTime_minimum: salary.full_time?.minimum || '',
        fullTime_maximum: salary.full_time?.maximum || '',
        fullTime_currency: salary.full_time?.currency || 'EGP',
        fullTime_status: salary.full_time?.status ?? true,
        fullTime_restrict: salary.full_time?.restrict ?? false,

        partTime_minimum: salary.part_time?.minimum || '',
        partTime_maximum: salary.part_time?.maximum || '',
        partTime_currency: salary.part_time?.currency || 'EGP',
        partTime_status: salary.part_time?.status ?? true,
        partTime_restrict: salary.part_time?.restrict ?? false,

        hourly_minimum: salary.per_hour?.minimum || '',
        hourly_maximum: salary.per_hour?.maximum || '',
        hourly_currency: salary.per_hour?.currency || 'EGP',
        hourly_status: salary.per_hour?.status ?? true,
        hourly_restrict: salary.per_hour?.restrict ?? false,
      });
    }

    // --- Step 4 ---
    this.requirements = this.jobTitleData.requirements || [];
    this.jobStep4.patchValue({
      jobDescription: this.jobTitleData.description || '',
      jobAnalysis: this.jobTitleData.analysis || ''
    });

    this.setFieldsBasedOnLevel(this.jobTitleData.management_level);

    this.originalData = {
      jobStep1: this.jobStep1.getRawValue(),
      jobStep2: this.jobStep2.getRawValue(),
      jobStep4: this.jobStep4.getRawValue(),
      requirements: [...this.requirements],
      removedManagerId: this.removedManagerId,
      assignedId: this.currentManager?.id || null
    };

    const currentLevel = this.jobStep1.get('managementLevel')?.value;
    if (currentLevel) {
      this.getAllJobTitles(this.ManageCurrentPage, this.searchTerm);
    }
  }




  setFieldsBasedOnLevel(level: number) {
    const jobLevelControl = this.jobStep1.get('jobLevel');
    const departmentControl = this.jobStep1.get('department');
    const sectionControl = this.jobStep1.get('section');

    jobLevelControl?.clearValidators();
    departmentControl?.clearValidators();
    sectionControl?.clearValidators();

    departmentControl?.disable();
    sectionControl?.disable();

    this.isDepartmentSelected = false;
    this.isSectionSelected = false;

    // Always show Job Level field
    this.showJobLevel = true;
    jobLevelControl?.enable();
    jobLevelControl?.setValidators([Validators.required]);

    if (level === 3) {
      departmentControl?.enable();
      departmentControl?.setValidators([Validators.required]);
      this.isDepartmentSelected = true;
    } else if (level === 4 || level === 5) {
      departmentControl?.enable();
      sectionControl?.enable();
      departmentControl?.setValidators([Validators.required]);
      sectionControl?.setValidators([Validators.required]);
      this.isDepartmentSelected = true;
      this.isSectionSelected = true;
    }

    jobLevelControl?.updateValueAndValidity();
    departmentControl?.updateValueAndValidity();
    sectionControl?.updateValueAndValidity();
  }
  // check changes
  checkForChanges() {
    if (!this.originalData) return;

    const assignedId = this.jobTitles.find(j => j.assigned)?.id || null;

    this.hasChanges =
      JSON.stringify(this.jobStep1.getRawValue()) !== JSON.stringify(this.originalData.jobStep1) ||
      JSON.stringify(this.jobStep2.getRawValue()) !== JSON.stringify(this.originalData.jobStep2) ||
      JSON.stringify(this.jobStep4.getRawValue()) !== JSON.stringify(this.originalData.jobStep4) ||
      JSON.stringify(this.requirements) !== JSON.stringify(this.originalData.requirements) ||
      this.removedManagerId !== this.originalData.removedManagerId ||
      assignedId !== this.originalData.assignedId;
  }


  watchFormChanges() {
    this.jobStep1.valueChanges.subscribe(() => this.checkForChanges());
    this.jobStep2.valueChanges.subscribe(() => this.checkForChanges());
    this.jobStep4.valueChanges.subscribe(() => this.checkForChanges());
  }


  // selectedLevel step 1
  selectedLevel: string = '';
  isDepartmentSelected: boolean = false;
  isSectionSelected: boolean = false;
  showJobLevel: boolean = true;

  onLevelChange() {
    const level = Number(this.jobStep1.get('managementLevel')?.value);

    const jobLevelControl = this.jobStep1.get('jobLevel');
    const departmentControl = this.jobStep1.get('department');
    const sectionControl = this.jobStep1.get('section');

    // --- reset dependent controls
    departmentControl?.reset('');
    sectionControl?.reset('');
    this.sections = [];
    this.sectionsLoading = false;

    jobLevelControl?.clearValidators();
    departmentControl?.clearValidators();
    sectionControl?.clearValidators();
    departmentControl?.disable();
    sectionControl?.disable();
    this.isDepartmentSelected = false;
    this.isSectionSelected = false;

    jobLevelControl?.enable();
    jobLevelControl?.setValidators([Validators.required]);

    if (level === 3) {
      departmentControl?.enable();
      departmentControl?.setValidators([Validators.required]);
      this.isDepartmentSelected = true;
    } else if (level === 4 || level === 5) {
      departmentControl?.enable();
      sectionControl?.enable();
      departmentControl?.setValidators([Validators.required]);
      sectionControl?.setValidators([Validators.required]);
      this.isDepartmentSelected = true;
      this.isSectionSelected = true;
    }

    jobLevelControl?.updateValueAndValidity();
    departmentControl?.updateValueAndValidity();
    sectionControl?.updateValueAndValidity();

    this.jobTitles = this.jobTitles.map(job => ({ ...job, assigned: false, assigns: [] }));
    this.jobTitleData.assigns = [];
    this.removedManagerId = null;
    this.removedManager = null;
    this.newManagerSelected = false;
    this.managerRemoved = false;

    this.getAllJobTitles(this.ManageCurrentPage, this.searchTerm);
  }

  get filteredJobTitles() {
    const currentId = this.numericJobId;
    if (!this.jobTitles?.length) return [];

    return this.jobTitles.map(job => {
      const isAssigned = job.assigned || this.jobTitleData?.assigns?.some((a: any) => a.id === job.id);

      return {
        ...job,
        assigned: isAssigned,
        isCurrent: job.id === currentId
      };
    });
  }






  //get department and sections
  currentPage: number = 1;
  totalItems: number = 0;
  itemsPerPage: number = 10000;
  allDepartments: any[] = [];

  getAllDepartment(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      status?: string;
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
    },
    jobDept?: { id: number; name: string }
  ) {
    this.departmentsLoading = true;
    return this._DepartmentsService.getAllDepartment(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).pipe(
      map((response: any) => {
        const activeDepartments = response.data.list_items.filter((d: any) => d.is_active);

        const departments = activeDepartments.map((item: any) => ({
          id: item.id,
          name: item.name,
          isActive: true
        }));

        if (jobDept && !departments.some((d: { id: number; }) => d.id === jobDept.id)) {
          departments.unshift({
            id: jobDept.id,
            name: `${jobDept.name} (Not active)`,
            isActive: false
          });
        }

        this.allDepartments = departments;
        this.departmentsLoading = false;
        return departments;
      }),
      catchError((error) => {
        this.departmentsLoading = false;
        return of([]);
      })
    );
  }



  getsections(deptid: number, jobSection?: { id: number; name: string }) {
    if (!deptid) {
      this.sectionsLoading = false;
      return of([]);
    }
    this.sectionsLoading = true;
    return this._DepartmentsService.showDepartment(deptid).pipe(
      map((response: any) => {
        const rawSections = response.data.object_info.sections;
        const activeSections = rawSections.filter((s: any) => s.is_active);

        const sections = activeSections.map((s: any) => ({
          id: s.id,
          name: s.name,
        }));

        if (jobSection && !sections.some((s: { id: number; }) => s.id === jobSection.id)) {
          sections.unshift({
            id: jobSection.id,
            name: `${jobSection.name} (Not active)`,
          });
        }

        this.sectionsLoading = false;
        return sections;
      }),
      catchError((error) => {
        this.sectionsLoading = false;
        return of([]);
      })
    );
  }

  onDepartmentChange(deptId: number) {
    if (!deptId) {
      this.sections = [];
      this.sectionsLoading = false;
      this.jobStep1.get('section')?.reset('');
      return;
    }

    this.getsections(deptId).subscribe({
      next: (sections) => {
        this.sections = sections.filter((s: { name: string | string[]; }) => !s.name.includes('(Not active)'));
        this.jobStep1.get('section')?.reset('');
      },
      error: (err) => {
        console.error('Error loading sections:', err);
        this.sections = [];
        this.sectionsLoading = false;
      }
    });
  }




  ManageCurrentPage: number = 1;
  ManagetotalPages: number = 0;
  ManageTotalItems: number = 0;
  manageItemsPerPage: number = 5;
  searchTerm: string = '';
  searchTimeout: any;
  searchNotFound: boolean = false;
  jobTitles: any[] = [];
  noResultsFound: boolean = false;
  loadJobs: boolean = false;
  selectJobError: boolean = false;
  // getAllJobTitles(ManageCurrentPage: number, searchTerm: string = '') {
  //   this.loadJobs = true;
  //   const managementLevel = this.jobStep1.get('managementLevel')?.value;
  //   this._JobsService.getAllJobTitles(ManageCurrentPage, this.manageItemsPerPage, {
  //     management_level: managementLevel,
  //     search: this.searchTerm,
  //     request_in: 'create'
  //   }).subscribe({
  //     next: (response) => {
  //       this.ManageCurrentPage = Number(response.data.page);
  //       this.ManageTotalItems = response.data.total_items;
  //       this.ManagetotalPages = response.data.total_pages;

  //       this.jobTitles = response.data.list_items.map((item: any) => {
  //         const isAssigned = this.jobTitleData?.assigns?.some((assigned: any) => assigned.id === item.id);
  //         return {
  //           id: item.id,
  //           name: item.name,
  //           assigned: isAssigned || false
  //         };
  //       });
  //       this.sortDirection = 'desc';
  //       this.currentSortColumn = 'id';
  //       this.sortBy();
  //       this.loadJobs = false;
  //     },
  //     error: (err) => {
  //       console.error(err.error?.details);
  //       this.loadJobs = false;
  //     }
  //   });
  // }


  allActiveJobTitles: any[] = [];
  getAllJobTitles(ManageCurrentPage: number, searchTerm: string = '') {
    this.loadJobs = true;
    this.loadData= true;
    const managementLevel = this.jobStep1.get('managementLevel')?.value;

    this._JobsService.getAllJobTitles(
      ManageCurrentPage,
      this.manageItemsPerPage,
      {
        management_level: managementLevel,
        search: this.searchTerm,
        request_in: 'create',
        status: 'true'
      }
    ).subscribe({
      next: (response) => {

        const activeList = response.data.list_items.map((item: any) => {
          const isAssigned = this.jobTitleData?.assigns?.some((assigned: any) => assigned.id === item.id);
          return {
            id: item.id,
            name: item.name,
            assigned: isAssigned || false,
            is_active: item.is_active
          };
        });

        const originalAssigned = this.jobTitleData?.assigns?.[0];
        if (originalAssigned && originalAssigned.is_active === false) {
          this.removedManager = {
            id: originalAssigned.id,
            name: originalAssigned.name + ' (Not Active)',
            assigned: true,
            is_active: false
          };
        } else {
          this.removedManager = null;
        }

        this.ManageCurrentPage = Number(response.data.page);
        this.ManageTotalItems = response.data.total_items;
        this.ManagetotalPages = Math.ceil(this.ManageTotalItems / this.manageItemsPerPage);

        this.jobTitles = activeList;

        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();


        this.allActiveJobTitles = activeList;
        this.checkOriginalManagerStatus();

        this.loadJobs = false;
        this.loadData= false;
      },
      error: () => {
        this.loadJobs = false;
        this.loadData=false;
      }
    });
  }



  checkOriginalManagerStatus() {
    const managementLevel = this.jobStep1.get('managementLevel')?.value;

    const itemsPerPageForCheck = 10000;

    this._JobsService.getAllJobTitles(
      1,
      itemsPerPageForCheck,
      {
        management_level: managementLevel,
        status: 'true',
        request_in: 'create'
      }
    ).subscribe({
      next: (response: any) => {
        const allActiveJobTitles = response.data.list_items;
        const originalAssigned = this.jobTitleData?.assigns?.[0];

        if (originalAssigned) {
          const existsInActive = allActiveJobTitles.some((j: { id: any; }) => j.id === originalAssigned.id);
          if (!existsInActive) {
            this.removedManager = {
              ...originalAssigned,
              is_active: false,
              name: originalAssigned.name + ' (Not Active)'
            };
          } else {
            this.removedManager = null;
          }
        }
      },
      error: (err) => {
        console.error('Error checking original manager status', err);
      }
    });
  }



  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }
  onPageChange(newPage: number): void {
    this.ManageCurrentPage = newPage;
    this.getAllJobTitles(this.ManageCurrentPage, this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number): void {
    this.manageItemsPerPage = newItemsPerPage;
    this.ManageCurrentPage = 1;
    this.getAllJobTitles(this.ManageCurrentPage, this.searchTerm);
  }

  // nextGetJobs(): void {
  //   this.goNext();
  //   this.getAllJobTitles(this.ManageCurrentPage, this.searchTerm);
  // }
  // step 2 salary ranges
  jobStep2: FormGroup = new FormGroup({
    fullTime_minimum: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    fullTime_maximum: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    fullTime_currency: new FormControl('EGP', [Validators.required]),
    fullTime_status: new FormControl(true, [Validators.required]),
    fullTime_restrict: new FormControl(false),

    partTime_minimum: new FormControl('', [Validators.pattern(/^\d+$/)]),
    partTime_maximum: new FormControl('', [Validators.pattern(/^\d+$/)]),
    partTime_currency: new FormControl('EGP', [Validators.required]),
    partTime_status: new FormControl(true, [Validators.required]),
    partTime_restrict: new FormControl(false),

    hourly_minimum: new FormControl('', [Validators.pattern(/^\d+$/)]),
    hourly_maximum: new FormControl('', [Validators.pattern(/^\d+$/)]),
    hourly_currency: new FormControl('EGP', [Validators.required]),
    hourly_status: new FormControl(true, [Validators.required]),
    hourly_restrict: new FormControl(false),
  }, { validators: multipleMinMaxValidator });



  currentStep = 1;
  selectAll: boolean = false;

  goNext() {
    if (this.currentStep === 3) {

      if (this.filteredJobTitles.length === 1 && this.filteredJobTitles[0].id === this.numericJobId) {
        this.selectJobError = false;

        this.finalAssignedManager = this.currentManager;

        this.currentStep++;
        return;
      }

      if (this.jobTitles.length > 0 && !this.jobTitles.some(job => job.assigned)) {
        this.selectJobError = true;
        return;
      }
    }

    this.selectJobError = false;

    const selected = this.jobTitles.find(j => j.assigned);
    if (selected) {
      this.finalAssignedManager = selected;
    }

    this.currentStep++;
  }


  goPrev() {
    this.currentStep--;
  }

  goToStep(step: number) {
    // Allow navigation to previous steps without validation
    if (step <= this.currentStep) {
      this.currentStep = step;
      this.selectJobError = false;
      return;
    }

    // For forward navigation, validate all intermediate steps
    for (let i = this.currentStep; i < step; i++) {
      if (!this.isStepValid(i + 1)) {
        // If validation fails, navigate to the first invalid step
        this.currentStep = i + 1;
        if (i + 1 === 3) {
          if (this.jobTitles.length > 0 && !this.jobTitles.some(job => job.assigned)) {
            this.selectJobError = true;
          }
          // Call API when navigating to step 3
          this.getAllJobTitles(this.ManageCurrentPage, this.searchTerm);
        }
        return;
      }
    }

    // All validations passed, navigate to the target step
    this.currentStep = step;
    this.selectJobError = false;

    // Call APIs when navigating to step 3 (Direct Manager)
    if (step === 3) {
      this.getAllJobTitles(this.ManageCurrentPage, this.searchTerm);
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.jobStep1.valid;
      case 2:
        return this.jobStep1.valid && this.jobStep2.valid;
      case 3:
        // Step 3 validation: if there are job titles, at least one must be assigned
        if (this.jobTitles.length > 0) {
          return this.jobTitles.some(job => job.assigned);
        }
        return true; // No job titles means no validation needed
      case 4:
        return this.jobStep1.valid && this.jobStep2.valid &&
          this.jobStep4.valid && this.requirements.length > 0 &&
          (this.jobTitles.length === 0 || this.jobTitles.some(job => job.assigned));
      default:
        return true;
    }
  }



  // toggle activate
  // isActive = true;

  toggleStatus(itemKey: string) {
    const currentValue = this.jobStep2.get(itemKey)?.value;
    this.jobStep2.get(itemKey)?.setValue(!currentValue);
  }


  sortDirection: string = 'asc';
  currentSortColumn: string = '';

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.jobTitles = this.jobTitles.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }
  // assign job tittle toggle
  removedManagerId: number | null = null;
  removedManager: any = null;
  managerRemoved: boolean = false;
  newManagerSelected: boolean = false;
  previousAssignedId: number | null = null;


  selectedManagerExists(): boolean {
    return (
      this.removedManagerId !== null ||
      (this.jobTitleData.assigns && this.jobTitleData.assigns.length > 0)
    );
  }


  removeCurrentManager() {
    const current = this.jobTitles.find(job => job.assigned);
    if (current) {
      this.removedManagerId = current.id;
      this.removedManager = { ...current };
      current.assigned = false;
      current.assigns = [];
      this.managerRemoved = true;
      this.checkForChanges();
    }
  }

  toggleAssignStatus(selectedJob: any) {
    this.jobTitles = this.jobTitles.map(job => {
      if (job.id === selectedJob.id) {
        return { ...job, assigned: true, assigns: [selectedJob] };
      } else {
        return { ...job, assigned: false, assigns: [] };
      }
    });

    this.removedManagerId = null;
    this.removedManager = null;
    this.newManagerSelected = true;
    this.managerRemoved = false;

    this.checkForChanges();
  }



  finalAssignedManager: any = null;

  get currentManager() {
    if (this.finalAssignedManager) {
      return this.finalAssignedManager;
    }

    if (this.newManagerSelected) {
      return this.jobTitleData?.assigns?.[0] || null;
    }

    if (this.removedManager) {
      return this.removedManager;
    }

    if (this.jobTitleData?.assigns?.length > 0) {
      const original = this.jobTitleData.assigns[0];
      const exists = this.allActiveJobTitles?.some(j => j.id === original.id);

      if (!exists) {
        return {
          ...original,
          is_active: false,
          name: original.name + ' (Not Active)'
        };
      }

      return original;
    }

    return null;
  }



  hasAssignedManager(): boolean {
    const hadOriginalManager = this.originalAssignedIds?.length > 0;

    if (!hadOriginalManager) {
      return true;
    }

    if (this.filteredJobTitles.length === 1 && this.filteredJobTitles[0].id === this.numericJobId) {
      return true;
    }

    return !!this.currentManager;
  }




  // input multibule data step 4
  jobStep4: FormGroup = new FormGroup({});

  requirements: string[] = [];
  showInput: boolean = false;
  newRequirement: string = '';
  formSubmitted = false;
  inputTouched: boolean = false;

  editingIndex: number | null = null;


  isFormInvalid(): boolean {
    return this.jobStep4.invalid || this.requirements.length === 0;
  }

  showInputField() {
    this.showInput = true;
    this.newRequirement = '';
    this.editingIndex = null;
  }
  onInputBlur() {
    this.inputTouched = true;
    this.confirmRequirement();
  }
  // confirmRequirement() {
  //   if (this.newRequirement.trim()) {
  //     this.requirements.push(this.newRequirement.trim());
  //     this.checkForChanges();
  //   }
  //   this.newRequirement = '';
  //   this.showInput = false;
  // }

  confirmRequirement() {
    if (this.newRequirement.trim()) {
      if (this.editingIndex !== null) {
        this.requirements[this.editingIndex] = this.newRequirement.trim();
        this.editingIndex = null;
      } else {
        this.requirements.push(this.newRequirement.trim());
      }
      this.checkForChanges();
    }
    this.newRequirement = '';
    this.showInput = false;
    this.editingIndex = null;
  }

  deleteRequirement(index: number) {
    this.requirements.splice(index, 1);
    this.checkForChanges();
  }

  editRequirement(index: number) {
    this.editingIndex = index;
    this.newRequirement = this.requirements[index];
    this.showInput = true;
  }

  // discard popup
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/jobs/all-job-titles']);
  }
  // create job title
  department: any;
  updateJobTitle() {
    if (this.currentStep === 3 && this.jobTitles.length > 0 && !this.jobTitles.some(job => job.assigned)) {
      this.selectJobError = true;
      return;
    }

    this.selectJobError = false;
    this.isLoading = true;
    const managementLevel = Number(this.jobStep1.get('managementLevel')?.value);


    const requestData: any = {
      request_data: {
        id: Number(this.jobId),
        code: this.jobStep1.get('code')?.value || '',
        name: this.jobStep1.get('jobName')?.value || '',
        management_level: managementLevel,
        job_level: Number(this.jobStep1.get('jobLevel')?.value) || null,
        salary_ranges: {
          full_time: {
            minimum: this.jobStep2.get('fullTime_minimum')?.value,
            maximum: this.jobStep2.get('fullTime_maximum')?.value,
            currency: this.jobStep2.get('fullTime_currency')?.value,
            status: this.jobStep2.get('fullTime_status')?.value ? true : false,
            restrict: this.jobStep2.get('fullTime_restrict')?.value
          },
          part_time: {
            minimum: this.jobStep2.get('partTime_minimum')?.value,
            maximum: this.jobStep2.get('partTime_maximum')?.value,
            currency: this.jobStep2.get('partTime_currency')?.value,
            status: this.jobStep2.get('partTime_status')?.value ? true : false,
            restrict: this.jobStep2.get('partTime_restrict')?.value
          },
          per_hour: {
            minimum: this.jobStep2.get('hourly_minimum')?.value,
            maximum: this.jobStep2.get('hourly_maximum')?.value,
            currency: this.jobStep2.get('hourly_currency')?.value,
            status: this.jobStep2.get('hourly_status')?.value ? true : false,
            restrict: this.jobStep2.get('hourly_restrict')?.value
          }
        },
        description: this.jobStep4.get('jobDescription')?.value || '',
        analysis: this.jobStep4.get('jobAnalysis')?.value || '',
        requirements: this.requirements
      }
    };

    const departmentId = Number(this.jobStep1.get('department')?.value);
    const sectionId = Number(this.jobStep1.get('section')?.value);

    if (managementLevel === 3 && departmentId) {
      requestData.request_data.department = {
        id: departmentId
      };
    } else if ((managementLevel === 4 || managementLevel === 5) && departmentId && sectionId) {
      requestData.request_data.department = {
        id: departmentId,
        section_id: sectionId
      };
    }

    const assignedJob = this.jobTitles.find(j => j.assigned);
    const setArray: number[] = [];
    const removeArray: number[] = [];

    if (assignedJob) {
      setArray.push(assignedJob.id);
    }

    if (this.originalAssignedIds?.length) {
      const toRemove = this.originalAssignedIds.filter((id: number) => !setArray.includes(id));
      removeArray.push(...toRemove);
    }

    requestData.request_data.assigns = {
      set: setArray,
      remove: removeArray
    };

    this._JobsService.updateJobTitle(requestData).subscribe({

      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/jobs/all-job-titles']);
        this.toasterMessageService.sendMessage("Job Title Updated successfully");

      },
      error: (err) => {
        this.isLoading = false;
        const statusCode = err?.status;
        const errorHandling = err?.error?.data?.error_handling;
        const details = err?.error?.details;

        if (statusCode === 400) {
          if (Array.isArray(errorHandling) && errorHandling.length > 0) {
            this.currentStep = errorHandling[0].tap;
            this.errMsg = errorHandling
              .map((e) => e.error)
              .join('\n');
          } else if (details) {
            this.errMsg = details;
          } else {
            this.errMsg = "An unexpected error occurred. Please try again later.";
          }
        } else {
          this.errMsg = "An unexpected error occurred. Please try again later.";
        }
      }

    });

  }









}
