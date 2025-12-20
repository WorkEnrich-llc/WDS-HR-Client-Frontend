
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { EditEmployeeSharedService } from '../services/edit-employee-shared.service';

@Component({
  selector: 'app-edit-insurance-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './edit-insurance-details-step.component.html',
  styleUrls: ['./edit-insurance-details-step.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class EditInsuranceDetailsStepComponent {
  @Output() submitForm = new EventEmitter<void>();

  sharedService = inject(EditEmployeeSharedService);

  getCurrentSalary(): string {
    const salary = this.sharedService.contractDetails.get('salary')?.value;
    if (salary || salary === 0) {
      return this.formatCurrency(salary);
    }
    return '0.00';
  }

  private formatCurrency(value: any): string {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.00';
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  onSubmit() {
    this.submitForm.emit();
  }
}
