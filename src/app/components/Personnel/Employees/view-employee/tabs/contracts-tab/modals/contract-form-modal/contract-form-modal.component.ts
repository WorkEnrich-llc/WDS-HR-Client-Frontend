import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Contract } from '../../../../../../../../core/interfaces/contract';
import { Employee } from '../../../../../../../../core/interfaces/employee';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  standalone: true,
  selector: 'app-contract-form-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, OverlayFilterBoxComponent],
  templateUrl: './contract-form-modal.component.html',
  styleUrl: './contract-form-modal.component.css'
})
export class ContractFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() isEditMode = false;
  @Input() isSaving = false;
  @Input() isLoading = false;
  @Input() contract: Contract | null = null;
  @Input() employee: Employee | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();


  contractForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contractForm = this.fb.group({
      adjustmentType: [1], // 1- Appraisal, 2- Correction, 3- Raise (only for edit mode)
      salary: [null, [Validators.required, Validators.min(0), Validators.max(1000000)]],
      startDate: [null, Validators.required],
      withEndDate: [false], // checkbox for new contracts
      endDate: [null], // conditional field
      noticePeriod: [null, [Validators.required, Validators.min(1)]] // notice period in days
    });
  }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contract'] && this.contract && this.isEditMode) {
      this.populateForm();
    }
    // if (changes['contract'] && this.contract && this.isEditMode) {
    //   this.populateForm();
    // } else if (changes['isOpen'] && this.isOpen && !this.isEditMode) {
    //   this.resetForm();
    // }

    // Set up conditional validation for end date
    this.setupConditionalValidation();

    // Set up salary range validation when employee data changes
    if (changes['employee'] && this.employee) {
      this.setupSalaryValidation();
    }
  }

  private setupConditionalValidation(): void {
    const withEndDateControl = this.contractForm.get('withEndDate');
    const endDateControl = this.contractForm.get('endDate');

    if (withEndDateControl && endDateControl) {
      withEndDateControl.valueChanges.subscribe(withEndDate => {
        if (withEndDate) {
          endDateControl.setValidators([Validators.required]);
        } else {
          endDateControl.clearValidators();
          endDateControl.setValue(null);
        }
        endDateControl.updateValueAndValidity();
      });
    }
  }

  private setupSalaryValidation(): void {
    const salaryControl = this.contractForm.get('salary');
    if (salaryControl && this.shouldShowSalaryRanges()) {
      const ranges = this.getSalaryRanges();
      if (ranges) {
        const minSalary = parseFloat(ranges.minimum);
        const maxSalary = parseFloat(ranges.maximum);

        salaryControl.setValidators([
          Validators.required,
          Validators.min(minSalary),
          Validators.max(maxSalary)
        ]);
        salaryControl.updateValueAndValidity();
      }
    }
  }

  private populateForm(): void {
    if (!this.contract) return;
    // Convert display date (DD/MM/YYYY) to form date (YYYY-MM-DD)
    const formattedStartDate = this.contract.start_contract ? this.convertDisplayDateToFormDate(this.contract.start_contract) : '';
    const formattedEndDate = this.contract.end_contract ? this.convertDisplayDateToFormDate(this.contract.end_contract) : '';
    this.contractForm.patchValue({
      adjustmentType: this.contract.adjustmentType || 1,
      withEndDate: this.contract.end_contract ? true : false,
      salary: this.contract.salary,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      noticePeriod: this.contract.notice_period
    });

    // Set up salary validation after populating
    this.setupSalaryValidation();
  }

  resetForm(): void {
    if (this.contract) {
      const formattedStartDate = this.contract.startDate ? this.convertDisplayDateToFormDate(this.contract.startDate) : '';
      const formattedEndDate = this.contract.endDate ? this.convertDisplayDateToFormDate(this.contract.endDate) : null;
      this.contractForm.patchValue({
        adjustmentType: 1,
        withEndDate: this.contract.end_contract ? true : false,
        salary: this.contract.salary,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        noticePeriod: this.contract.notice_period
      });

    } else {
      this.contractForm.reset({
        adjustmentType: 1,
        salary: null,
        startDate: null,
        withEndDate: false,
        endDate: null,
        noticePeriod: 0
      });
    }


    // Set up salary validation after reset
    this.setupSalaryValidation();
  }

  closeModal(): void {
    this.resetForm();
    this.onClose.emit();
  }

  saveContract(): void {
    if (this.contractForm.invalid) {
      Object.keys(this.contractForm.controls).forEach(key => {
        this.contractForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.contractForm.value;

    if (this.isEditMode) {
      // For edit mode (adjustment)
      const contractData = {
        adjustmentType: formValue.adjustmentType,
        salary: formValue.salary,
        startDate: formValue.startDate,
        endDate: formValue.withEndDate ? formValue.endDate : null,
        noticePeriod: formValue.noticePeriod,
        isEdit: true,
        contractId: this.contract?.id
      };
      this.onSave.emit(contractData);
    } else {
      // For new contract
      const contractData = {
        salary: formValue.salary,
        startDate: formValue.startDate,
        endDate: formValue.withEndDate ? formValue.endDate : null,
        withEndDate: formValue.withEndDate,
        noticePeriod: formValue.noticePeriod,
        isEdit: false
      };
      this.onSave.emit(contractData);
    }
  }

  // Helper method to convert display date (DD/MM/YYYY) to form date (YYYY-MM-DD)
  private convertDisplayDateToFormDate(displayDate: string): string {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return displayDate;
  }

  // Helper method to convert form date (YYYY-MM-DD) to display date (DD/MM/YYYY)
  private convertFormDateToDisplayDate(formDate: string): string {
    if (!formDate) return '';
    const date = new Date(formDate);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Form validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contractForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.contractForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;

      if (fieldName === 'salary') {
        if (field.errors['min']) {
          if (this.shouldShowSalaryRanges()) {
            const ranges = this.getSalaryRanges()!;
            return `Salary must be at least ${ranges.minimum} ${ranges.currency}`;
          }
          return 'Salary must be greater than 0';
        }
        if (field.errors['max']) {
          if (this.shouldShowSalaryRanges()) {
            const ranges = this.getSalaryRanges()!;
            return `Salary cannot exceed ${ranges.maximum} ${ranges.currency}`;
          }
        }
      } else if (field.errors['min']) {
        return `${fieldName} must be greater than 0`;
      }
    }
    return '';
  }

  getModalTitle(): string {
    return this.isEditMode ? 'Contract Adjustment' : 'New Contract';
  }

  getSaveButtonText(): string {
    return this.isEditMode ? 'Save Adjustment' : 'Save Contract';
  }

  getSalaryLabel(): string {
    return this.isEditMode ? 'New Salary' : 'New Salary';
  }


  // Get salary ranges based on employment type
  getSalaryRanges(): { minimum: string; maximum: string; currency: string } | null {
    if (!this.employee?.job_info?.job_title?.salary_ranges || !this.employee?.job_info?.employment_type) {
      return null;
    }

    const employmentTypeName = this.employee.job_info.employment_type.name.toLowerCase();
    const salaryRanges = this.employee.job_info.job_title.salary_ranges;

    if (employmentTypeName === 'full time' && salaryRanges.full_time?.status && salaryRanges.full_time.restrict) {
      return {
        minimum: salaryRanges.full_time.minimum,
        maximum: salaryRanges.full_time.maximum,
        currency: salaryRanges.full_time.currency
      };
    } else if (employmentTypeName === 'part time' && salaryRanges.part_time?.status && salaryRanges.part_time.restrict) {
      return {
        minimum: salaryRanges.part_time.minimum,
        maximum: salaryRanges.part_time.maximum,
        currency: salaryRanges.part_time.currency
      };
    } else if (employmentTypeName === 'per hour' && salaryRanges.per_hour?.status && salaryRanges.per_hour.restrict) {
      return {
        minimum: salaryRanges.per_hour.minimum,
        maximum: salaryRanges.per_hour.maximum,
        currency: salaryRanges.per_hour.currency
      };
    }

    return null;
  }

  // Check if salary ranges should be displayed
  shouldShowSalaryRanges(): boolean {
    return this.getSalaryRanges() !== null;
  }
}
