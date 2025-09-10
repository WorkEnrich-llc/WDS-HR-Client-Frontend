import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Contract } from '../../../../../../../../core/interfaces/contract';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  standalone: true,
  selector: 'app-contract-resign-modal',
  imports: [ReactiveFormsModule, CommonModule, OverlayFilterBoxComponent],
  templateUrl: './contract-resign-modal.component.html',
  styleUrl: './contract-resign-modal.component.css'
})
export class ContractResignModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onResign = new EventEmitter<{contract: Contract, resignationData: any}>();

  resignForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.resignForm = this.fb.group({
      resignDate: ['', Validators.required],
      noticePeriod: [60], // Default 60 days
      lastDay: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  ngOnChanges(): void {
    if (this.isOpen && this.contract) {
      // Set default resign date to today
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      // Calculate last day (resign date + notice period)
      const lastDay = new Date(today);
      lastDay.setDate(lastDay.getDate() + 60); // Default 60 days notice
      const formattedLastDay = lastDay.toISOString().split('T')[0];
      
      this.resignForm.patchValue({
        resignDate: formattedDate,
        noticePeriod: 60,
        lastDay: formattedLastDay,
        reason: ''
      });

      // Update last day when resign date or notice period changes
      this.resignForm.get('resignDate')?.valueChanges.subscribe(() => {
        this.updateLastDay();
      });

      this.resignForm.get('noticePeriod')?.valueChanges.subscribe(() => {
        this.updateLastDay();
      });
    }
  }

  private updateLastDay(): void {
    const resignDate = this.resignForm.get('resignDate')?.value;
    const noticePeriod = this.resignForm.get('noticePeriod')?.value;

    if (resignDate && noticePeriod) {
      const lastDay = new Date(resignDate);
      lastDay.setDate(lastDay.getDate() + parseInt(noticePeriod));
      const formattedLastDay = lastDay.toISOString().split('T')[0];
      this.resignForm.patchValue({ lastDay: formattedLastDay }, { emitEvent: false });
    }
  }

  closeModal(): void {
    this.resignForm.reset();
    this.onClose.emit();
  }

  confirmResign(): void {
    if (this.resignForm.valid && this.contract) {
      const resignationData = {
        resignDate: this.resignForm.value.resignDate,
        noticePeriod: this.resignForm.value.noticePeriod,
        lastDay: this.resignForm.value.lastDay,
        reason: this.resignForm.value.reason
      };
      
      this.onResign.emit({
        contract: this.contract,
        resignationData: resignationData
      });
      
      this.closeModal();
    } else {
      this.resignForm.markAllAsTouched();
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
