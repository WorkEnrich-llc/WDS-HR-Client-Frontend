import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';
import { CreateEmployeeSharedService } from '../../create-employee/services/create-employee-shared.service';

@Component({
  standalone: true,
  selector: 'app-edit-job-details-step',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-job-details-step.component.html',
  styleUrls: ['./edit-job-details-step.component.css']
})
export class EditJobDetailsStepComponent {
  public sharedService = inject(EditEmployeeSharedService);
  public createService = inject(CreateEmployeeSharedService);

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
