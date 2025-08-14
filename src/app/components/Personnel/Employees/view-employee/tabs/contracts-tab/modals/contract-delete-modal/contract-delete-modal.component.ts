import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Contract } from '../../../../../../../../core/interfaces/contract';
import { PopupComponent } from '../../../../../../../shared/popup/popup.component';

@Component({
  standalone: true,
  selector: 'app-contract-delete-modal',
  imports: [PopupComponent],
  templateUrl: './contract-delete-modal.component.html',
  styleUrl: './contract-delete-modal.component.css'
})
export class ContractDeleteModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<Contract>();

  closeModal(): void {
    this.onClose.emit();
  }

  confirmDelete(): void {
    if (this.contract) {
      this.onDelete.emit(this.contract);
    }
  }

  getContractNumber(): string {
    return this.contract?.contractNumber || '';
  }
}
