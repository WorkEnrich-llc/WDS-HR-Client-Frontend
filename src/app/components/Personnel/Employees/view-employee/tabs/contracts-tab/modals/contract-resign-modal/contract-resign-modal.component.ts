import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
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
  @Output() onResign = new EventEmitter<{ contract: Contract, resignationData: any }>();

  resignForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.resignForm = this.fb.group({
      resignDate: ['', Validators.required],
      // noticePeriod: [60], // Default 60 days
      lastDay: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue && this.contract) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];

    this.resignForm.patchValue({
      lastDay: formattedToday,
      resignDate: '',
      reason: ''
    });
  }



  confirmResign(): void {

    if (this.resignForm.invalid) {
      this.resignForm.markAllAsTouched();
      return;
    }

    if (!this.contract) {
      console.warn('Contract input not ready yet, please try again.');
      return;
    }

    const resignationData = this.resignForm.value;
    this.onResign.emit({ contract: this.contract, resignationData });
    this.closeModal();
  }

  closeModal(): void {
    this.resignForm.reset();
    this.onClose.emit();
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
