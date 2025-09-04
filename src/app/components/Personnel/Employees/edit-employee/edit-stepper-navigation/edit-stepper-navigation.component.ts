import { Component, inject } from '@angular/core';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';

@Component({
  standalone: true,
  selector: 'app-edit-stepper-navigation',
  imports: [],
  templateUrl: './edit-stepper-navigation.component.html',
  styleUrls: ['./edit-stepper-navigation.component.css']
})
export class EditStepperNavigationComponent {
  public sharedService = inject(EditEmployeeSharedService);

  goToStep(step: number) {
    this.sharedService.goToStep(step);
  }
}
