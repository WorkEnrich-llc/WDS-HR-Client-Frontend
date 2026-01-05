import { Component, Input, Output, EventEmitter } from '@angular/core';


import { Contract, ContractHistory } from '../../../../../../../../core/interfaces/contract';
import { OverlayFilterBoxComponent } from '../../../../../../../shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from '../../../../../../../shared/table/table.component';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-contract-history-modal',
  imports: [OverlayFilterBoxComponent, TableComponent, NgTemplateOutlet],
  templateUrl: './contract-history-modal.component.html',
  styleUrl: './contract-history-modal.component.css'
})
export class ContractHistoryModalComponent {
  @Input() isOpen = false;
  @Input() contract: Contract | null = null;
  @Input() historyData: ContractHistory[] = [];
  @Input() isLoading: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  closeModal(): void {
    this.onClose.emit();
  }

  getFormattedSalary(salary: number, currency: string): string {
    return `${salary.toLocaleString()} ${currency || 'EGP'}`;
  }
}
