import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';

@Component({
  standalone: true,
  selector: 'app-edit-attendance-details-step',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-attendance-details-step.component.html',
  styleUrls: ['./edit-attendance-details-step.component.css']
})
export class EditAttendanceDetailsStepComponent {
  public sharedService = inject(EditEmployeeSharedService);

  goNext() {
    this.sharedService.goNext();
  }

  goPrev() {
    this.sharedService.goPrev();
  }

  getEmploymentTypeName(): string {
    const data = this.sharedService.employeeData();
    return data?.job_info?.employment_type?.name || '';
  }

  getWorkModeName(): string {
    const data = this.sharedService.employeeData();
    return data?.job_info?.work_mode?.name || '';
  }

  getDaysOnSite(): number {
    const data = this.sharedService.employeeData();
    return data?.job_info?.days_on_site || 0;
  }

  getWorkScheduleName(): string {
    const data = this.sharedService.employeeData();
    return data?.job_info?.work_schedule?.name || '';
  }
}
