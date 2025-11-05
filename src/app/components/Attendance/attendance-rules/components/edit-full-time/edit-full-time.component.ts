import { Component, ViewEncapsulation, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../../shared/popup/popup.component';
import { AttendanceRulesService } from '../../service/attendance-rules.service';
import { AttendanceRulesData } from '../../models/attendance-rules.interface';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';

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
  originalData: any;

  constructor(
    private router: Router,
    private attendanceRulesService: AttendanceRulesService,
    private toasterMessageService: ToasterMessageService,
    private salaryPortionsService: SalaryPortionsService
  ) { }

  ngOnInit(): void {
    this.loadSalaryPortions();
  }

  loadSalaryPortions(): void {
    this.salaryPortionsLoading = true;
    this.salaryPortionsService.single().subscribe({
      next: (response) => {
        console.log('Salary portions loaded:', response);
        if (response && response.settings && Array.isArray(response.settings)) {
          // Map settings to include index from the response
          this.salaryPortions = response.settings.map((setting: any, arrayIndex: number) => ({
            name: setting.name,
            percentage: setting.percentage,
            index: setting.index !== undefined ? setting.index : (arrayIndex + 1) // Use index from API or fallback to array index + 1
          }));
          console.log('Mapped salary portions with indices:', this.salaryPortions);
        } else {
          this.salaryPortions = [];
        }
        this.salaryPortionsLoading = false;
        // Load attendance rules after salary portions are loaded
        this.loadAttendanceRules();
      },
      error: (error) => {
        console.error('Error loading salary portions:', error);
        this.salaryPortions = [];
        this.salaryPortionsLoading = false;
        // Still load attendance rules even if salary portions fail
        this.loadAttendanceRules();
      }
    });
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
      this.latenessEntries = fullTimeSettings.lateness.map((item: any) => {
        // Store the index directly from the API response, convert to number
        return {
          value: item.value,
          salaryPortionIndex: item.salary_portion_index !== null && item.salary_portion_index !== undefined
            ? Number(item.salary_portion_index)
            : null
        };
      });
    }

    // Map Early Leave entries
    if (fullTimeSettings.early_leave && fullTimeSettings.early_leave.length > 0) {
      this.earlyLeaveRows = fullTimeSettings.early_leave.map((item: any) => ({
        deduction: item.value,
        salaryPortionIndex: item.salary_portion_index !== null && item.salary_portion_index !== undefined
          ? Number(item.salary_portion_index)
          : null
      }));
    }

    // Map Absence entries
    if (fullTimeSettings.absence && fullTimeSettings.absence.length > 0) {
      this.absenceEntries = fullTimeSettings.absence.map((item: any) => ({
        value: item.value,
        salaryPortionIndex: item.salary_portion_index !== null && item.salary_portion_index !== undefined
          ? Number(item.salary_portion_index)
          : null
      }));
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
  latenessEntries = [{ value: null as number | null, salaryPortionIndex: null as number | null }];
  salaryPortions: { name: string; percentage: number; index: number }[] = [];
  salaryPortionsLoading: boolean = false;
  latenessValidationErrors: { [key: number]: { value: boolean; salaryPortion: boolean } } = {};

  addLatenessRow() {
    this.latenessEntries.push({ value: null, salaryPortionIndex: null });
  }

  removeLatenessRow(index: number) {
    if (this.latenessEntries.length > 1) {
      this.latenessEntries.splice(index, 1);
      // Clean up validation errors for removed row and reindex remaining errors
      const newErrors: { [key: number]: { value: boolean; salaryPortion: boolean } } = {};
      Object.keys(this.latenessValidationErrors).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex < index) {
          newErrors[oldIndex] = this.latenessValidationErrors[oldIndex];
        } else if (oldIndex > index) {
          newErrors[oldIndex - 1] = this.latenessValidationErrors[oldIndex];
        }
      });
      this.latenessValidationErrors = newErrors;
    }
  }

  // step 3 - Early Leave
  earlyLeaveRows = [{ deduction: null as number | null, salaryPortionIndex: null as number | null }];
  sameAsLateness: boolean = false;
  earlyLeaveValidationErrors: { [key: number]: { value: boolean; salaryPortion: boolean } } = {};

  addRow() {
    this.earlyLeaveRows.push({ deduction: null, salaryPortionIndex: null });
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
  absenceEntries = [{ value: null as number | null, salaryPortionIndex: null as number | null }];
  absenceValidationErrors: { [key: number]: { value: boolean; salaryPortion: boolean } } = {};

  addAbsenceRow() {
    this.absenceEntries.push({ value: null, salaryPortionIndex: null });
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
    // Prevent navigation while APIs are loading
    if (this.loading || this.salaryPortionsLoading) {
      return;
    }

    // Always validate current step before proceeding
    if (this.currentStep === 1) {
      this.validateLatenessStep();
      if (!this.isStepValid(this.currentStep)) {
        return; // Don't proceed if validation fails
      }
    } else if (this.currentStep === 2) {
      this.validateEarlyLeaveStep();
      if (!this.isStepValid(this.currentStep)) {
        return; // Don't proceed if validation fails
      }
    } else if (this.currentStep === 3) {
      this.validateAbsenceStep();
      if (!this.isStepValid(this.currentStep)) {
        return; // Don't proceed if validation fails
      }
    }

    // Only proceed if current step is valid
    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
    }
  }

  validateLatenessStep(): void {
    this.latenessValidationErrors = {};
    this.latenessEntries.forEach((entry, index) => {
      this.latenessValidationErrors[index] = {
        value: entry.value === null || entry.value === undefined,
        salaryPortion: entry.salaryPortionIndex === null || entry.salaryPortionIndex === undefined
      };
    });
  }

  clearLatenessValidationError(index: number, field: 'value' | 'salaryPortion'): void {
    if (this.latenessValidationErrors[index]) {
      this.latenessValidationErrors[index][field] = false;
    }
  }

  validateEarlyLeaveStep(): void {
    this.earlyLeaveValidationErrors = {};
    this.earlyLeaveRows.forEach((row, index) => {
      this.earlyLeaveValidationErrors[index] = {
        value: row.deduction === null || row.deduction === undefined,
        salaryPortion: row.salaryPortionIndex === null || row.salaryPortionIndex === undefined
      };
    });
  }

  clearEarlyLeaveValidationError(index: number, field: 'value' | 'salaryPortion'): void {
    if (this.earlyLeaveValidationErrors[index]) {
      this.earlyLeaveValidationErrors[index][field] = false;
    }
  }

  validateAbsenceStep(): void {
    this.absenceValidationErrors = {};
    this.absenceEntries.forEach((entry, index) => {
      this.absenceValidationErrors[index] = {
        value: entry.value === null || entry.value === undefined,
        salaryPortion: entry.salaryPortionIndex === null || entry.salaryPortionIndex === undefined
      };
    });
  }

  clearAbsenceValidationError(index: number, field: 'value' | 'salaryPortion'): void {
    if (this.absenceValidationErrors[index]) {
      this.absenceValidationErrors[index][field] = false;
    }
  }


  // Keyboard navigation for tabs
  @HostListener('keydown', ['$event'])
  handleTabKeydown(event: KeyboardEvent): void {
    // Only handle if focus is on a tab
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-item')) {
      return;
    }

    const tabs = Array.from(document.querySelectorAll('.nav-item')) as HTMLElement[];
    const currentIndex = tabs.indexOf(target.closest('.nav-item') as HTMLElement);

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        tabs[nextIndex]?.focus();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        tabs[prevIndex]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        tabs[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        tabs[tabs.length - 1]?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (target.closest('.nav-item')) {
          const tabIndex = currentIndex + 1;
          this.goToStep(tabIndex);
        }
        break;
    }
  }

  // Handle keyboard navigation in table rows
  handleRowKeydown(event: KeyboardEvent, rowIndex: number, field: 'value' | 'salaryPortion'): void {
    const target = event.target as HTMLElement;
    const rows = Array.from(document.querySelectorAll('tbody tr')) as HTMLElement[];

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (rowIndex < rows.length - 1) {
          const nextRow = rows[rowIndex + 1];
          const nextField = nextRow.querySelector(`input[type="number"], select`) as HTMLElement;
          nextField?.focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (rowIndex > 0) {
          const prevRow = rows[rowIndex - 1];
          const prevField = prevRow.querySelector(`input[type="number"], select`) as HTMLElement;
          prevField?.focus();
        }
        break;
      case 'Tab':
        // Allow default tab behavior but move to next field in same row
        if (field === 'value' && !event.shiftKey) {
          const currentRow = rows[rowIndex];
          const salaryPortionSelect = currentRow.querySelector('select') as HTMLElement;
          if (salaryPortionSelect) {
            event.preventDefault();
            salaryPortionSelect.focus();
          }
        }
        break;
    }
  }

  goPrev() {
    this.currentStep--;
  }

  goToStep(step: number) {
    const maxStep = 5;
    const current = this.currentStep;

    // Prevent navigation while APIs are loading
    if (this.loading || this.salaryPortionsLoading) {
      return;
    }

    if (step < 1 || step > maxStep) {
      return;
    }

    // Allow navigation to previous steps without validation
    if (step <= current) {
      this.currentStep = step;
      return;
    }

    // For forward navigation, validate all intermediate steps
    for (let i = current; i < step; i++) {
      // Validate steps and show errors if needed
      if (i === 0) {
        this.validateLatenessStep();
      } else if (i === 1) {
        this.validateEarlyLeaveStep();
      } else if (i === 2) {
        this.validateAbsenceStep();
      }
      if (!this.isStepValid(i + 1)) {
        // If validation fails, navigate to the first invalid step
        this.currentStep = i + 1;
        return;
      }
    }

    // All validations passed, navigate to the target step
    this.currentStep = step;
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: // Lateness
        return this.latenessEntries.length > 0 &&
          this.latenessEntries.every(entry =>
            entry.value !== null && entry.value !== undefined &&
            entry.salaryPortionIndex !== null && entry.salaryPortionIndex !== undefined
          );

      case 2: // Early Leave
        if (this.sameAsLateness) {
          return true; // If same as lateness, no validation needed
        }
        return this.earlyLeaveRows.length > 0 &&
          this.earlyLeaveRows.every(row =>
            row.deduction !== null && row.deduction !== undefined &&
            row.salaryPortionIndex !== null && row.salaryPortionIndex !== undefined
          );

      case 3: // Absence
        return this.absenceEntries.length > 0 &&
          this.absenceEntries.every(entry =>
            entry.value !== null && entry.value !== undefined &&
            entry.salaryPortionIndex !== null && entry.salaryPortionIndex !== undefined
          );

      case 4: // Overtime
        if (!this.allowOvertime) {
          return true; // If overtime is not allowed, step is valid
        }
        if (this.overtimeType === 'flatRate') {
          return this.flatRateValue !== null && this.flatRateValue !== undefined && this.flatRateValue !== '';
        } else if (this.overtimeType === 'customHours') {
          return this.overtimeEntries.length > 0 &&
            this.overtimeEntries.every(entry =>
              entry.from !== '' && entry.to !== '' && entry.rate !== null && entry.rate !== undefined
            );
        }
        return false;

      case 5: // Grace Period
        if (!this.allowGrace) {
          return true; // If grace period is not allowed, step is valid
        }
        return this.graceMinutes !== null && this.graceMinutes !== undefined;

      default:
        return true;
    }
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

    // Validate all steps before saving
    if (!this.isStepValid(1)) {
      this.currentStep = 1;
      this.validateLatenessStep();
      return;
    }
    if (!this.isStepValid(2)) {
      this.currentStep = 2;
      this.validateEarlyLeaveStep();
      return;
    }
    if (!this.isStepValid(3)) {
      this.currentStep = 3;
      this.validateAbsenceStep();
      return;
    }
    if (!this.isStepValid(4)) {
      this.currentStep = 4;
      return;
    }
    if (!this.isStepValid(5)) {
      this.currentStep = 5;
      return;
    }

    this.isSaving = true;

    // Get existing part_time settings from API data
    const existingPartTimeSettings = this.attendanceRulesData.object_info.settings.part_time;
    const requestData = {
      request_data: {
        settings: {
          full_time: {
            lateness: this.latenessEntries.map((entry, index) => {
              console.log('Mapping lateness entry:', {
                entryIndex: index + 1,
                value: entry.value,
                salaryPortionIndex: entry.salaryPortionIndex,
                availablePortions: this.salaryPortions
              });
              return {
                index: index + 1,
                value: entry.value || 0,
                salary_portion_index: entry.salaryPortionIndex !== null && entry.salaryPortionIndex !== undefined
                  ? Number(entry.salaryPortionIndex)
                  : 1  // Default to 1 if not selected
              };
            }),
            early_leave: this.earlyLeaveRows.map((row, index) => ({
              index: index + 1,
              value: row.deduction || 0,
              salary_portion_index: row.salaryPortionIndex !== null && row.salaryPortionIndex !== undefined
                ? Number(row.salaryPortionIndex)
                : 1  // Default to 1 if not selected
            })),
            absence: this.absenceEntries.map((entry, index) => ({
              index: index + 1,
              value: entry.value || 0,
              salary_portion_index: entry.salaryPortionIndex !== null && entry.salaryPortionIndex !== undefined
                ? Number(entry.salaryPortionIndex)
                : 1  // Default to 1 if not selected
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
            lateness: (existingPartTimeSettings.lateness || []).map((item: any) => ({
              index: item.index || 0,
              value: item.value || 0,
              salary_portion_index: item.salary_portion_index !== null && item.salary_portion_index !== undefined
                ? Number(item.salary_portion_index)
                : 1  // Default to 1 if not set
            })),
            early_leave: (existingPartTimeSettings.early_leave || []).map((item: any) => ({
              index: item.index || 0,
              value: item.value || 0,
              salary_portion_index: item.salary_portion_index !== null && item.salary_portion_index !== undefined
                ? Number(item.salary_portion_index)
                : 1  // Default to 1 if not set
            })),
            absence: (existingPartTimeSettings.absence || []).map((item: any) => ({
              index: item.index || 0,
              value: item.value || 0,
              salary_portion_index: item.salary_portion_index !== null && item.salary_portion_index !== undefined
                ? Number(item.salary_portion_index)
                : 1  // Default to 1 if not set
            })),
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
        console.log('Rules saved successfully:', response);
      },
      error: (error) => {
        console.error('Error saving rules:', error);
        this.isSaving = false;
      }
    });
  }




}
