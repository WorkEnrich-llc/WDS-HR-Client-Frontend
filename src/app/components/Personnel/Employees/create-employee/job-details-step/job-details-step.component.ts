import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { CreateEmployeeSharedService } from '../services/create-employee-shared.service';
import { BranchesService } from '../../../../../core/services/od/branches/branches.service';
import { DepartmentsService } from '../../../../../core/services/od/departments/departments.service';
import { JobsService } from '../../../../../core/services/od/jobs/jobs.service';
import { WorkSchaualeService } from '../../../../../core/services/personnel/work-schaduale/work-schauale.service';

@Component({
  selector: 'app-job-details-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    this.sharedService.jobDetails.get('branch_id')?.valueChanges.subscribe(branchId => {
      if (branchId) {
        this.loadDepartmentsByBranch(branchId);
        // Reset dependent fields
        this.sharedService.jobDetails.get('department_id')?.setValue(null);
        this.sharedService.jobDetails.get('section_id')?.setValue(null);
      } else {
        this.sharedService.departments.set([]);
        this.sharedService.sections.set([]);
      }
    });

    // Watch for department changes to reset section and load job titles
    this.sharedService.jobDetails.get('department_id')?.valueChanges.subscribe(departmentId => {
      // reset dependent fields
      this.sharedService.jobDetails.get('section_id')?.setValue(null);
      this.sharedService.jobDetails.get('job_title_id')?.setValue(null);
      if (departmentId) {
        // fetch all job titles for selected department using paginated API
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
