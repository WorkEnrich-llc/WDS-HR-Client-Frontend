import { Component, inject } from '@angular/core';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';
import { SharedStepperNavigationComponent, StepperNavigationConfig } from '../../../../shared/stepper-navigation/shared-stepper-navigation.component';

@Component({
  standalone: true,
  selector: 'app-edit-stepper-navigation',
  imports: [SharedStepperNavigationComponent],
  templateUrl: './edit-stepper-navigation.component.html',
  styleUrl: './edit-stepper-navigation.component.css'
})
export class EditStepperNavigationComponent {
  public sharedService = inject(EditEmployeeSharedService);

  stepperConfig: StepperNavigationConfig = {
    currentStep: () => this.sharedService.currentStep(),
    goToStep: (step: number) => this.sharedService.goToStep(step)
  };

  goToStep(step: number) {
    this.sharedService.goToStep(step);
  }
}
