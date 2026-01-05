
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ManageEmployeeSharedService } from '../../manage-employee/services/manage-shared.service';
import { NgClass } from '@angular/common';

export interface StepperNavigationConfig {
  currentStep: () => number;
  goToStep?: (step: number) => void;
}

@Component({
  standalone: true,
  selector: 'app-shared-stepper-navigation',
  imports: [NgClass],
  templateUrl: './shared-stepper-navigation.component.html',
  styleUrl: './shared-stepper-navigation.component.css'
})
export class SharedStepperNavigationComponent {
  @Input() stepperConfig!: StepperNavigationConfig;
  @Output() stepClicked = new EventEmitter<number>();
  public sharedService = inject(ManageEmployeeSharedService);

  goToStep(step: number) {
    this.stepClicked.emit(step);
    if (this.stepperConfig.goToStep) {
      this.stepperConfig.goToStep(step);
    }
  }
}
