import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Contract } from '../../../../../../../../core/interfaces/contract';
import { PopupComponent } from '../../../../../../../shared/popup/popup.component';

@Component({
  standalone: true,
  selector: 'app-contract-cancel-modal',
  imports: [PopupComponent],
  templateUrl: './contract-delete-modal.component.html',
  styleUrl: './contract-delete-modal.component.css'
})
export class ContractCancelModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<Contract>();

  closeModal(): void {
    this.onClose.emit();
  }

  confirmCancel(): void {
    if (this.contract) {
      this.onCancel.emit(this.contract);
    }
  }

  getContractNumber(): string {
    return this.contract?.contractNumber || '';
  }
}
