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
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
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
  getJobTitle(jobId: number) {
    this.loadData = true;
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
  // jobTitleData loaded
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

        // Initial Job Title Data loaded (debug logs removed)

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
        this.loadData = false;
      },
      error: (err) => {
        // Error details available in err.error?.details
        this.loadData = false;
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

    // Get the currently assigned manager ID from jobTitles array
    const currentAssignedId = this.jobTitles.find(j => j.assigned)?.id || null;

    // checkForChanges debug logs removed

    this.hasChanges =
      JSON.stringify(this.jobStep1.getRawValue()) !== JSON.stringify(this.originalData.jobStep1) ||
      JSON.stringify(this.jobStep2.getRawValue()) !== JSON.stringify(this.originalData.jobStep2) ||
      JSON.stringify(this.jobStep4.getRawValue()) !== JSON.stringify(this.originalData.jobStep4) ||
      JSON.stringify(this.requirements) !== JSON.stringify(this.originalData.requirements) ||
      currentAssignedId !== this.originalAssignedId;

  // hasChanges state updated
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

    departmentControl?.reset('');
    sectionControl?.reset('');

    this.sections = [];

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
      },
      error: (err) => {
        // Error details available in err.error?.details
      }
    });
  }


  getsections(deptid: number) {
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

  // activeSections available for debugging
      },
      error: (err) => {
        // Error details available in err.error?.details
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
          // Use originalAssignedId as the source of truth for which manager is currently assigned
          const isAssigned = this.originalAssignedId !== null && item.id === this.originalAssignedId;
          return {
            id: item.id,
            code: item.code || null,  // Include the code field
            name: item.name,
            assigned: isAssigned
          };
        });
        
        // Job titles loaded/updated (debug logs removed)

        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
      },
      error: (err) => {
      // Error details available in err.error?.details
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
    fullTime_restrict: new FormControl(false),

    partTime_minimum: new FormControl('', [ Validators.pattern(/^\d+$/)]),
    partTime_maximum: new FormControl('', [ Validators.pattern(/^\d+$/)]),
    partTime_currency: new FormControl('EGP', [Validators.required]),
    partTime_status: new FormControl(true, [Validators.required]),
    partTime_restrict: new FormControl(false),

    hourly_minimum: new FormControl('', [ Validators.pattern(/^\d+$/)]),
    hourly_maximum: new FormControl('', [ Validators.pattern(/^\d+$/)]),
    hourly_currency: new FormControl('EGP', [Validators.required]),
    hourly_status: new FormControl(true, [Validators.required]),
    hourly_restrict: new FormControl(false),
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

  // Get the manager to display in the info box
  getDisplayedManager(): any {
    // If a new manager was selected from the list, show that one
    const currentlyAssigned = this.jobTitles.find(j => j.assigned);
    if (currentlyAssigned) {
      return currentlyAssigned;
    }
    
    // If manager was removed, show the removed one
    if (this.removedManager) {
      return this.removedManager;
    }
    
    // Otherwise show the original from jobTitleData
    return this.jobTitleData?.assigns?.[0] || null;
  }

  // Check if there's any manager to display (original or newly assigned)
  hasManagerToDisplay(): boolean {
    return this.getDisplayedManager() !== null;
  }


  removeCurrentManager() {
    // removeCurrentManager invoked

    // Find the currently assigned manager in the jobTitles array
    const current = this.jobTitles.find(job => job.assigned);
    
    // The manager to remove should be the one with originalAssignedId
    // Check if it exists in the jobTitles array
    const originalManagerInList = this.jobTitles.find(job => job.id === this.originalAssignedId);
    
    if (current) {
      // Store the ID and details for display purposes
      this.removedManagerId = this.originalAssignedId; // Use original, not current!
      this.removedManager = this.jobTitleData?.assigns?.[0] || { ...current };

      // Unassign in the local array
      current.assigned = false;
      current.assigns = [];

      // Mark as removed
      this.managerRemoved = true;

      this.checkForChanges();
    } else if (this.originalAssignedId !== null) {
      // Handle case where original manager exists but not in current jobTitles array
      // (might be on a different page or filtered out)
      this.removedManagerId = this.originalAssignedId;
      this.removedManager = this.jobTitleData?.assigns?.[0] || null;
      this.managerRemoved = true;

      // If the original manager is in the list but not marked as assigned, unassign it
      if (originalManagerInList) {
        originalManagerInList.assigned = false;
        originalManagerInList.assigns = [];
      }

      this.checkForChanges();
    } else {
      // No manager to remove
    }
  }

  toggleAssignStatus(selectedJob: any) {
    // toggleAssignStatus invoked

    const currentAssigned = this.jobTitles.find(job => job.assigned);

    if (!selectedJob.assigned) {
      // Unassign all current jobs
      this.jobTitles.forEach(job => {
        job.assigned = false;
        job.assigns = [];
      });

      // Assign the selected job
      selectedJob.assigned = true;
      selectedJob.assigns = [selectedJob];

      // Assigned new manager locally

      // Track the previous assigned for removal purposes
      this.previousAssignedId = currentAssigned ? currentAssigned.id : null;

      // Only set removedManager if there was a current assigned manager different from original
      if (currentAssigned && currentAssigned.id !== selectedJob.id) {
        this.removedManager = { ...currentAssigned };
      }

      this.newManagerSelected = true;
      // Reset managerRemoved flag since we're now assigning a new manager
      this.managerRemoved = false;
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
  // newRequirement processed
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

    // Determine the currently selected manager ID from jobTitles array
    const currentlySelectedId = assignedJob ? assignedJob.id : null;

    const hasOriginal = this.originalAssignedId !== null;
    const hasSelected = currentlySelectedId !== null;

    // Manager assignment debug logs removed

    // Case 1: Had original manager AND selected a new manager
    if (hasOriginal && hasSelected) {
      // Only make changes if they're different
      if (currentlySelectedId !== this.originalAssignedId) {
        removeArray.push(this.originalAssignedId!);
        setArray.push(currentlySelectedId!);
  // Case 1: Replacing manager
      } else {
  // Case 1: Same manager, no changes
      }
      // If same, no changes needed (arrays stay empty)
    } 
    // Case 2: Had original manager but NO manager selected now (removed)
    else if (hasOriginal && !hasSelected) {
      removeArray.push(this.originalAssignedId!);
  // Case 2: Removing manager
    } 
    // Case 3: No original manager but selected a new one
    else if (!hasOriginal && hasSelected) {
      setArray.push(currentlySelectedId!);
  // Case 3: Adding new manager
    } else {
  // Case 4: No changes (no original, no selected)
    }
    // Case 4: No original and no selected = no changes

  // Final arrays prepared for request

    requestData.request_data.assigns = {
      set: setArray,
      remove: removeArray
    };
  // requestData prepared

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
