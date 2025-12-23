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
  @Output() submitForm = new EventEmitter<void>();

  sharedService = inject(ManageEmployeeSharedService);
  private workScheduleService = inject(WorkSchaualeService);

  ngOnInit(): void {
    this.loadWorkSchedule();
  }

  private loadWorkSchedule(): void {
    this.workScheduleService.getAllWorkSchadule(1, 1000).subscribe({
      next: (response) => {
        const schedules = response?.data?.list_items || [];
        this.sharedService.workSchedules.set(schedules);
      },
      error: (error) => {
        console.error('Error loading work schedules:', error);
      }
    });
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
