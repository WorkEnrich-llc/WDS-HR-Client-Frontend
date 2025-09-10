import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../../../shared/overlay-filter-box/overlay-filter-box.component';

interface LeaveBalanceRecord {
  id: number;
  leaveId: string;
  leaveType: string;
  total: number;
  used: number;
  available: number;
}

@Component({
  selector: 'app-leave-balance-tab',
  standalone: true,
  imports: [CommonModule, TableComponent, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './leave-balance-tab.component.html',
  styleUrl: './leave-balance-tab.component.css'
})
export class LeaveBalanceTabComponent implements OnChanges {
  @Input() employee: Employee | null = null;
  @Input() isEmployeeActive: boolean = false;
  @ViewChild('editBox') editBox!: OverlayFilterBoxComponent;

  records: LeaveBalanceRecord[] = [];
  loading = false;
  error: string | null = null;

  // Edit form
  editForm: FormGroup;
  editingRecord: LeaveBalanceRecord | null = null;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.editForm = this.fb.group({
      leaveType: ['', Validators.required],
      totalBalance: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.loadLeaveBalances();
    }
  }

  private loadLeaveBalances(): void {
    if (!this.employee) {
      this.records = [];
      return;
    }
    // TODO: replace mock with API integration when backend endpoint is ready
    this.loading = true;
    this.error = null;
    setTimeout(() => {
      try {
        this.records = [
          { id: 1, leaveId: 'AL001', leaveType: 'Annual Leave', total: 21, used: 8, available: 13 },
          { id: 2, leaveId: 'SL001', leaveType: 'Sick Leave', total: 10, used: 2, available: 8 },
          { id: 3, leaveId: 'EL001', leaveType: 'Emergency Leave', total: 5, used: 1, available: 4 }
        ];
      } catch (e) {
        this.records = [];
        this.error = 'Failed to load leave balance';
      }
      this.loading = false;
    }, 400);
  }

  edit(record: LeaveBalanceRecord) {
    this.editingRecord = record;
    this.editForm.patchValue({
      leaveType: record.leaveType,
      totalBalance: record.total
    });
    this.editBox.openOverlay();
  }

  closeEditModal() {
    this.editBox.closeOverlay();
    this.editingRecord = null;
    this.editForm.reset();
  }

  saveChanges() {
    if (this.editForm.valid && this.editingRecord) {
      this.isSubmitting = true;
      
      // TODO: Replace with actual API call when backend endpoint is ready
      setTimeout(() => {
        if (this.editingRecord) {
          const formValue = this.editForm.value;
          
          // Update the record
          this.editingRecord.leaveType = formValue.leaveType;
          this.editingRecord.total = formValue.totalBalance;
          this.editingRecord.available = formValue.totalBalance - this.editingRecord.used;
          
          // Update the record in the array
          const index = this.records.findIndex(r => r.id === this.editingRecord!.id);
          if (index !== -1) {
            this.records[index] = { ...this.editingRecord };
          }
        }
        
        this.isSubmitting = false;
        this.closeEditModal();
      }, 1000);
    }
  }

  discardChanges() {
    this.closeEditModal();
  }
}
