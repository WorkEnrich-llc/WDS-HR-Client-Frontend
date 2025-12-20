import { Component, Input, Output, EventEmitter } from '@angular/core';


import { Contract } from '../../../../../../../../core/interfaces/contract';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  standalone: true,
  selector: 'app-contract-terminated-view-modal',
  imports: [OverlayFilterBoxComponent],
  templateUrl: './contract-terminated-view-modal.component.html',
  styleUrl: './contract-terminated-view-modal.component.css'
})
export class ContractTerminatedViewModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Input() terminationData: any = null;
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
