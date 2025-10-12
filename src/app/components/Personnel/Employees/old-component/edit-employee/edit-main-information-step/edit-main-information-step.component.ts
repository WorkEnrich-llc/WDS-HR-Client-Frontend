import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';
import { Country } from '../../create-employee/countries-list';

@Component({
  standalone: true,
  selector: 'app-edit-main-information-step',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-main-information-step.component.html',
  styleUrls: ['./edit-main-information-step.component.css']
})
export class EditMainInformationStepComponent {
  public sharedService = inject(EditEmployeeSharedService);

  selectCountry(country: Country) {
    this.sharedService.selectCountry(country);
  }

  getSelectedCountry(): Country {
    return this.sharedService.getSelectedCountry();
  }

  goNext() {
    this.sharedService.goNext();
  }
}
