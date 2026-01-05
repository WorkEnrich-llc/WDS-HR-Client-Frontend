import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';


import { Contract } from '../../../../../../../../core/interfaces/contract';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';

export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || control.value.length === 0) {
      return null;
    }
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;

    return isValid ? null : { 'whitespace': true };
  };
}

@Component({
  standalone: true,
  selector: 'app-contract-terminate-modal',
  imports: [ReactiveFormsModule, OverlayFilterBoxComponent],
  templateUrl: './contract-terminate-modal.component.html',
  styleUrl: './contract-terminate-modal.component.css'
})
export class ContractTerminateModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onTerminate = new EventEmitter<{ contract: Contract, terminationData: any }>();
  minDate: string = '';

  terminateForm: FormGroup;
  private internalContract: Contract | null = null;
  constructor(private fb: FormBuilder) {
    // this.calculateMinDate();
    this.terminateForm = this.fb.group({
      lastDay: ['', [Validators.required]],
      reason: ['', [Validators.required, noWhitespaceValidator()]]
    });

  }



  ngOnChanges(changes: SimpleChanges): void {

    if (changes['contract'] && changes['contract'].currentValue) {
      this.internalContract = changes['contract'].currentValue;

      if (this.internalContract?.startDate) {
        this.calculateMinDate(this.internalContract.start_contract);

        this.updateLastDayValidator();
      }
    }

    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      const defaultDate = (formattedDate < this.minDate) ? this.minDate : formattedDate;
      this.terminateForm.reset({
        lastDay: defaultDate,
        reason: ''
      });
    }
  }

  calculateMinDate(contractStartDateStr: string | Date) {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    const contractStartDate = new Date(contractStartDateStr);
    contractStartDate.setHours(0, 0, 0, 0);

    let selectedDate: Date;

    if (contractStartDate > startOfCurrentMonth) {
      selectedDate = contractStartDate;
    } else {
      selectedDate = startOfCurrentMonth;
    }

    this.minDate = this.formatDateToISO(selectedDate);

  }

  formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateLastDayValidator() {
    const lastDayControl = this.terminateForm.get('lastDay');
    if (lastDayControl) {
      lastDayControl.setValidators([
        Validators.required,
        this.minDateValidator(this.minDate)
      ]);
      lastDayControl.updateValueAndValidity();
    }
  }

  minDateValidator(minDateStr: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      if (control.value < minDateStr) {
        return { useMinDate: true };
      }

      return null;
    };
  }



  closeModal(): void {
    this.terminateForm.reset();
    this.onClose.emit();
  }

  confirmTerminate(): void {

    if (this.terminateForm.valid && this.internalContract) {
      const terminationData = {
        lastDay: this.terminateForm.value.lastDay,
        reason: this.terminateForm.value.reason
      };

      this.onTerminate.emit({
        contract: this.internalContract,
        terminationData: terminationData
      });

      this.closeModal();
    } else {
      this.terminateForm.markAllAsTouched();
    }
  }




  getContractNumber(): string {
    return this.contract?.contractNumber || '';
  }

  // Helper method to format date for display
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
}
