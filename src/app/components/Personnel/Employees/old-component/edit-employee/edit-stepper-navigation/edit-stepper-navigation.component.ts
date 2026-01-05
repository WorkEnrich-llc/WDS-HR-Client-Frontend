
import { Component, inject } from '@angular/core';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';

@Component({
  standalone: true,
  selector: 'app-edit-stepper-navigation',
  imports: [],
  templateUrl: './edit-stepper-navigation.component.html',
  styleUrl: './edit-stepper-navigation.component.css'
})
export class EditStepperNavigationComponent {
  public sharedService = inject(EditEmployeeSharedService);

  stepperConfig = {
    currentStep: () => this.sharedService.currentStep()
  };

  goToStep(step: number) {
    this.sharedService.goToStep(step);
  }
}
