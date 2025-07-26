import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Contract, ContractHistory } from '../../../../../../../../core/interfaces/contract';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from '../../../../../../../shared/table/table.component';

@Component({
  standalone: true,
  selector: 'app-contract-history-modal',
  imports: [CommonModule, OverlayFilterBoxComponent, TableComponent],
  templateUrl: './contract-history-modal.component.html',
  styleUrl: './contract-history-modal.component.css'
})
export class ContractHistoryModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Input() historyData: ContractHistory[] = [];
  @Output() onClose = new EventEmitter<void>();

  closeModal(): void {
    this.onClose.emit();
  }
}
