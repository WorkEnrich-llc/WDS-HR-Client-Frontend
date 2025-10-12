import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { WorkSchaualeService } from '../../../../../core/services/attendance/work-schaduale/work-schauale.service';
import { ManageEmployeeSharedService } from '../services/manage-shared.service';

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
    // load work schedules initially
    this.workScheduleService.getAllWorkSchadule(1, 100).subscribe({
      next: (res) => this.sharedService.workSchedules.set(res.data.list_items),
      error: (err) => console.error('Error loading work schedules', err),
    });

    // react to department selection (if department controlled in shared service)
    this.sharedService.jobDetails.get('department_id')?.valueChanges.subscribe(departmentId => {
      if (departmentId) {
        this.workScheduleService.getAllWorkSchadule(1, 100, { department: departmentId.toString() }).subscribe({
          next: (res) => this.sharedService.workSchedules.set(res.data?.list_items || []),
          error: (err) => {
            console.error('Error loading work schedules for department', err);
            this.sharedService.workSchedules.set([]);
          }
        });
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
