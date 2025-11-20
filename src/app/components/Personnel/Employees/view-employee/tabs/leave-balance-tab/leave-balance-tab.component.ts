import { Component, inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute } from '@angular/router';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { finalize } from 'rxjs';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

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
  private employeeService = inject(EmployeeService);
  private toasterService = inject(ToasterMessageService);
  employeeId!: number;
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

  // private loadLeaveBalances(): void {
  //   if (!this.employee) {
  //     this.records = [];
  //     return;
  //   }
  //   // TODO: replace mock with API integration when backend endpoint is ready
  //   this.loading = true;
  //   this.error = null;
  //   setTimeout(() => {
  //     try {
  //       this.records = [
  //         { id: 1, leaveId: 'AL001', leaveType: 'Annual Leave', total: 21, used: 8, available: 13 },
  //         { id: 2, leaveId: 'SL001', leaveType: 'Sick Leave', total: 10, used: 2, available: 8 },
  //         { id: 3, leaveId: 'EL001', leaveType: 'Emergency Leave', total: 5, used: 1, available: 4 }
  //       ];
  //     } catch (e) {
  //       this.records = [];
  //       this.error = 'Failed to load leave balance';
  //     }
  //     this.loading = false;
  //   }, 400);
  // }

  private loadLeaveBalances(): void {
    if (!this.employee) {
      this.records = [];
      return;
    }

    this.loading = true;
    this.error = null;

    const employeeId = this.employee.id;
    const page = 1;
    const perPage = 1000;

    this.employeeService.getEmployeeLeaveBalance(employeeId, page, perPage)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.records = response.data.list_items.map(item => {
            return {
              id: item.id,
              leaveId: item.leave.id.toString(),
              leaveType: item.leave.name,
              total: item.total,
              used: item.used,
              available: item.available
            };
          });

          if (response.data.page < response.data.total_pages) {
            console.warn('Warning: Not all leave balances were loaded.');
          }
        },
        error: (err) => {
          this.records = [];
          this.error = 'Failed to load leave balance';
          console.error('Error loading leave balance:', err);
        }
      });
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
    if (this.editForm.invalid || !this.editingRecord || !this.employee) {
      return;
    }
    this.isSubmitting = true;
    const formValues = this.editForm.value;
    const employeeId = this.employee.id;
    const leaveId = parseInt(this.editingRecord.leaveId, 10);
    const newTotal = formValues.totalBalance;
    this.employeeService.updateEmployeeLeaveBalance(employeeId, leaveId, newTotal)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          // this.toasterService.showSuccess('Leave balance updated successfully.');
          this.loadLeaveBalances();
        },
        error: (err) => {
          console.error('Update failed', err);
          this.error = 'Failed to update balance.';
        }
      });

    // setTimeout(() => {
    //   if (this.editingRecord) {
    //     const formValue = this.editForm.value;

    //     // Update the record
    //     this.editingRecord.leaveType = formValue.leaveType;
    //     this.editingRecord.total = formValue.totalBalance;
    //     this.editingRecord.available = formValue.totalBalance - this.editingRecord.used;

    //     // Update the record in the array
    //     const index = this.records.findIndex(r => r.id === this.editingRecord!.id);
    //     if (index !== -1) {
    //       this.records[index] = { ...this.editingRecord };
    //     }
    //   }

    //   this.isSubmitting = false;
    //   this.closeEditModal();
    // }, 1000);
  }

  discardChanges() {
    this.closeEditModal();
  }
}
