import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';


import { Contract } from '../../../../../../../../core/interfaces/contract';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';
import { Subscription } from 'rxjs';

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

export function dateConstraintValidator(minDateStr?: string, maxDateStr?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const inputVal = control.value.toString();

    if (minDateStr && inputVal < minDateStr) {
      return { minDate: { required: minDateStr, actual: inputVal } };
    }

    if (maxDateStr && inputVal > maxDateStr) {
      return { maxDate: { required: maxDateStr, actual: inputVal } };
    }

    return null;
  };
}
@Component({
  standalone: true,
  selector: 'app-contract-resign-modal',
  imports: [ReactiveFormsModule, OverlayFilterBoxComponent],
  templateUrl: './contract-resign-modal.component.html',
  styleUrl: './contract-resign-modal.component.css'
})
export class ContractResignModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onResign = new EventEmitter<{ contract: Contract, resignationData: any }>();

  resignForm: FormGroup;

  todayStr: string = '';
  contractEndStr: string | null = null;
  contractStartStr: string = '';

  minResignDate: string = '';
  maxResignDate: string = '';
  minLastDay: string = '';
  maxLastDay: string = '';

  private sub: Subscription = new Subscription();

  constructor(private fb: FormBuilder) {
    this.resignForm = this.fb.group({
      resignDate: ['', Validators.required],
      lastDay: ['', Validators.required],
      reason: ['', [Validators.required, noWhitespaceValidator()]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue && this.contract) {
      this.initializeForm();
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private initializeForm(): void {

    const today = new Date();
    this.todayStr = this.formatDate(today);
    this.contractStartStr = this.contract?.startDate ? this.formatDate(this.contract.start_contract) : '';
    this.contractEndStr = this.contract?.endDate ? this.formatDate(this.contract.end_contract) : null;

    this.minResignDate = this.todayStr;
    this.maxResignDate = this.contractEndStr || '';

    this.resignForm.get('resignDate')?.setValidators([
      Validators.required,
      dateConstraintValidator(this.minResignDate, this.maxResignDate || undefined)
    ]);

    this.setupResignDateListener();

    this.resignForm.patchValue({
      resignDate: '',
      lastDay: '',
      reason: ''
    });

    this.resignForm.markAsUntouched();
    this.resignForm.updateValueAndValidity();
  }

  private setupResignDateListener() {
    this.sub.unsubscribe();

    this.sub = this.resignForm.get('resignDate')!.valueChanges.subscribe(resignDateValue => {
      if (!resignDateValue) return;

      let potentialMin = resignDateValue;

      if (this.contractStartStr && resignDateValue < this.contractStartStr) {
        potentialMin = this.contractStartStr;
      }

      this.minLastDay = potentialMin;
      this.maxLastDay = this.contractEndStr || '';

      const lastDayControl = this.resignForm.get('lastDay');

      if (lastDayControl) {
        lastDayControl.clearValidators();
        lastDayControl.setValidators([
          Validators.required,
          dateConstraintValidator(this.minLastDay, this.maxLastDay || undefined)
        ]);

        lastDayControl.updateValueAndValidity();
      }
    });
  }

  confirmResign(): void {
    if (this.resignForm.invalid) {
      this.resignForm.markAllAsTouched();
      return;
    }
    if (!this.contract) return;

    this.onResign.emit({ contract: this.contract, resignationData: this.resignForm.value });
    this.closeModal();
  }

  closeModal(): void {
    this.resignForm.reset();
    this.onClose.emit();
  }

  // Helper formatting function 'YYYY-MM-DD'


  getContractNumber(): string {
    return this.contract?.contractNumber || '';
  }

  // Helper method to format date for display
  formatDateForInput(dateOrString: Date | string): string {
    if (!dateOrString) return '';
    const date = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  }

  private formatDate(dateInput: string | Date): string {
    if (!dateInput) return '';

    let dateStr = '';

    if (dateInput instanceof Date) {
      dateStr = dateInput.toISOString();
    } else {
      dateStr = dateInput.toString();
    }

    return dateStr.split('T')[0];
  }


}
