
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { ManageEmployeeSharedService } from '../services/manage-shared.service';
import { BranchesService } from '../../../../../core/services/od/branches/branches.service';
import { DepartmentsService } from '../../../../../core/services/od/departments/departments.service';
import { JobsService } from '../../../../../core/services/od/jobs/jobs.service';
import { pairwise, startWith } from 'rxjs';
// Work schedule moved to attendance step

@Component({
  selector: 'app-job-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './job-details-step.component.html',
  styleUrls: ['./job-details-step.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class JobDetailsStepComponent implements OnInit {
  sharedService = inject(ManageEmployeeSharedService);
  private branchesService = inject(BranchesService);
  private departmentsService = inject(DepartmentsService);
  private jobsService = inject(JobsService);

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
    // Work schedules are now loaded in the Attendance step component
  }



  private setupJobDetailsWatchers(): void {
    this.sharedService.jobDetails.get('branch_id')?.valueChanges.pipe(
      startWith(this.sharedService.jobDetails.get('branch_id')?.value),
      pairwise()
    ).subscribe(([prevBranchId, currentBranchId]) => {
      if (currentBranchId) {
        if (prevBranchId !== null && prevBranchId !== currentBranchId) {
          this.sharedService.jobDetails.get('department_id')?.setValue(null);
          this.sharedService.jobDetails.get('section_id')?.setValue(null);
          this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
        }
        this.sharedService.departments.set([]);
        this.sharedService.jobDetails.get('department_id')?.enable();
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
        this.loadDepartmentsByBranch(currentBranchId);
      } else {
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
        this.sharedService.jobTitles.set([]);
        this.sharedService.jobDetails.get('department_id')?.disable();
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      }
    });

    this.sharedService.jobDetails.get('department_id')?.valueChanges.pipe(
      startWith(this.sharedService.jobDetails.get('department_id')?.value),
      pairwise()
    ).subscribe(([prevDeptId, currentDeptId]) => {
      if (prevDeptId !== null && prevDeptId !== currentDeptId) {
        this.sharedService.jobDetails.get('section_id')?.setValue(null);
        this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
      }

      if (currentDeptId) {
        const depts = this.sharedService.departments();
        const selectedDept = depts.find((d: any) => d.id == currentDeptId);
        const deptSections = selectedDept && Array.isArray(selectedDept.sections) ? selectedDept.sections : [];
        this.sharedService.sections.set(deptSections);
        this.sharedService.jobDetails.get('section_id')?.enable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      } else {
        this.sharedService.sections.set([]);
        this.sharedService.jobTitles.set([]);
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      }
    });

    this.sharedService.jobDetails.get('section_id')?.valueChanges.pipe(
      startWith(this.sharedService.jobDetails.get('section_id')?.value),
      pairwise()
    ).subscribe(([prevSectionId, currentSectionId]) => {
      if (prevSectionId !== null && prevSectionId !== currentSectionId) {
        this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
      }

      if (currentSectionId) {
        this.sharedService.jobDetails.get('job_title_id')?.enable();
        this.loadJobTitlesBySection(currentSectionId);
      } else {
        this.sharedService.jobTitles.set([]);
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      }
    });
  }



  loadDepartmentsByBranch(branchId: number): void {
    this.departmentsService.getAllDepartment(1, 100, { branch_id: branchId, status: 'all' }).subscribe({
      next: (res) => {
        const depts = res.data?.list_items || [];
        this.sharedService.departments.set(depts);
        const currentDeptId = this.sharedService.jobDetails.get('department_id')?.value;
        if (currentDeptId) {
          const selectedDept = depts.find((d: any) => d.id == currentDeptId);
          if (selectedDept) {
            const deptSections = Array.isArray(selectedDept.sections) ? selectedDept.sections : [];
            this.sharedService.sections.set(deptSections);

            const currentSectionId = this.sharedService.jobDetails.get('section_id')?.value;
            if (currentSectionId) {

              this.loadJobTitlesBySection(currentSectionId);
            }
          }
        }
      },
      error: (err) => {
        console.error('Error loading departments by branch', err);
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
      }
    });
  }

  private loadJobTitlesBySection(sectionId: number): void {
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
