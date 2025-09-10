import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CreateRequestSharedService } from '../services/create-request-shared.service';

@Component({
  selector: 'app-stepper-navigation',
  imports: [CommonModule],
  templateUrl: './stepper-navigation.component.html',
  styleUrl: './stepper-navigation.component.css'
})
export class StepperNavigationComponent {
  sharedService = inject(CreateRequestSharedService);
}
