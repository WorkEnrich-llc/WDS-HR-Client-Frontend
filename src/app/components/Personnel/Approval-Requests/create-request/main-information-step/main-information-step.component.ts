import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateRequestSharedService } from '../services/create-request-shared.service';

@Component({
  selector: 'app-main-information-step',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './main-information-step.component.html',
  styleUrl: './main-information-step.component.css'
})
export class MainInformationStepComponent {
  sharedService = inject(CreateRequestSharedService);

  onNext() {
    if (this.sharedService.mainInformation.valid) {
      this.sharedService.nextStep();
    } else {
      this.sharedService.mainInformation.markAllAsTouched();
    }
  }
}
