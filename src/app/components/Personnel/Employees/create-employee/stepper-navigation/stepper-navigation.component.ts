import { Component, inject } from '@angular/core';
import { CreateEmployeeSharedService } from '../services/create-employee-shared.service';
import { SharedStepperNavigationComponent, StepperNavigationConfig } from '../../../../shared/stepper-navigation/shared-stepper-navigation.component';

@Component({
  selector: 'app-stepper-navigation',
  imports: [SharedStepperNavigationComponent],
  templateUrl: './stepper-navigation.component.html',
  styleUrl: './stepper-navigation.component.css'
})
export class StepperNavigationComponent {
  sharedService = inject(CreateEmployeeSharedService);

  stepperConfig: StepperNavigationConfig = {
    currentStep: () => this.sharedService.currentStep()
  };
}
