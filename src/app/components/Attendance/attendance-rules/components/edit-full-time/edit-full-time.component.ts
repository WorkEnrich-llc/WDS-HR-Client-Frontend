import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../../shared/popup/popup.component';
import { AttendanceRulesService } from '../../service/attendance-rules.service';
import { AttendanceRulesData } from '../../models/attendance-rules.interface';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-full-time',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, FormsModule],
  templateUrl: './edit-full-time.component.html',
  styleUrls: ['./../../../../shared/table/table.component.css', './edit-full-time.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EditFullTimeComponent implements OnInit {

  attendanceRulesData: AttendanceRulesData | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private attendanceRulesService: AttendanceRulesService,
    private toasterMessageService: ToasterMessageService
  ) { }

  ngOnInit(): void {
    this.loadAttendanceRules();
  }

  loadAttendanceRules(): void {
    this.loading = true;
    this.attendanceRulesService.getAttendanceRules().subscribe({
      next: (response) => {
        this.attendanceRulesData = response?.data;
        this.mapDataToForm();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendance rules:', error);
        this.error = 'Failed to load attendance rules';
        this.loading = false;
      }
    });
  }

  mapDataToForm(): void {
    if (!this.attendanceRulesData?.object_info?.settings?.full_time) return;

    const fullTimeSettings = this.attendanceRulesData.object_info.settings.full_time;

    // Map Grace Period
    this.allowGrace = fullTimeSettings.grace_period?.status || false;
    this.graceMinutes = fullTimeSettings.grace_period?.minutes || 0;

    // Map Lateness entries
    if (fullTimeSettings.lateness && fullTimeSettings.lateness.length > 0) {
      this.latenessEntries = fullTimeSettings.lateness.map(item => ({ value: item.value }));
    }

    // Map Early Leave entries
    if (fullTimeSettings.early_leave && fullTimeSettings.early_leave.length > 0) {
      this.earlyLeaveRows = fullTimeSettings.early_leave.map(item => ({ deduction: item.value }));
    }

    // Map Absence entries
    if (fullTimeSettings.absence && fullTimeSettings.absence.length > 0) {
      this.absenceEntries = fullTimeSettings.absence.map(item => ({ value: item.value }));
    }

    // Map Overtime settings
    const overtimeSettings = (fullTimeSettings as any).overtime;
    if (overtimeSettings) {
      this.allowOvertime = overtimeSettings.flat_rate?.status || overtimeSettings.custom_hours?.status || false;

      if (overtimeSettings.flat_rate?.status) {
        this.overtimeType = 'flatRate';
        this.flatRateValue = overtimeSettings.flat_rate.value?.toString() || '';
      } else if (overtimeSettings.custom_hours?.status) {
        this.overtimeType = 'customHours';
        if (overtimeSettings.custom_hours.value && overtimeSettings.custom_hours.value.length > 0) {
          this.overtimeEntries = overtimeSettings.custom_hours.value.map((item: any) => ({
            from: item.from_time || '',
            to: item.to_time || '',
            rate: item.rate || null
          }));
        }
      }
    }
  }
  // step 1 - Grace Period
  allowGrace: boolean = false;
  graceMinutes: number = 0;

  // step 2 - Lateness
  latenessEntries = [{ value: null as number | null }];

  addLatenessRow() {
    this.latenessEntries.push({ value: null });
  }

  removeLatenessRow(index: number) {
    if (this.latenessEntries.length > 1) {
      this.latenessEntries.splice(index, 1);
    }
  }

  // step 3 - Early Leave
  earlyLeaveRows = [{ deduction: null as number | null }];
  sameAsLateness: boolean = false;

  addRow() {
    this.earlyLeaveRows.push({ deduction: null });
  }

  removeRow(index: number) {
    if (this.earlyLeaveRows.length > 1) {
      this.earlyLeaveRows.splice(index, 1);
    }
  }

  // step 4 - Overtime
  allowOvertime: boolean = false;
  overtimeType: string = 'flatRate';
  flatRateValue: string = '';
  overtimeEntries = [{ from: '', to: '', rate: null as number | null }];

  addOvertimeRow() {
    this.overtimeEntries.push({ from: '', to: '', rate: null });
  }

  removeOvertimeRow(index: number) {
    if (this.overtimeEntries.length > 1) {
      this.overtimeEntries.splice(index, 1);
    }
  }
  /**
   * Handle rate input change to ensure value is stored as float
   */
  onRateChange(value: string | number, entry: { from: string; to: string; rate: number | null }): void {
    const parsed = parseFloat(value as any);
    entry.rate = isNaN(parsed) ? null : parsed;
  }

  // step 5 - Absence
  absenceEntries = [{ value: null as number | null }];

  addAbsenceRow() {
    this.absenceEntries.push({ value: null });
  }

  removeAbsenceRow(index: number) {
    if (this.absenceEntries.length > 1) {
      this.absenceEntries.splice(index, 1);
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
  isLoading: boolean = false;
  isSaving: boolean = false;

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
    if (this.isSaving) {
      return;
    }

    if (!this.attendanceRulesData?.object_info?.settings) {
      console.error('No existing data available');
      return;
    }

    this.isSaving = true;

    // Get existing part_time settings from API data
    const existingPartTimeSettings = this.attendanceRulesData.object_info.settings.part_time;
    const requestData = {
      request_data: {
        settings: {
          full_time: {
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
              minutes: parseFloat((this.graceMinutes || 0).toString())
            },
            overtime: {
              flat_rate: {
                status: this.allowOvertime && this.overtimeType === 'flatRate',
                value: parseFloat((this.overtimeType === 'flatRate' ? parseFloat(this.flatRateValue) || 0 : 0).toString())
              },
              custom_hours: {
                status: this.allowOvertime && this.overtimeType === 'customHours',
                value: this.overtimeType === 'customHours' ? this.overtimeEntries.map((entry) => ({
                  from_time: entry.from || '0:0',
                  to_time: entry.to || '0:0',
                  rate: parseFloat((entry.rate || 0).toString())
                })) : [{ from_time: '0:0', to_time: '0:0', rate: 0.0 }]
              }
            }
          },
          part_time: {
            lateness: existingPartTimeSettings.lateness || [],
            early_leave: existingPartTimeSettings.early_leave || [],
            absence: existingPartTimeSettings.absence || [],
            grace_period: existingPartTimeSettings.grace_period ? {
              status: existingPartTimeSettings.grace_period.status,
              minutes: parseFloat((existingPartTimeSettings.grace_period.minutes || 0).toString())
            } : {
              status: false,
              minutes: 0.0
            },
            overtime: {
              flat_rate: (existingPartTimeSettings as any).overtime?.flat_rate ? {
                status: (existingPartTimeSettings as any).overtime.flat_rate.status,
                value: parseFloat(((existingPartTimeSettings as any).overtime.flat_rate.value || 0).toString())
              } : {
                status: false,
                value: 0.0
              },
              custom_hours: (existingPartTimeSettings as any).overtime?.custom_hours ? {
                status: (existingPartTimeSettings as any).overtime.custom_hours.status,
                value: (existingPartTimeSettings as any).overtime.custom_hours.value.map((item: any) => ({
                  from_time: item.from_time || '0:0',
                  to_time: item.to_time || '0:0',
                  rate: parseFloat(parseFloat(item.rate || 0).toFixed(1))
                }))
              } : {
                status: false,
                value: [{ from_time: '0:0', to_time: '0:0', rate: 0.0 }]
              }
            }
          }
        }
      }
    };

    // Send data to API
    this.attendanceRulesService.updateAttendanceRules(requestData).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.router.navigate(['/attendance-rules']);
      },
      error: (error) => {
        console.error('Error saving rules:', error);
        this.isSaving = false;
      }
    });
  }




}
