import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
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

  ngOnInit(): void {

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
