import { Component, inject, OnInit } from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';
import { CreateEmployeeSharedService } from '../../create-employee/services/create-employee-shared.service';
import { BranchesService } from 'app/core/services/od/branches/branches.service';

@Component({
  standalone: true,
  selector: 'app-edit-job-details-step',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-job-details-step.component.html',
  styleUrls: ['./edit-job-details-step.component.css']
})
export class EditJobDetailsStepComponent implements OnInit {
  public sharedService = inject(EditEmployeeSharedService);
  public createService = inject(CreateEmployeeSharedService);
  private branchesService = inject(BranchesService);

  ngOnInit(): void {
    this.loadBranches();
  }

  private loadBranches(): void {
    this.branchesService.getAllBranches(1, 100).subscribe({
      next: (res) => {
        this.createService.branches.set(res.data?.list_items || []);
      },
      error: (err) => {
        console.error('Error loading branches', err);
        this.createService.branches.set([]);
      }
    });
  }

  goNext() {
    this.sharedService.goNext();
  }

  goPrev() {
    this.sharedService.goPrev();
  }

  getBranchName(): string {
    const data = this.sharedService.employeeData();
    return data?.job_info?.branch?.name || '';
  }

  getDepartmentName(): string {
    const data = this.sharedService.employeeData();
    return data?.job_info?.department?.name || '';
  }

  getSectionName(): string {
    const data = this.sharedService.employeeData();
    return data?.job_info?.section?.name || '';
  }

  getJobTitleName(): string {
    const data = this.sharedService.employeeData();
    return data?.job_info?.job_title?.name || '';
  }

  getYearsOfExperience(): number {
    // Years of experience is not available in the Employee interface
    return 0;
  }
}
