
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { CreateEmployeeSharedService } from '../services/create-employee-shared.service';

@Component({
  selector: 'app-contract-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contract-details-step.component.html',
  styleUrls: ['./contract-details-step.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class ContractDetailsStepComponent {
  sharedService = inject(CreateEmployeeSharedService);

  goPrev() {
    this.sharedService.goPrev();
  }

  goNext() {
    if (this.sharedService.validateCurrentStep()) {
      this.sharedService.goNext();
    }
  }
}
