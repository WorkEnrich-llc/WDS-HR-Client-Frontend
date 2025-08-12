import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CLASSIFICATIONS, COMPONENT_TYPES } from '@app/constants';
import { PayrollComponent } from 'app/core/models/payroll';
import { PayrollComponentsService } from 'app/core/services/payroll/payroll-components/payroll-components.service';
import { firstValueFrom } from 'rxjs';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-create-payroll-component',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule],
  templateUrl: './create-payroll-component.component.html',
  styleUrl: './create-payroll-component.component.css'
})
export class CreatePayrollComponentComponent implements OnInit {

  public createPayrollForm!: FormGroup;
  private fb = inject(FormBuilder);
  private payrollService = inject(PayrollComponentsService);
  private toasterService = inject(ToasterMessageService);
  private router = inject(Router);

  classifications = CLASSIFICATIONS;
  componentTypes = COMPONENT_TYPES
  isSubmitting = false;
  constructor() { }

  ngOnInit(): void {
    this.initFormModel();

  }
  // discard popup
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/payroll-components/all-payroll-components']);
  }


  private initFormModel(): void {
    this.createPayrollForm = this.fb.group({
      componentCode: [''],
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      classification: ['', [Validators.required]],
      shownInPayslip: [false]
    });
  }

  createsComponent(): void {
    if (!this.createPayrollForm.valid) {
      this.createPayrollForm.markAllAsTouched();
      return;
    }
    if (this.createPayrollForm.valid) {
      const formData: PayrollComponent = {
        ...this.createPayrollForm.value,
        type: +this.createPayrollForm.value.type,
        classification: +this.createPayrollForm.value.classification
      };
      console.log('Form Submitted', formData);
      this.confirmAction();

      this.payrollService.createComponent(formData).subscribe({
        next: (response) => {
          console.log('Component created successfully:', response);
          this.router.navigate(['/payroll-components/all-payroll-components']);
        },
        error: (err) => {
          console.error('Error creating component:', err);
        }
      });

    }

  }

  async createComponent(): Promise<void> {
    if (this.createPayrollForm.invalid) {
      this.createPayrollForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const formValues = this.createPayrollForm.value;
    const formData: PayrollComponent = {
      ...formValues,
      type: +formValues.type,
      classification: +formValues.classification
    };

    try {
      await firstValueFrom(this.payrollService.createComponent(formData));
      this.toasterService.showSuccess('Component created successfully');
      this.router.navigate(['/payroll-components/all-payroll-components']);
    } catch (err) {
      console.error('Create component failed', err);
    } finally {
      this.isSubmitting = false;
    }
  }


}
