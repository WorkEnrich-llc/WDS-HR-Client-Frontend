import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';
import { WorkSchaualeService } from '../../../../../core/services/attendance/work-schaduale/work-schauale.service';

@Component({
  standalone: true,
  selector: 'app-edit-attendance-details-step',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-attendance-details-step.component.html',
  styleUrls: ['./edit-attendance-details-step.component.css']
})
export class EditAttendanceDetailsStepComponent implements OnInit {
  public sharedService = inject(EditEmployeeSharedService);
  private workScheduleService = inject(WorkSchaualeService);

  ngOnInit(): void {
    // Load work schedules initially
    this.loadWorkSchedules();

    // React to department selection changes
    this.sharedService.jobDetails.get('department_id')?.valueChanges.subscribe(departmentId => {
      if (departmentId) {
        this.loadWorkSchedules(departmentId);
      }
    });
  }

  private loadWorkSchedules(departmentId?: number): void {
    const filters = departmentId ? { department: departmentId.toString() } : {};
    
    this.workScheduleService.getAllWorkSchadule(1, 100, filters).subscribe({
      next: (res) => {
        this.sharedService.workSchedules.set(res.data?.list_items || []);
      },
      error: (err) => {
        console.error('Error loading work schedules', err);
        this.sharedService.workSchedules.set([]);
      }
    });
  }

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
