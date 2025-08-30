import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Contract } from '../../../../../../../../core/interfaces/contract';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  standalone: true,
  selector: 'app-contract-resigned-view-modal',
  imports: [CommonModule, OverlayFilterBoxComponent],
  templateUrl: './contract-resigned-view-modal.component.html',
  styleUrl: './contract-resigned-view-modal.component.css'
})
export class ContractResignedViewModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Input() resignationData: any = null;
  @Output() onClose = new EventEmitter<void>();

  closeModal(): void {
    this.onClose.emit();
  }

  getContractNumber(): string {
    return this.contract?.contractNumber || '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
