import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../../shared/popup/popup.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-part-time',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, FormsModule],
  templateUrl: './edit-part-time.component.html',
  styleUrls: ['./../../../../shared/table/table.component.css', './edit-part-time.component.css'],
})
export class EditPartTimeComponent {

  constructor(private router: Router) {}

  // step 1 - Grace Period
  allowGrace: boolean = false;
  graceMinutes: number = 0;

  // step 2 - Lateness
  latenessEntries = [{ value: null }];

  addLatenessRow() {
    this.latenessEntries.push({ value: null });
  }

  removeLatenessRow(index: number) {
    if (this.latenessEntries.length > 1) {
      this.latenessEntries.splice(index, 1);
    }
  }

  // step 3 - Early Leave
  earlyLeaveRows = [{ deduction: null }];
  sameAsLateness: boolean = false;

  addRow() {
    this.earlyLeaveRows.push({ deduction: null });
  }

  removeRow(index: number) {
    if (this.earlyLeaveRows.length > 1) {
      this.earlyLeaveRows.splice(index, 1);
    }
  }

  // step 4 - Absence
  absenceEntries = [{ value: null }];

  addAbsenceRow() {
    this.absenceEntries.push({ value: null });
  }

  removeAbsenceRow(index: number) {
    if (this.absenceEntries.length > 1) {
      this.absenceEntries.splice(index, 1);
    }
  }

  // step 5 - Overtime
  allowOvertime: boolean = false;
  overtimeType: string = 'flatRate';
  flatRateValue: string = '';
  overtimeEntries = [{ from: '', to: '', rate: null }];

  addOvertimeRow() {
    this.overtimeEntries.push({ from: '', to: '', rate: null });
  }

  removeOvertimeRow(index: number) {
    if (this.overtimeEntries.length > 1) {
      this.overtimeEntries.splice(index, 1);
    }
  }

  getOccurrenceLabel(index: number): string {
    const number = index + 1;
    if (number === 1) return '1st time';
    if (number === 2) return '2nd time';
    if (number === 3) return '3rd time';
    return `${number}th time`;
  }

  // steps navigation
  currentStep = 1;

  goNext() {
    this.currentStep++;
  }

  goPrev() {
    this.currentStep--;
  }

  // discard popup
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/attendance-rules']);
  }

  // Save function
  saveChanges() {
    const requestData = {
      request_data: {
        settings: {
          full_time: {
            lateness: [],
            early_leave: [],
            absence: [],
            grace_period: {
              status: false,
              minutes: 0
            },
            overtime: {
              status: false,
              type: 'flatRate',
              flatRate: '',
              customRanges: []
            }
          },
          part_time: {
            lateness: this.latenessEntries.map((entry, index) => ({
              index: index + 1,
              value: entry.value || 0
            })),
            early_leave: this.earlyLeaveRows.map((row, index) => ({
              index: index + 1,
              value: row.deduction || 0
            })),
            absence: this.absenceEntries.map((entry, index) => ({
              index: index + 1,
              value: entry.value || 0
            })),
            grace_period: {
              status: this.allowGrace,
              minutes: this.graceMinutes || 0
            },
            overtime: {
              status: this.allowOvertime,
              type: this.overtimeType,
              flatRate: this.flatRateValue,
              customRanges: this.overtimeEntries.map((entry, index) => ({
                index: index + 1,
                from: entry.from,
                to: entry.to,
                rate: entry.rate || 0
              }))
            }
          }
        }
      }
    };

    console.log('Save Data:', requestData);

    // إرسال البيانات للـ API
    // this.attendanceService.savePartTimeRules(requestData).subscribe(
    //   response => {
    //     console.log('Rules saved successfully:', response);
    //   },
    //   error => {
    //     console.error('Error saving rules:', error);
    //   }
    // );
  }
}
