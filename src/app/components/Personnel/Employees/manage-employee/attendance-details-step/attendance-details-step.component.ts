import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { ManageEmployeeSharedService } from '../services/manage-shared.service';
import { WorkSchaualeService } from '../../../../../core/services/attendance/work-schaduale/work-schauale.service';

@Component({
  selector: 'app-attendance-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './attendance-details-step.component.html',
  styleUrls: ['./attendance-details-step.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class AttendanceDetailsStepComponent implements OnInit {
  workModeSub?: any;
  employmentTypeSub?: any;
  @Output() submitForm = new EventEmitter<void>();

  sharedService = inject(ManageEmployeeSharedService);
  private workScheduleService = inject(WorkSchaualeService);

  workScheduleLoading = false;

  ngOnInit(): void {
    // Listen for work_mode changes and filter schedules accordingly
    const workModeCtrl = this.sharedService.attendanceDetails.get('work_mode');
    if (workModeCtrl) {
      this.workModeSub = workModeCtrl.valueChanges.subscribe((mode: number) => {
        if (mode) {
          this.loadWorkScheduleFiltered(mode);
        } else {
          this.loadWorkSchedule();
        }
      });
      // Initial load if value already set
      if (workModeCtrl.value) {
        this.loadWorkScheduleFiltered(workModeCtrl.value);
      } else {
        this.loadWorkSchedule();
      }
    } else {
      this.loadWorkSchedule();
    }

    // Listen for employment_type changes and reload work schedules
    const employmentTypeCtrl = this.sharedService.attendanceDetails.get('employment_type');
    if (employmentTypeCtrl) {
      this.employmentTypeSub = employmentTypeCtrl.valueChanges.subscribe(() => {
        // Always reload with current work_mode value (if any)
        const workMode = this.sharedService.attendanceDetails.get('work_mode')?.value;
        if (workMode) {
          this.loadWorkScheduleFiltered(workMode);
        } else {
          this.loadWorkSchedule();
        }
      });
    }
  }

  private loadWorkSchedule(): void {
    this.workScheduleLoading = true;
    this.workScheduleService.getAllWorkSchadule(1, 1000).subscribe({
      next: (response) => {
        const schedules = response?.data?.list_items || [];
        this.sharedService.workSchedules.set(schedules);
        this.workScheduleLoading = false;
      },
      error: (error) => {
        console.error('Error loading work schedules:', error);
        this.workScheduleLoading = false;
      }
    });
  }

  private loadWorkScheduleFiltered(workScheduleType: number): void {
    this.workScheduleLoading = true;
    this.workScheduleService.getAllWorkSchadule(1, 1000, { work_schedule_type: workScheduleType.toString() }).subscribe({
      next: (response) => {
        const schedules = response?.data?.list_items || [];
        this.sharedService.workSchedules.set(schedules);
        this.workScheduleLoading = false;
      },
      error: (error) => {
        console.error('Error loading filtered work schedules:', error);
        this.workScheduleLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.workModeSub) {
      this.workModeSub.unsubscribe();
    }
    if (this.employmentTypeSub) {
      this.employmentTypeSub.unsubscribe();
    }
  }

  goPrev() {
    this.sharedService.goPrev();
  }

  goNext() {
    this.sharedService.goNext();
  }

  onSubmit() {
    this.submitForm.emit();
  }
}
