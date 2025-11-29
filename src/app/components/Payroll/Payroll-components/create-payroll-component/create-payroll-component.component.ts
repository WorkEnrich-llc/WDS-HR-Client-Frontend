import { calculation } from './../../../../core/enums/index';
import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CLASSIFICATIONS, COMPONENT_TYPES } from '@app/constants';
import { PayrollComponent } from 'app/core/models/payroll';
import { PayrollComponentsService } from 'app/core/services/payroll/payroll-components/payroll-components.service';
import { firstValueFrom } from 'rxjs';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';
import { KeyValue } from '@angular/common';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

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
  private salaryPortionService = inject(SalaryPortionsService);
  private toasterService = inject(ToasterMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private paginationState = inject(PaginationStateService);

  classifications = CLASSIFICATIONS;
  componentTypes = COMPONENT_TYPES
  isSubmitting = false;
  isEditMode = false;
  id?: number;
  salaryPortions: any[] = [];
  calculations: Array<KeyValue<number, string>> = calculation;
  createDate: string = '';
  updatedDate: string = '';



  constructor() { }

  ngOnInit(): void {
    this.initFormModel();
    this.loadSalaryPortions();
    this.checkModeAndLoadData();
    this.createPayrollForm.get('calculation')?.valueChanges.subscribe(value => {
      const portionControl = this.createPayrollForm.get('portion');
      const calcValue = +value;
      if (calcValue === 1) { // RawValue
        portionControl?.setValue(0);
        portionControl?.disable();
        portionControl?.clearValidators();
      } else if (calcValue === 2) { // Days
        portionControl?.enable();
        portionControl?.setValidators([Validators.required]);
        portionControl?.reset();
      }
      portionControl?.updateValueAndValidity();
    });

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
    const currentPage = this.paginationState.getPage('payroll-components/all-payroll-components');
    this.router.navigate(['/payroll-components/all-payroll-components'], { queryParams: { page: currentPage } });
  }


  private initFormModel(): void {
    this.createPayrollForm = this.fb.group({
      code: [''],
      name: ['', [Validators.required]],
      component_type: ['', [Validators.required]],
      classification: ['', [Validators.required]],
      portion: [''],
      calculation: ['', [Validators.required]],
      show_in_payslip: [false]
    });
  }

  private checkModeAndLoadData(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.id;

    if (this.isEditMode) {
      this.payrollService.getComponentById(this.id).subscribe({
        next: (data) => {
          this.createPayrollForm.patchValue({
            code: data.code,
            name: data.name,
            component_type: data.component_type.id,
            classification: data.classification.id,
            portion: data.portion?.index ?? '',
            calculation: data.calculation?.key ?? '',
            show_in_payslip: data.show_in_payslip
          });
          this.createDate = new Date(data.created_at).toLocaleDateString('en-GB');
          this.updatedDate = new Date(data.updated_at).toLocaleDateString('en-GB');
        },
        error: (err) => console.error('Failed to load component', err)
      });
    }
    else {
      const today = new Date().toLocaleDateString('en-GB');
      this.createDate = today;
    }
  }

  private loadSalaryPortions(): void {
    this.salaryPortionService.single().subscribe({
      next: (data) => {
        this.salaryPortions = data.settings
      },
      error: (err) => console.error('Failed to load single salary portion', err)
    });
  }

  async createComponent(): Promise<void> {
    if (this.createPayrollForm.invalid) {
      this.createPayrollForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const formValues = this.createPayrollForm.value;
    const formData: PayrollComponent = {
      ...this.createPayrollForm.value,
      component_type: +formValues.component_type,
      classification: +formValues.classification,
      portion: +formValues.portion,
      calculation: +formValues.calculation
    };
    if (this.isEditMode && this.id) {
      formData.id = String(this.id);
    }
    try {
      if (this.isEditMode) {
        await firstValueFrom(this.payrollService.updateComponent(formData));
        this.toasterService.showSuccess('Component updated successfully',"Updated Successfully");
      } else {
        await firstValueFrom(this.payrollService.createComponent(formData));
        this.toasterService.showSuccess('Component created successfully',"Creates Successfully");
      }
      this.router.navigate(['/payroll-components/all-payroll-components']);
    } catch (err) {
      console.error('Create component failed', err);
    } finally {
      this.isSubmitting = false;
    }
  }






}
