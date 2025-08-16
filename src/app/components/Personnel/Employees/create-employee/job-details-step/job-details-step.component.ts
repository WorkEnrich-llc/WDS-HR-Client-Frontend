
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { CreateEmployeeSharedService } from '../services/create-employee-shared.service';
import { BranchesService } from '../../../../../core/services/od/branches/branches.service';
import { DepartmentsService } from '../../../../../core/services/od/departments/departments.service';
import { JobsService } from '../../../../../core/services/od/jobs/jobs.service';
import { WorkSchaualeService } from '../../../../../core/services/attendance/work-schaduale/work-schauale.service';

@Component({
  selector: 'app-job-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './job-details-step.component.html',
  styleUrls: ['./job-details-step.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class JobDetailsStepComponent implements OnInit {
  sharedService = inject(CreateEmployeeSharedService);
  private branchesService = inject(BranchesService);
  private departmentsService = inject(DepartmentsService);
  private jobsService = inject(JobsService);
  private workScheduleService = inject(WorkSchaualeService);

  ngOnInit(): void {
    this.loadInitialData();
    this.setupJobDetailsWatchers();
    
    // Clear any previous error messages when entering this step
    this.sharedService.clearErrorMessages();
    
    // Initially disable department, section, and job title selects until a branch/department is chosen
    const deptControl = this.sharedService.jobDetails.get('department_id');
    const sectionControl = this.sharedService.jobDetails.get('section_id');
    const jobTitleControl = this.sharedService.jobDetails.get('job_title_id');
    
    // If no branch is selected, disable department
    if (!this.sharedService.jobDetails.get('branch_id')?.value) {
      deptControl?.disable();
    }
    
    sectionControl?.disable();
    jobTitleControl?.disable();
  }

  private loadInitialData(): void {
    this.branchesService.getAllBranches(1, 100).subscribe({
      next: (res) => this.sharedService.branches.set(res.data.list_items),
      error: (err) => console.error('Error loading branches', err),
    });
    this.workScheduleService.getAllWorkSchadule(1, 100).subscribe({
      next: (res) => this.sharedService.workSchedules.set(res.data.list_items),
      error: (err) => console.error('Error loading work schedules', err),
    });
  }

  private setupJobDetailsWatchers(): void {
    // Watch for branch changes to fetch departments and sections
    // Watch for branch changes to fetch departments and manage field states
    this.sharedService.jobDetails.get('branch_id')?.valueChanges.subscribe(branchId => {
      if (branchId) {
        // First clear all dependent data arrays to prevent automatic selection
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
        this.sharedService.jobTitles.set([]);
        
        // Reset all dependent fields to null BEFORE loading new data
        this.sharedService.jobDetails.get('department_id')?.setValue(null);
        this.sharedService.jobDetails.get('section_id')?.setValue(null);
        this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
        
        // enable department select and clear any previous errors
        const deptControl = this.sharedService.jobDetails.get('department_id');
        deptControl?.enable();
        this.sharedService.clearFieldErrors('department_id', this.sharedService.jobDetails);
        
        // Keep section and job title disabled until department selected
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
        
        // Load departments after clearing everything
        this.loadDepartmentsByBranch(branchId);
      } else {
        // no branch: disable dependent selects
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
        this.sharedService.jobTitles.set([]);
        this.sharedService.jobDetails.get('department_id')?.setValue(null);
        this.sharedService.jobDetails.get('department_id')?.disable();
        this.sharedService.jobDetails.get('section_id')?.setValue(null);
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      }
    });

    // Watch for department changes to reset section, load job titles, and enable section select
    this.sharedService.jobDetails.get('department_id')?.valueChanges.subscribe(departmentId => {
      this.sharedService.jobDetails.get('section_id')?.setValue(null);
      this.sharedService.jobDetails.get('job_title_id')?.setValue(null);

      if (departmentId) {
        // Clear error messages and field errors when department is selected
        this.sharedService.clearErrorMessages();
        this.sharedService.clearFieldErrors('department_id', this.sharedService.jobDetails);
        this.sharedService.clearFieldErrors('section_id', this.sharedService.jobDetails);
        this.sharedService.clearFieldErrors('job_title_id', this.sharedService.jobDetails);

        // enable section select, but keep job title disabled until a section is chosen
        this.sharedService.jobDetails.get('section_id')?.enable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();

        // Filter sections to the selected department only (so section select shows relevant sections)
        const depts = this.sharedService.departments();
        const selectedDept = depts.find((d: any) => d.id == departmentId);
        const deptSections = selectedDept && Array.isArray(selectedDept.sections) ? selectedDept.sections : [];
        this.sharedService.sections.set(deptSections);

        // Optionally update work schedules for the department (keeps previous behavior)
        this.workScheduleService.getAllWorkSchadule(1, 100, { department: departmentId.toString() }).subscribe({
          next: res => {
            const schedules = res.data?.list_items || [];
            this.sharedService.workSchedules.set(schedules);
            if (schedules.length) {
              this.sharedService.jobDetails.get('work_schedule_id')?.setValue(schedules[0].id);
            }
          },
          error: err => console.error('Error loading work schedules for department', err)
        });
      } else {
        this.sharedService.jobTitles.set([]);
        // disable section and job title when no department
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
        // clear sections list
        this.sharedService.sections.set([]);
      }
    });

    // Watch for section changes to fetch job titles filtered by section
    this.sharedService.jobDetails.get('section_id')?.valueChanges.subscribe(sectionId => {
      // reset dependent field
      this.sharedService.jobDetails.get('job_title_id')?.setValue(null);

      if (sectionId) {
        // Clear errors and enable job title select
        this.sharedService.clearErrorMessages();
        this.sharedService.clearFieldErrors('section_id', this.sharedService.jobDetails);
        this.sharedService.clearFieldErrors('job_title_id', this.sharedService.jobDetails);

        this.sharedService.jobDetails.get('job_title_id')?.enable();

        // Fetch job titles filtered by section (correct behavior)
        this.jobsService.getAllJobTitles(1, 100, { section: sectionId.toString() }).subscribe({
          next: res => {
            const titles = res.data?.list_items || [];
            this.sharedService.jobTitles.set(titles);
          },
          error: err => {
            console.error('Error loading job titles for section', err);
            this.sharedService.jobTitles.set([]);
          }
        });
      } else {
        this.sharedService.jobTitles.set([]);
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      }
    });
  }

  loadDepartmentsByBranch(branchId: number): void {
    // Fetch departments for selected branch using filters
    this.departmentsService.getAllDepartment(1, 100, { branch_id: branchId, status: 'all' }).subscribe({
      next: (res) => {
        const depts = res.data?.list_items || [];
        this.sharedService.departments.set(depts);
        
        // Do NOT set sections here - keep them empty until department is selected
        // This prevents automatic selection when there's only one department
        this.sharedService.sections.set([]);
        
        // Ensure no automatic selection by explicitly keeping values null
        this.sharedService.jobDetails.get('department_id')?.setValue(null);
        this.sharedService.jobDetails.get('section_id')?.setValue(null);
        this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
      },
      error: (err) => {
        console.error('Error loading departments by branch', err);
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
      }
    });
  }

  goNext() {
    // Clear any previous error messages before validation
    this.sharedService.clearErrorMessages();
    
    // Validate job details before proceeding
    if (this.sharedService.validateCurrentStep()) {
      this.sharedService.goNext();
    }
  }

  goPrev() {
    // Clear any error messages when going back
    this.sharedService.clearErrorMessages();
    this.sharedService.goPrev();
  }

  // Helper method to reset form field state
  private resetFieldState(fieldName: string): void {
    const control = this.sharedService.jobDetails.get(fieldName);
    if (control) {
      control.setErrors(null);
      control.markAsUntouched();
      control.markAsPristine();
    }
  }
}
