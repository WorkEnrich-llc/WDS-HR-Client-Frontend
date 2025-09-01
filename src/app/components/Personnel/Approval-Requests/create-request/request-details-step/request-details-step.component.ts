import { CommonModule } from '@angular/common';
import { Component, inject, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateRequestSharedService } from '../services/create-request-shared.service';

@Component({
  selector: 'app-request-details-step',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-details-step.component.html',
  styleUrl: './request-details-step.component.css'
})
export class RequestDetailsStepComponent {
  @Output() submitForm = new EventEmitter<void>();
  
  sharedService = inject(CreateRequestSharedService);

  onPrevious() {
    this.sharedService.previousStep();
  }

  onSubmit() {
    if (this.sharedService.requestDetails.valid && this.sharedService.requestForm.valid) {
      this.submitForm.emit();
    } else {
      this.sharedService.requestDetails.markAllAsTouched();
    }
  }

  // Check if request type is Leave Request to show leave type dropdown
  isLeaveRequest(): boolean {
    return this.sharedService.mainInformation.get('request_type')?.value === 1;
  }
}
