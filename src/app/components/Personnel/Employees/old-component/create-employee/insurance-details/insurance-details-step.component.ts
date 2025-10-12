import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';
import { CreateEmployeeSharedService } from '../services/create-employee-shared.service';

@Component({
  selector: 'app-insurance-details-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './insurance-details-step.component.html',
  styleUrl: './insurance-details-step.component.css',
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class InsuranceDetailsStepComponent {
  @Output() submitForm = new EventEmitter<void>();
  
  sharedService = inject(CreateEmployeeSharedService);

  getCurrentSalary(): string {
    const salary = this.sharedService.contractDetails.get('salary')?.value;
    if (salary) {
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