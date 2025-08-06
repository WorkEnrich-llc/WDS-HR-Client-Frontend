import { Component, ElementRef, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { debounceTime, Subject } from 'rxjs';
import { Router } from '@angular/router';
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
  departments: any[] = [];
  sections: any[] = [];
  filterForm!: FormGroup;
  private searchSubject = new Subject<string>();

  constructor(private toasterMessageService: ToasterMessageService, private fb: FormBuilder, private toastr: ToastrService,
    private _DepartmentsService: DepartmentsService, private _JobsService: JobsService, private datePipe: DatePipe, private router: Router) {

    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;



  }

  ngOnInit(): void {
    this.getAllDepartment(this.currentPage);
    this.jobStep4 = new FormGroup({
      jobDescription: new FormControl('', [Validators.required, Validators.minLength(10)]),
      jobAnalysis: new FormControl('', [Validators.required, Validators.minLength(10)]),

    });
    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllJobTitles(this.currentPage, value);
    });
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

        this.jobTitles = response.data.list_items.map((item: any) => ({
          id: item.id,
          name: item.name,
          assigned: false
        }));
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
          },
          part_time: {
            minimum: this.jobStep2.get('partTime_minimum')?.value,
            maximum: this.jobStep2.get('partTime_maximum')?.value,
            currency: this.jobStep2.get('partTime_currency')?.value,
            status: this.jobStep2.get('partTime_status')?.value ? true : false,
          },
          per_hour: {
            minimum: this.jobStep2.get('hourly_minimum')?.value,
            maximum: this.jobStep2.get('hourly_maximum')?.value,
            currency: this.jobStep2.get('hourly_currency')?.value,
            status: this.jobStep2.get('hourly_status')?.value ? true : false,
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
