import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, Subject } from 'rxjs';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { TableComponent } from '../../../shared/table/table.component';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';

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
  selector: 'app-create-new-job-title',
  imports: [PageHeaderComponent, CommonModule, TableComponent, FormsModule, PopupComponent, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './create-new-job-title.component.html',
  styleUrls: ['./../../../shared/table/table.component.css', './create-new-job-title.component.css']
})
export class CreateNewJobTitleComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  loadData: boolean = false; // used for table skeleton/loading state
  departments: any[] = [];
  sections: any[] = [];
  departmentsLoading: boolean = false;
  sectionsLoading: boolean = false;
  filterForm!: FormGroup;
  private searchSubject = new Subject<string>();

  constructor(private toasterMessageService: ToasterMessageService, private fb: FormBuilder, private toastr: ToastrService,
    private _DepartmentsService: DepartmentsService, private subService: SubscriptionService, private _JobsService: JobsService, private datePipe: DatePipe, private router: Router) {

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

    this.getAllDepartment(this.currentPage);
    this.jobStep4 = new FormGroup({
      jobDescription: new FormControl('', [Validators.required, Validators.minLength(10)]),
      jobAnalysis: new FormControl('', [Validators.required, Validators.minLength(10)]),

    });
    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.ManageCurrentPage = 1; // Reset to page 1 when searching
      this.getAllJobTitles(1, value);
    });


    // see changes in salary range inputs to update status
    this.jobStep2.get('partTime_minimum')?.valueChanges.subscribe(value => {
      this.updateStatusBasedOnInput('partTime_minimum', 'partTime_maximum', 'partTime_status');
    });
    this.jobStep2.get('partTime_maximum')?.valueChanges.subscribe(value => {
      this.updateStatusBasedOnInput('partTime_minimum', 'partTime_maximum', 'partTime_status');
    });

    this.jobStep2.get('hourly_minimum')?.valueChanges.subscribe(value => {
      this.updateStatusBasedOnInput('hourly_minimum', 'hourly_maximum', 'hourly_status');
    });
    this.jobStep2.get('hourly_maximum')?.valueChanges.subscribe(value => {
      this.updateStatusBasedOnInput('hourly_minimum', 'hourly_maximum', 'hourly_status');
    });
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

    this.showJobLevel = true;
    jobLevelControl?.enable();
    jobLevelControl?.setValidators([Validators.required]);

    if (level === '3') {
      departmentControl?.enable();
      departmentControl?.setValidators([Validators.required]);
      this.isDepartmentSelected = true;
    } else if (level === '4' || level === '5') {

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
    this.departmentsLoading = true;
    this._DepartmentsService.getAllDepartment(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;

        const activeDepartments = response.data.list_items.filter(
          (item: any) => item.is_active === true
        );

        this.departments = activeDepartments.map((item: any) => ({
          id: item.id,
          name: item.name,
        }));

        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
        this.departmentsLoading = false;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.departmentsLoading = false;
      }
    });
  }

  getsections(deptid: number) {
    if (!deptid) {
      this.sections = [];
      this.sectionsLoading = false;
      return;
    }
    this.sectionsLoading = true;
    this._DepartmentsService.showDepartment(deptid).subscribe({
      next: (response) => {
        const rawSections = response.data.object_info.sections;

        const activeSections = rawSections.filter(
          (section: any) => section.is_active === true
        );

        this.sections = activeSections.map((section: any) => ({
          id: section.id,
          name: section.name
        }));

        this.sectionsLoading = false;
        // console.log(activeSections);
      },
      error: (err) => {
        console.log(err.error?.details);
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

  getAllJobTitles(ManageCurrentPage: number, searchTerm: string = '') {
    this.loadJobs = true;
    const managementLevel = this.jobStep1.get('managementLevel')?.value;
    this.loadData = true;
    this._JobsService.getAllJobTitles(ManageCurrentPage, this.manageItemsPerPage, {
      management_level: managementLevel,
      search: this.searchTerm,
      request_in: 'create'
    }).subscribe({
      next: (response) => {
        this.loadData = false;
        this.ManageCurrentPage = Number(response.data.page);
        this.ManageTotalItems = response.data.total_items;
        this.ManagetotalPages = response.data.total_pages;

        this.jobTitles = response.data.list_items.map((item: any) => ({
          id: item.id,
          name: item.name,
          assigned: false
        }));
        // console.log(this.jobTitles);
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
        this.loadJobs = false;
      },
      error: (err) => {
        this.loadData = false;
        console.error(err.error?.details);
        this.loadJobs = false;
      }
    });
  }
  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(page: number) {
    this.ManageCurrentPage = page;
    this.getAllJobTitles(page, this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number): void {
    this.manageItemsPerPage = newItemsPerPage;
    this.ManageCurrentPage = 1;
    this.getAllJobTitles(this.ManageCurrentPage, this.searchTerm);
  }



  nextGetJobs(): void {
    this.goNext();
    this.ManageCurrentPage = 1; // Reset to page 1 when entering step 3
    this.searchTerm = ''; // Clear search term
    this.getAllJobTitles(1, '');
  }
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
    partTime_status: new FormControl(false, [Validators.required]),
    partTime_restrict: new FormControl(false),

    hourly_minimum: new FormControl('', [Validators.pattern(/^\d+$/)]),
    hourly_maximum: new FormControl('', [Validators.pattern(/^\d+$/)]),
    hourly_currency: new FormControl('EGP', [Validators.required]),
    hourly_status: new FormControl(false, [Validators.required]),
    hourly_restrict: new FormControl(false),
  }, { validators: multipleMinMaxValidator });

  updateStatusBasedOnInput(minField: string, maxField: string, statusField: string) {
    const minValue = this.jobStep2.get(minField)?.value;
    const maxValue = this.jobStep2.get(maxField)?.value;

    if (minValue || maxValue) {
      this.jobStep2.get(statusField)?.setValue(true, { emitEvent: false });
    } else {
      this.jobStep2.get(statusField)?.setValue(false, { emitEvent: false });
    }
  }



  currentStep = 1;
  selectAll: boolean = false;

  goNext() {
    if (this.currentStep === 3) {
      if (this.jobTitles.length > 0 && !this.jobTitles.some(job => job.assigned)) {
        this.selectJobError = true;
        return;
      }
    }

    this.selectJobError = false;
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
          this.ManageCurrentPage = 1;
          this.searchTerm = '';
          this.getAllJobTitles(1, '');
        }
        return;
      }
    }

    // All validations passed, navigate to the target step
    this.currentStep = step;
    this.selectJobError = false;

    // Call APIs when navigating to step 3 (Direct Manager)
    if (step === 3) {
      this.ManageCurrentPage = 1;
      this.searchTerm = '';
      this.getAllJobTitles(1, '');
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
  toggleAssignStatus(selectedJob: any) {
    if (selectedJob.assigned) {
      selectedJob.assigned = false;
    } else {
      this.jobTitles.forEach(job => {
        job.assigned = (job.id === selectedJob.id);
      });
    }
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
    }
    this.newRequirement = '';
    this.showInput = false;
  }

  deleteRequirement(index: number) {
    this.requirements.splice(index, 1);
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
  createJobTitle() {
    if (this.currentStep === 3 && this.jobTitles.length > 0 && !this.jobTitles.some(job => job.assigned)) {
      this.selectJobError = true;
      return;
    }

    this.selectJobError = false;
    this.isLoading = true;
    const managementLevel = Number(this.jobStep1.get('managementLevel')?.value);
    const jobLevel = Number(this.jobStep1.get('jobLevel')?.value);


    const requestData: any = {
      request_data: {
        code: this.jobStep1.get('code')?.value || '',
        name: this.jobStep1.get('jobName')?.value || '',
        management_level: managementLevel,
        job_level: jobLevel,
        salary_ranges: {
          full_time: {
            minimum: this.jobStep2.get('fullTime_minimum')?.value,
            maximum: this.jobStep2.get('fullTime_maximum')?.value,
            currency: this.jobStep2.get('fullTime_currency')?.value,
            status: this.jobStep2.get('fullTime_status')?.value ? true : false,
            restrict: this.jobStep2.get('fullTime_restrict')?.value,
          },
          part_time: {
            minimum: this.jobStep2.get('partTime_minimum')?.value,
            maximum: this.jobStep2.get('partTime_maximum')?.value,
            currency: this.jobStep2.get('partTime_currency')?.value,
            status: this.jobStep2.get('partTime_status')?.value ? true : false,
            restrict: this.jobStep2.get('partTime_restrict')?.value,
          },
          per_hour: {
            minimum: this.jobStep2.get('hourly_minimum')?.value,
            maximum: this.jobStep2.get('hourly_maximum')?.value,
            currency: this.jobStep2.get('hourly_currency')?.value,
            status: this.jobStep2.get('hourly_status')?.value ? true : false,
            restrict: this.jobStep2.get('hourly_restrict')?.value,
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
    // console.log('management', managementLevel);
    // console.log('departmentId', departmentId);
    // console.log('sectionId', sectionId);
    const assignedJob = this.jobTitles.find(j => j.assigned);

    requestData.request_data.assigns = {
      set: assignedJob ? [assignedJob.id] : [],
      remove: []
    };


    this._JobsService.createJobTitle(requestData).subscribe({

      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/jobs/all-job-titles']);
        this.toasterMessageService.sendMessage("Job Title created successfully");

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

    // console.log('row', requestData);
  }


}
