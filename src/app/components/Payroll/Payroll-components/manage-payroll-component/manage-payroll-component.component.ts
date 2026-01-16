import { calculation } from './../../../../core/enums/index';
import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CLASSIFICATIONS, COMPONENT_TYPES } from '@app/constants';
import { PAYROLL_COMPONENT_STATUS } from 'app/core/constants/payroll-component-status.constants';
import { PayrollComponent } from 'app/core/models/payroll';
import { PayrollComponentsService } from 'app/core/services/payroll/payroll-components/payroll-components.service';
import { firstValueFrom } from 'rxjs';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';
import { KeyValue } from '@angular/common';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-manage-payroll-component',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule],
  templateUrl: './manage-payroll-component.component.html',
  styleUrl: './manage-payroll-component.component.css'
})
export class ManagePayrollComponentComponent implements OnInit {

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
  isLoading = false;
  id?: number;
  componentName: string = '';
  salaryPortions: any[] = [];
  calculations: Array<KeyValue<number, string>> = calculation;
  createDate: string = '';
  updatedDate: string = '';
  payrollComponentStatus = PAYROLL_COMPONENT_STATUS;



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
      } else if (calcValue === 3) { // Percentage
        portionControl?.enable();
        portionControl?.setValidators([Validators.required]);
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
      component_status: [1, [Validators.required]],
      component_type: ['', [Validators.required]],
      classification: ['', [Validators.required]],
      calculation: ['', [Validators.required]],
      portion: [''],
      value: [null, [Validators.min(0)]],
      show_in_payslip: [false]
    });
  }

  private checkModeAndLoadData(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.id;

    if (this.isEditMode) {
      this.isLoading = true;
      this.payrollService.getComponentById(this.id).subscribe({
        next: (data) => {
          const calculationId = data.calculation?.id ?? '';
          const portionValue = data.salary_portion ?? data.portion?.index ?? '';

          // Store component name for header display
          this.componentName = data.name || '';

          this.createPayrollForm.patchValue({
            code: data.code,
            name: data.name,
            component_type: data.component_type.id,
            classification: data.classification.id,
            portion: data.salary_portion ?? data.portion?.index ?? '',
            calculation: calculationId,
            value: data.value,
            show_in_payslip: data.show_in_payslip
          });

          // Ensure salary portion is set after salaryPortions are loaded
          setTimeout(() => {
            this.createPayrollForm.patchValue({
              portion: data.salary_portion ?? data.portion?.index ?? ''
            });
          }, 0);

          // After patching, handle the calculation logic for portion field
          const calcValue = +calculationId;
          const portionControl = this.createPayrollForm.get('portion');
          if (calcValue === 1) { // RawValue
            portionControl?.setValue(0, { emitEvent: false });
            portionControl?.disable({ emitEvent: false });
            portionControl?.clearValidators();
            portionControl?.updateValueAndValidity({ emitEvent: false });
          } else if (calcValue === 2) { // Days
            portionControl?.enable({ emitEvent: false });
            portionControl?.setValidators([Validators.required]);
            portionControl?.updateValueAndValidity({ emitEvent: false });
          } else if (calcValue === 3) { // Percentage
            portionControl?.enable({ emitEvent: false });
            portionControl?.setValidators([Validators.required]);
            portionControl?.updateValueAndValidity({ emitEvent: false });
          }

          this.createDate = new Date(data.created_at).toLocaleDateString('en-GB');
          this.updatedDate = new Date(data.updated_at).toLocaleDateString('en-GB');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load component', err);
          this.isLoading = false;
        }
      });
    }
    else {
      const today = new Date().toLocaleDateString('en-GB');
      this.createDate = today;
    }
  }

  private loadSalaryPortions(): void {
    this.salaryPortionService.single({ request_in: 'payroll-components' }).subscribe({
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
    const formData: any = {
      ...this.createPayrollForm.value,
      component_status: +formValues.component_status,
      component_type: +formValues.component_type,
      classification: +formValues.classification,
      portion: +formValues.portion,
      calculation: +formValues.calculation,
      value: +formValues.value
    };
    if (this.isEditMode && this.id) {
      formData.id = String(this.id);
    }
    try {
      if (this.isEditMode) {
        await firstValueFrom(this.payrollService.updateComponent(formData));
        this.toasterService.showSuccess('Component updated successfully', "Updated Successfully");
      } else {
        await firstValueFrom(this.payrollService.createComponent(formData));
        this.toasterService.showSuccess('Component created successfully', "Creates Successfully");
      }
      this.router.navigate(['/payroll-components/all-payroll-components']);
    } catch (err) {
      console.error('Create component failed', err);
    } finally {
      this.isSubmitting = false;
    }
  }




}
