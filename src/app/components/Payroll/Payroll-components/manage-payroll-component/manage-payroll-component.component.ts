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
  defaultValuePlaceholder: string = 'Enter Value';
  previousValidValue: number | null = null;



  constructor() { }

  ngOnInit(): void {
    this.initFormModel();
    this.loadSalaryPortions();
    this.checkModeAndLoadData();
    this.createPayrollForm.get('calculation')?.valueChanges.subscribe(value => {
      const portionControl = this.createPayrollForm.get('portion');
      const valueControl = this.createPayrollForm.get('value');
      const calcValue = +value;

      // Reset previous valid value when calculation type changes
      if (valueControl && valueControl.value !== null && valueControl.value !== '') {
        this.previousValidValue = +valueControl.value;
      } else {
        this.previousValidValue = null;
      }

      if (calcValue === 1) { // RawValue
        portionControl?.setValue(0);
        portionControl?.disable();
        portionControl?.clearValidators();
        // Default Value: no max validation, placeholder "enter value"
        this.defaultValuePlaceholder = 'Enter Value';
        valueControl?.clearValidators();
        valueControl?.setValidators([Validators.min(0)]);
      } else if (calcValue === 2) { // Days
        portionControl?.enable();
        portionControl?.setValidators([Validators.required]);
        portionControl?.reset();
        // Default Value: max 31, placeholder "enter days"
        this.defaultValuePlaceholder = 'Enter Days';
        valueControl?.clearValidators();
        valueControl?.setValidators([Validators.min(0), Validators.max(31)]);
      } else if (calcValue === 3) { // Percentage
        portionControl?.enable();
        portionControl?.setValidators([Validators.required]);
        // Default Value: max 100, placeholder "enter percentage"
        this.defaultValuePlaceholder = 'Enter Percentage';
        valueControl?.clearValidators();
        valueControl?.setValidators([Validators.min(0), Validators.max(100)]);
      }
      portionControl?.updateValueAndValidity();
      valueControl?.updateValueAndValidity();
    });

    // Track previous valid value when value control changes
    this.createPayrollForm.get('value')?.valueChanges.subscribe(newValue => {
      if (newValue !== null && newValue !== '' && !isNaN(+newValue)) {
        const maxValue = this.getMaxValue();
        const numValue = +newValue;
        if (maxValue === null || numValue <= maxValue) {
          this.previousValidValue = numValue;
        }
      }
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

          // After patching, handle the calculation logic for portion and value fields
          const calcValue = +calculationId;
          const portionControl = this.createPayrollForm.get('portion');
          const valueControl = this.createPayrollForm.get('value');

          // Initialize previous valid value with existing value if it exists
          this.previousValidValue = data.value !== null && data.value !== undefined ? +data.value : null;

          if (calcValue === 1) { // RawValue
            portionControl?.setValue(0, { emitEvent: false });
            portionControl?.disable({ emitEvent: false });
            portionControl?.clearValidators();
            portionControl?.updateValueAndValidity({ emitEvent: false });
            this.defaultValuePlaceholder = 'Enter Value';
            valueControl?.clearValidators();
            valueControl?.setValidators([Validators.min(0)]);
            valueControl?.updateValueAndValidity({ emitEvent: false });
          } else if (calcValue === 2) { // Days
            portionControl?.enable({ emitEvent: false });
            portionControl?.setValidators([Validators.required]);
            portionControl?.updateValueAndValidity({ emitEvent: false });
            this.defaultValuePlaceholder = 'Enter Days';
            valueControl?.clearValidators();
            valueControl?.setValidators([Validators.min(0), Validators.max(31)]);
            valueControl?.updateValueAndValidity({ emitEvent: false });
          } else if (calcValue === 3) { // Percentage
            portionControl?.enable({ emitEvent: false });
            portionControl?.setValidators([Validators.required]);
            portionControl?.updateValueAndValidity({ emitEvent: false });
            this.defaultValuePlaceholder = 'Enter Percentage';
            valueControl?.clearValidators();
            valueControl?.setValidators([Validators.min(0), Validators.max(100)]);
            valueControl?.updateValueAndValidity({ emitEvent: false });
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

  getMaxValue(): number | null {
    const calcValue = +this.createPayrollForm.get('calculation')?.value;
    if (calcValue === 2) { // Days
      return 31;
    } else if (calcValue === 3) { // Percentage
      return 100;
    }
    return null; // No max for raw value
  }

  onValueInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();

    // Allow empty input (for clearing the field)
    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      this.previousValidValue = null;
      return;
    }

    const value = parseFloat(inputValue);
    const maxValue = this.getMaxValue();

    // If value is invalid or exceeds max, revert to previous valid value
    if (isNaN(value) || (maxValue !== null && value > maxValue)) {
      // Revert to previous valid value if it exists, otherwise clear the input
      setTimeout(() => {
        if (this.previousValidValue !== null) {
          input.value = this.previousValidValue.toString();
          this.createPayrollForm.get('value')?.setValue(this.previousValidValue, { emitEvent: false });
        } else {
          input.value = '';
          this.createPayrollForm.get('value')?.setValue(null, { emitEvent: false });
        }
      }, 0);
    } else {
      // Value is valid, store it as the previous valid value
      this.previousValidValue = value;
    }
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
