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
import { debounceTime, Subject } from 'rxjs';
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
  imports: [PageHeaderComponent, CommonModule, TableComponent, ReactiveFormsModule, FormsModule, PopupComponent],
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
  originalAssignedId: number | null = null;
  private searchSubject = new Subject<string>();

  constructor(
    private toasterMessageService: ToasterMessageService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private _DepartmentsService: DepartmentsService,
    private _JobsService: JobsService,
    private datePipe: DatePipe,
    private router: Router,
    private route: ActivatedRoute) {

    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;

  }

  ngOnInit(): void {
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
    code: new FormControl(''),
    jobName: new FormControl('', [Validators.required]),
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

  getJobTitle(jobId: number) {
    this._JobsService.showJobTitle(jobId).subscribe({
      next: (response) => {
        this.jobTitleData = response.data.object_info;
        const created = this.jobTitleData?.created_at;
        const updated = this.jobTitleData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }
        // console.log(this.jobTitleData);
        if (
          this.jobTitleData.department?.id &&
          (this.jobTitleData.management_level === 4 || this.jobTitleData.management_level === 5)
        ) {
          this.getsections(this.jobTitleData.department.id);
        }
        const originalAssigned = this.jobTitleData?.assigns?.[0];
        if (originalAssigned?.id) {
          this.originalAssignedId = originalAssigned.id;
        } else {
          this.originalAssignedId = null;
        }

        this.jobStep1.patchValue({
          code: this.jobTitleData.code || '',
          jobName: this.jobTitleData.name || '',
          managementLevel: this.jobTitleData.management_level || '',
          jobLevel: this.jobTitleData.job_level || '',
          department: this.jobTitleData.department?.id || '',
          section: this.jobTitleData.section?.id || ''
        });
        this.setFieldsBasedOnLevel(this.jobTitleData.management_level);
        const salary = this.jobTitleData.salary_ranges;

        this.jobStep2.patchValue({
          fullTime_minimum: salary.full_time?.minimum || '',
          fullTime_maximum: salary.full_time?.maximum || '',
          fullTime_currency: salary.full_time?.currency,
          fullTime_status: salary.full_time?.status,
          fullTime_restrict: salary.full_time?.restrict || false,

          partTime_minimum: salary.part_time?.minimum || '',
          partTime_maximum: salary.part_time?.maximum || '',
          partTime_currency: salary.part_time?.currency,
          partTime_status: salary.part_time?.status,
          partTime_restrict: salary.part_time?.restrict || false,

          hourly_minimum: salary.per_hour?.minimum || '',
          hourly_maximum: salary.per_hour?.maximum || '',
          hourly_currency: salary.per_hour?.currency,
          hourly_status: salary.per_hour?.status,
          hourly_restrict: salary.per_hour?.restrict || false,
        });
        this.jobStep4.patchValue({
          jobDescription: this.jobTitleData.description || '',
          jobAnalysis: this.jobTitleData.analysis || ''
        });
        this.requirements = this.jobTitleData.requirements || [];
        this.originalData = {
          jobStep1: this.jobStep1.getRawValue(),
          jobStep2: this.jobStep2.getRawValue(),
          jobStep4: this.jobStep4.getRawValue(),
          requirements: [...this.requirements],
          assignedId: this.jobTitles.find(j => j.assigned)?.id || null,
          removedManagerId: this.removedManagerId
        };
        this.sortDirection = 'desc';
        this.sortBy();
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
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
    if (!this.originalData) {
      return;
    }

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
    const level = this.jobStep1.get('managementLevel')?.value;

    const jobLevelControl = this.jobStep1.get('jobLevel');
    const departmentControl = this.jobStep1.get('department');
    const sectionControl = this.jobStep1.get('section');

    // Reset validation and disable jobLevel, department, section
    jobLevelControl?.clearValidators();
    departmentControl?.clearValidators();
    sectionControl?.clearValidators();

    // Disable department and section by default
    departmentControl?.disable();
    sectionControl?.disable();

    this.isDepartmentSelected = false;
    this.isSectionSelected = false;

    // Always show Job Level field
    this.showJobLevel = true;
    jobLevelControl?.enable();
    jobLevelControl?.setValidators([Validators.required]);

    if (level === '3') {
      // Enable department only
      departmentControl?.enable();
      departmentControl?.setValidators([Validators.required]);
      this.isDepartmentSelected = true;
    } else if (level === '4' || level === '5') {
      // Enable both
      departmentControl?.enable();
      sectionControl?.enable();
      departmentControl?.setValidators([Validators.required]);
      sectionControl?.setValidators([Validators.required]);
      this.isDepartmentSelected = true;
      this.isSectionSelected = true;
    }

    // Update validity for all affected controls
    jobLevelControl?.updateValueAndValidity();
    departmentControl?.updateValueAndValidity();
    sectionControl?.updateValueAndValidity();
  }



  //get department and sections
  currentPage: number = 1;
  totalItems: number = 0;
  itemsPerPage: number = 10000;

  getAllDepartment(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      status?: string;
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
    }
  ) {
    this._DepartmentsService.getAllDepartment(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        // this.totalpages = response.data.total_pages;
        this.departments = response.data.list_items.map((item: any) => ({
          id: item.id,
          name: item.name,
        }));
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }


  getsections(deptid: number) {
    this._DepartmentsService.showDepartment(deptid).subscribe({
      next: (response) => {
        const rawSections = response.data.object_info.sections;
        this.sections = rawSections.map((section: any) => ({
          id: section.id,
          name: section.name
        }));
        // console.log(this.sections);
      },
      error: (err) => {
        console.log(err.error?.details);
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
  getAllJobTitles(ManageCurrentPage: number, searchTerm: string = '') {

    const managementLevel = this.jobStep1.get('managementLevel')?.value;
    this._JobsService.getAllJobTitles(ManageCurrentPage, this.manageItemsPerPage, {
      management_level: managementLevel,
      search: this.searchTerm,
      request_in: 'create'
    }).subscribe({
      next: (response) => {
        this.ManageCurrentPage = Number(response.data.page);
        this.ManageTotalItems = response.data.total_items;
        this.ManagetotalPages = response.data.total_pages;

        this.jobTitles = response.data.list_items.map((item: any) => {
          const isAssigned = this.jobTitleData?.assigns?.some((assigned: any) => assigned.id === item.id);
          return {
            id: item.id,
            name: item.name,
            assigned: isAssigned || false
          };
        });
        // console.log(this.jobTitles);

        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
  }
  get filteredJobTitles() {
    if (this.numericJobId === null) {
      return this.jobTitles;
    }
    return this.jobTitles.filter(job => job.id !== this.numericJobId);
  }
  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }
  nextGetJobs(): void {
    this.goNext();
    this.getAllJobTitles(this.ManageCurrentPage, this.searchTerm);
  }
  // step 2 salary ranges
  jobStep2: FormGroup = new FormGroup({
    fullTime_minimum: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    fullTime_maximum: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    fullTime_currency: new FormControl('EGP', [Validators.required]),
    fullTime_status: new FormControl(true, [Validators.required]),

    partTime_minimum: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    partTime_maximum: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    partTime_currency: new FormControl('EGP', [Validators.required]),
    partTime_status: new FormControl(true, [Validators.required]),

    hourly_minimum: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    hourly_maximum: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    hourly_currency: new FormControl('EGP', [Validators.required]),
    hourly_status: new FormControl(true, [Validators.required]),
  }, { validators: multipleMinMaxValidator });



  currentStep = 1;
  selectAll: boolean = false;

  goNext() {
    this.currentStep++;

  }

  goPrev() {
    this.currentStep--;
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
    const currentAssigned = this.jobTitles.find(job => job.assigned);

    if (!selectedJob.assigned) {
      this.jobTitles.forEach(job => {
        job.assigned = false;
        job.assigns = [];
      });

      selectedJob.assigned = true;
      selectedJob.assigns = [selectedJob];

      this.previousAssignedId = currentAssigned ? currentAssigned.id : null;

      this.removedManagerId = this.previousAssignedId;
      this.removedManager = currentAssigned ? { ...currentAssigned } : null;

      this.newManagerSelected = true;
      this.managerRemoved = true;
    }

    this.checkForChanges();
  }



  // input multibule data step 4
  jobStep4: FormGroup = new FormGroup({});

  requirements: string[] = [];
  showInput: boolean = false;
  newRequirement: string = '';
  formSubmitted = false;
  inputTouched: boolean = false;
  isFormInvalid(): boolean {
    return this.jobStep4.invalid || this.requirements.length === 0;
  }

  showInputField() {
    this.showInput = true;
    this.newRequirement = '';
  }
  onInputBlur() {
    this.inputTouched = true;
    this.confirmRequirement();
  }
  confirmRequirement() {
    // console.log('New requirement:', this.newRequirement);
    if (this.newRequirement.trim()) {
      this.requirements.push(this.newRequirement.trim());
      this.checkForChanges();
    }
    this.newRequirement = '';
    this.showInput = false;
  }

  deleteRequirement(index: number) {
    this.requirements.splice(index, 1);
    this.checkForChanges();
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

    const hasOld = this.originalAssignedId !== null;
    const hasNew = !!assignedJob;

    if (hasOld && hasNew) {
      if (assignedJob.id !== this.originalAssignedId!) {
        removeArray.push(this.originalAssignedId!);
        setArray.push(assignedJob.id);
      }
    } else if (hasOld && !hasNew) {
      removeArray.push(this.originalAssignedId!);
    } else if (!hasOld && hasNew) {
      setArray.push(assignedJob.id);
    }

    requestData.request_data.assigns = {
      set: setArray,
      remove: removeArray
    };
    // console.log('row', requestData);

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
