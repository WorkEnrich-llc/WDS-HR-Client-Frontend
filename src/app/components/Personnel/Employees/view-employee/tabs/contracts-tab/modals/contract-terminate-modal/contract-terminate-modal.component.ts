import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Contract } from '../../../../../../../../core/interfaces/contract';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  standalone: true,
  selector: 'app-contract-terminate-modal',
  imports: [ReactiveFormsModule, CommonModule, OverlayFilterBoxComponent],
  templateUrl: './contract-terminate-modal.component.html',
  styleUrl: './contract-terminate-modal.component.css'
})
export class ContractTerminateModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onTerminate = new EventEmitter<{ contract: Contract, terminationData: any }>();

  terminateForm: FormGroup;
  private internalContract: Contract | null = null;
  constructor(private fb: FormBuilder) {
    this.terminateForm = this.fb.group({
      lastDay: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }



  ngOnChanges(changes: SimpleChanges): void {

    if (changes['contract'] && changes['contract'].currentValue) {
      this.internalContract = changes['contract'].currentValue;
    }

    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      this.terminateForm.reset({
        lastDay: formattedDate,
        reason: ''
      });
    }
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
