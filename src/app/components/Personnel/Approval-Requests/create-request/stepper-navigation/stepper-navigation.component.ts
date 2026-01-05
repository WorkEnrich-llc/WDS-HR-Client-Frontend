
import { Component, inject } from '@angular/core';
import { CreateRequestSharedService } from '../services/create-request-shared.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-stepper-navigation',
  imports: [NgClass],
  templateUrl: './stepper-navigation.component.html',
  styleUrl: './stepper-navigation.component.css'
})
export class StepperNavigationComponent {
  sharedService = inject(CreateRequestSharedService);
}
