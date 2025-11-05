import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../../shared/popup/popup.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceRulesService } from '../../service/attendance-rules.service';
import { AttendanceRulesData } from '../../models/attendance-rules.interface';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-part-time',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, FormsModule],
  templateUrl: './edit-part-time.component.html',
  styleUrls: ['./../../../../shared/table/table.component.css', './edit-part-time.component.css'],
})
export class EditPartTimeComponent implements OnInit {

  attendanceRulesData: AttendanceRulesData | null = null;
  loading: boolean = true;
  error: string | null = null;
  originalData: any;

  constructor(
    private router: Router,
    private attendanceRulesService: AttendanceRulesService,
    @Inject(ToasterMessageService) private toasterMessageService: ToasterMessageService
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
    if (!this.attendanceRulesData?.object_info?.settings?.part_time) return;

    const partTimeSettings = this.attendanceRulesData.object_info.settings.part_time;

    // Map Grace Period
    this.allowGrace = partTimeSettings.grace_period?.status || false;
    this.graceMinutes = partTimeSettings.grace_period?.minutes || 0;

    // Map Lateness entries
    if (partTimeSettings.lateness && partTimeSettings.lateness.length > 0) {
      this.latenessEntries = partTimeSettings.lateness.map(item => ({ value: item.value }));
    }

    // Map Early Leave entries
    if (partTimeSettings.early_leave && partTimeSettings.early_leave.length > 0) {
      this.earlyLeaveRows = partTimeSettings.early_leave.map(item => ({ deduction: item.value }));
    }

    // Map Absence entries
    if (partTimeSettings.absence && partTimeSettings.absence.length > 0) {
      this.absenceEntries = partTimeSettings.absence.map(item => ({ value: item.value }));
    }

    // Map Overtime settings
    const overtimeSettings = (partTimeSettings as any).overtime;
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


    this.originalData = JSON.parse(JSON.stringify({
      allowGrace: this.allowGrace,
      graceMinutes: this.graceMinutes,
      latenessEntries: this.latenessEntries,
      earlyLeaveRows: this.earlyLeaveRows,
      allowOvertime: this.allowOvertime,
      overtimeType: this.overtimeType,
      flatRateValue: this.flatRateValue,
      overtimeEntries: this.overtimeEntries,
      absenceEntries: this.absenceEntries
    }));

  }

    hasChanges(): boolean {
    if (!this.originalData) return false;
    const current = {
      allowGrace: this.allowGrace,
      graceMinutes: this.graceMinutes,
      latenessEntries: this.latenessEntries,
      earlyLeaveRows: this.earlyLeaveRows,
      allowOvertime: this.allowOvertime,
      overtimeType: this.overtimeType,
      flatRateValue: this.flatRateValue,
      overtimeEntries: this.overtimeEntries,
      absenceEntries: this.absenceEntries
    };
    return JSON.stringify(current) !== JSON.stringify(this.originalData);
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

  // step 4 - Absence
  absenceEntries = [{ value: null as number | null }];

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
  overtimeEntries = [{ from: '', to: '', rate: null as number | null }];

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

    // Get existing full_time settings from API data
    const existingFullTimeSettings = this.attendanceRulesData.object_info.settings.full_time;

    const requestData = {
      request_data: {
        settings: {
          full_time: {
            lateness: existingFullTimeSettings.lateness || [],
            early_leave: existingFullTimeSettings.early_leave || [],
            absence: existingFullTimeSettings.absence || [],
            grace_period: existingFullTimeSettings.grace_period ? {
              status: existingFullTimeSettings.grace_period.status,
              minutes: parseFloat((existingFullTimeSettings.grace_period.minutes || 0).toString())
            } : {
              status: false,
              minutes: 0.0
            },
            overtime: {
              flat_rate: (existingFullTimeSettings as any).overtime?.flat_rate ? {
                status: (existingFullTimeSettings as any).overtime.flat_rate.status,
                value: parseFloat(((existingFullTimeSettings as any).overtime.flat_rate.value || 0).toString())
              } : {
                status: false,
                value: 0.0
              },
              custom_hours: (existingFullTimeSettings as any).overtime?.custom_hours ? {
                status: (existingFullTimeSettings as any).overtime.custom_hours.status,
                value: (existingFullTimeSettings as any).overtime.custom_hours.value.map((item: any) => ({
                  from_time: item.from_time || '0:0',
                  to_time: item.to_time || '0:0',
                  rate: parseFloat((item.rate || 0).toString())
                }))
              } : {
                status: false,
                value: [{ from_time: '0:0', to_time: '0:0', rate: 0.0 }]
              }
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
          }
        }
      }
    };

    console.log('Save Data:', requestData);

    // Send data to API
    this.attendanceRulesService.updateAttendanceRules(requestData).subscribe({
      next: (response) => {
        console.log('Rules saved successfully:', response);
        this.isSaving = false;
        this.toasterMessageService.showSuccess('Part-time attendance rules updated successfully!');
        this.router.navigate(['/attendance-rules']);
      },
      error: (error) => {
        console.error('Error saving rules:', error);
        this.isSaving = false;
      }
    });
  }
}
