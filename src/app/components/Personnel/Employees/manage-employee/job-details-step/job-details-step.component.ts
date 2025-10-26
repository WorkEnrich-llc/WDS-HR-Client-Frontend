
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { ManageEmployeeSharedService } from '../services/manage-shared.service';
// Work schedule moved to attendance step

@Component({
  selector: 'app-job-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './job-details-step.component.html',
  styleUrls: ['./job-details-step.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class JobDetailsStepComponent implements OnInit {
  sharedService = inject(ManageEmployeeSharedService);


  ngOnInit(): void {
    this.sharedService.clearErrorMessages();
  }



  goNext() {
    // Clear any previous error messages before validation
    this.sharedService.clearErrorMessages();

    // Validate job details before proceeding
    if (this.sharedService.validateCurrentStep()) {
      this.sharedService.goNext();
    }
  }

  goPrev() {
    // Clear any error messages when going back
    this.sharedService.clearErrorMessages();
    this.sharedService.goPrev();
  }

  // Helper method to reset form field state
  private resetFieldState(fieldName: string): void {
    const control = this.sharedService.jobDetails.get(fieldName);
    if (control) {
      control.setErrors(null);
      control.markAsUntouched();
      control.markAsPristine();
    }
  }
}
