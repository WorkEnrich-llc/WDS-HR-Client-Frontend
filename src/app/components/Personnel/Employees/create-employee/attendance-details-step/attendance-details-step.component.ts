import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { CreateEmployeeSharedService } from '../services/create-employee-shared.service';

@Component({
  selector: 'app-attendance-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './attendance-details-step.component.html',
  styleUrls: ['./attendance-details-step.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class AttendanceDetailsStepComponent {
  @Output() submitForm = new EventEmitter<void>();
  
  sharedService = inject(CreateEmployeeSharedService);

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
