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
  savedPortionValue: number | null = null; // Store portion value from component details



  constructor() { }

  ngOnInit(): void {
    this.initFormModel();
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
          const portionValue = data.salary_portion ?? data.portion?.index ?? null;

          // Store component name for header display
          this.componentName = data.name || '';

          // Store the portion value to set it after salary portions are loaded
          this.savedPortionValue = portionValue !== null && portionValue !== undefined ? +portionValue : null;

          this.createPayrollForm.patchValue({
            code: data.code,
            name: data.name,
            component_type: data.component_type.id,
            classification: data.classification.id,
            calculation: calculationId,
            value: data.value,
            show_in_payslip: data.show_in_payslip
          });

          // After patching, handle the calculation logic for portion and value fields
          const calcValue = +calculationId;
          const portionControl = this.createPayrollForm.get('portion');
          const valueControl = this.createPayrollForm.get('value');

          // Initialize previous valid value with existing value if it exists
          this.previousValidValue = data.value !== null && data.value !== undefined ? +data.value : null;

          if (calcValue === 1) { // RawValue
            // For RawValue, portion is always 0 and disabled
            portionControl?.setValue(0, { emitEvent: false });
            portionControl?.disable({ emitEvent: false });
            portionControl?.clearValidators();
            portionControl?.updateValueAndValidity({ emitEvent: false });
            this.defaultValuePlaceholder = 'Enter Value';
            valueControl?.clearValidators();
            valueControl?.setValidators([Validators.min(0)]);
            valueControl?.updateValueAndValidity({ emitEvent: false });
            // Clear saved portion value since RawValue always uses 0
            this.savedPortionValue = null;
          } else if (calcValue === 2) { // Days
            portionControl?.enable({ emitEvent: false });
            portionControl?.setValidators([Validators.required]);
            portionControl?.updateValueAndValidity({ emitEvent: false });
            this.defaultValuePlaceholder = 'Enter Days';
            valueControl?.clearValidators();
            valueControl?.setValidators([Validators.min(0), Validators.max(31)]);
            valueControl?.updateValueAndValidity({ emitEvent: false });
            // Portion value will be set after salary portions are loaded
          } else if (calcValue === 3) { // Percentage
            portionControl?.enable({ emitEvent: false });
            portionControl?.setValidators([Validators.required]);
            portionControl?.updateValueAndValidity({ emitEvent: false });
            this.defaultValuePlaceholder = 'Enter Percentage';
            valueControl?.clearValidators();
            valueControl?.setValidators([Validators.min(0), Validators.max(100)]);
            valueControl?.updateValueAndValidity({ emitEvent: false });
            // Portion value will be set after salary portions are loaded
          }

          this.createDate = new Date(data.created_at).toLocaleDateString('en-GB');
          this.updatedDate = new Date(data.updated_at).toLocaleDateString('en-GB');
          this.isLoading = false;

          // Load salary portions AFTER component details are loaded
          this.loadSalaryPortions();
        },
        error: (err) => {
          console.error('Failed to load component', err);
          this.isLoading = false;
          // Still load salary portions even if component details failed
          this.loadSalaryPortions();
        }
      });
    }
    else {
      const today = new Date().toLocaleDateString('en-GB');
      this.createDate = today;
      // In create mode, load salary portions immediately (no component details to wait for)
      this.loadSalaryPortions();
    }
  }

  private loadSalaryPortions(): void {
    this.salaryPortionService.single({ request_in: 'payroll-components' }).subscribe({
      next: (data) => {
        this.salaryPortions = data.settings;

        // If in edit mode and we have a saved portion value, set it after salary portions are loaded
        if (this.isEditMode && this.savedPortionValue !== null && this.savedPortionValue !== undefined) {
          const portionControl = this.createPayrollForm.get('portion');
          const calcValue = +this.createPayrollForm.get('calculation')?.value;

          // Only set the portion value if calculation type is not RawValue (calcValue !== 1)
          // For RawValue, portion is already set to 0 and disabled
          if (calcValue !== 1) {
            // Check if the saved portion value exists in the loaded salary portions
            const portionExists = this.salaryPortions.some((p: any) => p.index === this.savedPortionValue);
            if (portionExists) {
              portionControl?.setValue(this.savedPortionValue, { emitEvent: false });
            } else if (this.salaryPortions.length > 0) {
              // If saved value doesn't exist, set to empty or first available
              portionControl?.setValue('', { emitEvent: false });
            }
          }
        }
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
    const valueControl = this.createPayrollForm.get('value');

    // Allow empty input (for clearing the field)
    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      this.previousValidValue = null;
      return;
    }

    const value = parseFloat(inputValue);

    // Only prevent invalid numeric input (NaN), but allow values exceeding max
    // The max validator will handle showing the error message
    if (isNaN(value)) {
      // Revert to previous valid value if it exists, otherwise clear the input
      setTimeout(() => {
        if (this.previousValidValue !== null) {
          input.value = this.previousValidValue.toString();
          valueControl?.setValue(this.previousValidValue, { emitEvent: false });
        } else {
          input.value = '';
          valueControl?.setValue(null, { emitEvent: false });
        }
      }, 0);
    } else {
      // Value is a valid number, allow it even if it exceeds max
      // Update the form control value and let the validator handle max validation
      valueControl?.setValue(value, { emitEvent: true });

      // Mark as touched if value exceeds max to show validation message immediately
      const maxValue = this.getMaxValue();
      if (maxValue !== null && value > maxValue) {
        valueControl?.markAsTouched();
      }

      // Only store as previous valid value if it doesn't exceed max
      if (maxValue === null || value <= maxValue) {
        this.previousValidValue = value;
      }
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
