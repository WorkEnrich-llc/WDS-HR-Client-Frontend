import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Contract } from '../../../../../../../../core/interfaces/contract';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  standalone: true,
  selector: 'app-contract-form-modal',
  imports: [FormsModule, ReactiveFormsModule, OverlayFilterBoxComponent],
  templateUrl: './contract-form-modal.component.html',
  styleUrl: './contract-form-modal.component.css'
})
export class ContractFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() isEditMode = false;
  @Input() contract: Contract | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  contractForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contractForm = this.fb.group({
      salary: [null, [Validators.required, Validators.min(0)]],
      startDate: [null, Validators.required],
      withEndDate: [true],
      endDate: [null]
    });

    // Watch for changes in withEndDate to control endDate validation
    this.contractForm.get('withEndDate')?.valueChanges.subscribe(value => {
      const endDateControl = this.contractForm.get('endDate');
      if (value) {
        endDateControl?.setValidators([Validators.required]);
      } else {
        endDateControl?.clearValidators();
        endDateControl?.setValue(null);
      }
      endDateControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contract'] && this.contract && this.isEditMode) {
      this.populateForm();
    } else if (changes['isOpen'] && this.isOpen && !this.isEditMode) {
      this.resetForm();
    }
  }

  private populateForm(): void {
    if (!this.contract) return;

    // Format dates for form inputs (convert from display format to ISO format)
    const formattedStartDate = this.convertDisplayDateToFormDate(this.contract.startDate);
    const formattedEndDate = this.contract.endDate ? this.convertDisplayDateToFormDate(this.contract.endDate) : null;
    const hasEndDate = !!this.contract.endDate;

    this.contractForm.patchValue({
      salary: this.contract.salary,
      startDate: formattedStartDate,
      withEndDate: hasEndDate,
      endDate: formattedEndDate
    });
  }

  private resetForm(): void {
    this.contractForm.reset({
      salary: null,
      startDate: null,
      withEndDate: true,
      endDate: null
    });
  }

  closeModal(): void {
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
    const contractData = {
      salary: formValue.salary,
      startDate: this.convertFormDateToDisplayDate(formValue.startDate),
      endDate: formValue.withEndDate ? this.convertFormDateToDisplayDate(formValue.endDate) : '',
      isEdit: this.isEditMode,
      contractId: this.contract?.id
    };

    this.onSave.emit(contractData);
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
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
    }
    return '';
  }

  getModalTitle(): string {
    return this.isEditMode ? 'Edit Contract' : 'New Contract';
  }

  getSaveButtonText(): string {
    return this.isEditMode ? 'Update Contract' : 'Save Contract';
  }

  getSalaryLabel(): string {
    return this.isEditMode ? 'Edit Salary' : 'New Salary';
  }
}
