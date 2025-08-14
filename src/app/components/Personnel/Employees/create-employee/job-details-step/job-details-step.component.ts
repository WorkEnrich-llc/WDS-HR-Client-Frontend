
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
    // Initially disable department, section, and job title selects until a branch/department is chosen
    this.sharedService.jobDetails.get('department_id')?.disable();
    this.sharedService.jobDetails.get('section_id')?.disable();
    this.sharedService.jobDetails.get('job_title_id')?.disable();
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
        // enable department select
        this.sharedService.jobDetails.get('department_id')?.enable();
        this.loadDepartmentsByBranch(branchId);
        // Reset dependent fields
        this.sharedService.jobDetails.get('department_id')?.setValue(null);
        this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
        this.sharedService.sections.set([]);
        // Keep section and job title disabled until department selected
        this.sharedService.jobDetails.get('section_id')?.setValue(null);
        this.sharedService.jobDetails.get('section_id')?.disable();
        this.sharedService.jobDetails.get('job_title_id')?.disable();
      } else {
        // no branch: disable dependent selects
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
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
      // reset dependent fields
      this.sharedService.jobDetails.get('section_id')?.setValue(null);
      this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
      if (departmentId) {
        // enable section and job title selects
        this.sharedService.jobDetails.get('section_id')?.enable();
        this.sharedService.jobDetails.get('job_title_id')?.enable();
        // fetch all job titles for selected department
        this.jobsService.getAllJobTitles(1, 100, { department: departmentId.toString() }).subscribe({
          next: res => {
            const titles = res.data?.list_items || [];
            this.sharedService.jobTitles.set(titles);
            // fetch work schedules for selected department
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
          },
          error: err => {
            console.error('Error loading job titles for department', err);
            this.sharedService.jobTitles.set([]);
          }
        });
      } else {
        this.sharedService.jobTitles.set([]);
        // disable section and job title when no department
        this.sharedService.jobDetails.get('section_id')?.disable();
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
        
        // Extract all sections from all departments
        const allSections: any[] = [];
        depts.forEach((dept: any) => {
          if (dept.sections && Array.isArray(dept.sections)) {
            allSections.push(...dept.sections);
          }
        });
        this.sharedService.sections.set(allSections);
      },
      error: (err) => {
        console.error('Error loading departments by branch', err);
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
      }
    });
  }

  goNext() {
    this.sharedService.goNext();
  }

  goPrev() {
    this.sharedService.goPrev();
  }
}
