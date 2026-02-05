import { Component, OnInit, OnDestroy, Inject, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../../shared/popup/popup.component';

import { FormsModule } from '@angular/forms';
import { AttendanceRulesService } from '../../service/attendance-rules.service';
import { AttendanceRulesData } from '../../models/attendance-rules.interface';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';
import { NgClass } from '@angular/common';

// Interfaces for lateness structure
interface LatenessDeductionRule {
  thresholdTime: number | null;
  deductionValue: number | null;
  deductionBase: number | null; // salaryPortionIndex
}

interface LatenessOccurrence {
  isExpanded: boolean;
  deductionRules: LatenessDeductionRule[];
}

// Interfaces for early leave structure (same as lateness)
interface EarlyLeaveDeductionRule {
  thresholdTime: number | null;
  deductionValue: number | null;
  deductionBase: number | null; // salaryPortionIndex
}

interface EarlyLeaveOccurrence {
  isExpanded: boolean;
  deductionRules: EarlyLeaveDeductionRule[];
}

// Interfaces for time gaps structure (same as lateness)
interface TimeGapsDeductionRule {
  thresholdTime: number | null;
  deductionValue: number | null;
  deductionBase: number | null; // salaryPortionIndex
}

interface TimeGapsOccurrence {
  isExpanded: boolean;
  deductionRules: TimeGapsDeductionRule[];
}

@Component({
  selector: 'app-edit-part-time',
  imports: [PageHeaderComponent, PopupComponent, FormsModule, NgClass],
  templateUrl: './edit-part-time.component.html',
  styleUrls: ['./../../../../shared/table/table.component.css', './edit-part-time.component.css'],
})
export class EditPartTimeComponent implements OnInit, OnDestroy {

  attendanceRulesData: AttendanceRulesData | null = null;
  loading: boolean = true;
  error: string | null = null;
  originalData: any;
  private destroy$ = new Subject<void>();
  private salaryPortionsRequestInFlight = false;
  private attendanceRulesRequestInFlight = false;

  constructor(
    private router: Router,
    private attendanceRulesService: AttendanceRulesService,
    @Inject(ToasterMessageService) private toasterMessageService: ToasterMessageService,
    private salaryPortionsService: SalaryPortionsService
  ) { }

  ngOnInit(): void {
    this.loadSalaryPortions();
  }

  loadSalaryPortions(): void {
    if (this.salaryPortionsRequestInFlight) {
      return;
    }
    this.salaryPortionsRequestInFlight = true;
    this.salaryPortionsLoading = true;
    this.salaryPortionsService.single({ request_in: 'attendance-rules' }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.salaryPortionsLoading = false;
        this.salaryPortionsRequestInFlight = false;
      })
    ).subscribe({
      next: (response) => {
        if (response && response.settings && Array.isArray(response.settings)) {
          // Map settings to include index from the response
          this.salaryPortions = response.settings.map((setting: any, arrayIndex: number) => ({
            name: setting.name,
            percentage: setting.percentage,
            index: setting.index !== undefined ? setting.index : (arrayIndex + 1) // Use index from API or fallback to array index + 1
          }));
        } else {
          this.salaryPortions = [];
        }
        // Load attendance rules after salary portions are loaded
        this.loadAttendanceRules();
      },
      error: (error) => {
        console.error('Error loading salary portions:', error);
        this.salaryPortions = [];
        // Still load attendance rules even if salary portions fail
        this.loadAttendanceRules();
      }
    });
  }

  loadAttendanceRules(): void {
    if (this.attendanceRulesRequestInFlight) {
      return;
    }
    this.attendanceRulesRequestInFlight = true;
    this.loading = true;
    this.attendanceRulesService.getAttendanceRules().pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading = false;
        this.attendanceRulesRequestInFlight = false;
      })
    ).subscribe({
      next: (response) => {
        this.attendanceRulesData = response?.data;
        this.mapDataToForm();
      },
      error: (error) => {
        console.error('Error loading attendance rules:', error);
        this.error = 'Failed to load attendance rules';
      }
    });
  }

  mapDataToForm(): void {
    if (!this.attendanceRulesData?.object_info?.settings?.part_time) return;

    const partTimeSettings = this.attendanceRulesData.object_info.settings.part_time;

    // Map Grace Period
    this.allowGrace = partTimeSettings.grace_period?.status || false;
    this.graceMinutes = partTimeSettings.grace_period?.minutes || 0;

    // Map Lateness entries to new structure with occurrences and deduction rules
    // New API structure: array of occurrences, each with index and list of rules
    if (partTimeSettings.lateness && partTimeSettings.lateness.length > 0) {
      this.latenessOccurrences = partTimeSettings.lateness
        .sort((a: any, b: any) => (a?.index ?? 0) - (b?.index ?? 0))
        .map((occurrence: any, occurrenceIndex: number) => {
          // Each occurrence has an index and a list of rules
          const rules = occurrence.list && Array.isArray(occurrence.list)
            ? occurrence.list
              .sort((a: any, b: any) => (a?.index ?? 0) - (b?.index ?? 0))
              .map((rule: any) => ({
                thresholdTime: rule.minutes !== null && rule.minutes !== undefined
                  ? Number(rule.minutes)
                  : null,
                deductionValue: rule.value !== null && rule.value !== undefined
                  ? Number(rule.value)
                  : null,
                deductionBase: rule.salary_portion_index !== null && rule.salary_portion_index !== undefined
                  ? Number(rule.salary_portion_index)
                  : null
              }))
            : [];

          return {
            isExpanded: occurrenceIndex === 0, // Expand first occurrence by default
            deductionRules: rules.length > 0 ? rules : [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
          };
        });

      // Initialize validation errors
      this.latenessValidationErrors = {};
      this.latenessOccurrences.forEach((occurrence, occurrenceIndex) => {
        this.latenessValidationErrors[occurrenceIndex] = {};
        occurrence.deductionRules.forEach((_, ruleIndex) => {
          this.latenessValidationErrors[occurrenceIndex][ruleIndex] = {
            thresholdTime: false,
            deductionValue: false,
            deductionBase: false
          };
        });
      });
    } else {
      // Default structure if no data
      this.latenessOccurrences = [
        {
          isExpanded: true,
          deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
        }
      ];
      this.latenessValidationErrors = {
        0: { 0: { thresholdTime: false, deductionValue: false, deductionBase: false } }
      };
    }

    // Legacy support - keep latenessEntries for backward compatibility
    this.latenessEntries = [{ value: null, salaryPortionIndex: null }];

    // Map Early Leave entries
    // New API structure: array of occurrences, each with index and list of rules
    // Same structure as lateness
    if (partTimeSettings.early_leave && partTimeSettings.early_leave.length > 0) {
      this.earlyLeaveOccurrences = partTimeSettings.early_leave
        .sort((a: any, b: any) => (a?.index ?? 0) - (b?.index ?? 0))
        .map((occurrence: any, occurrenceIndex: number) => {
          // Each occurrence has an index and a list of rules
          const rules = occurrence.list && Array.isArray(occurrence.list)
            ? occurrence.list
              .sort((a: any, b: any) => (a?.index ?? 0) - (b?.index ?? 0))
              .map((rule: any) => ({
                thresholdTime: rule.minutes !== null && rule.minutes !== undefined
                  ? Number(rule.minutes)
                  : null,
                deductionValue: rule.value !== null && rule.value !== undefined
                  ? Number(rule.value)
                  : null,
                deductionBase: rule.salary_portion_index !== null && rule.salary_portion_index !== undefined
                  ? Number(rule.salary_portion_index)
                  : null
              }))
            : [];

          return {
            isExpanded: occurrenceIndex === 0, // Expand first occurrence by default
            deductionRules: rules.length > 0 ? rules : [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
          };
        });

      // Set first occurrence to expanded, others to collapsed
      if (this.earlyLeaveOccurrences.length > 0) {
        this.earlyLeaveOccurrences[0].isExpanded = true;
        for (let i = 1; i < this.earlyLeaveOccurrences.length; i++) {
          this.earlyLeaveOccurrences[i].isExpanded = false;
        }
      }
    } else {
      // No API data - create empty structure
      this.earlyLeaveOccurrences = [
        {
          isExpanded: true,
          deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
        }
      ];
    }

    // Initialize validation errors for early leave
    this.earlyLeaveValidationErrors = {};
    this.earlyLeaveOccurrences.forEach((occurrence, occurrenceIndex) => {
      this.earlyLeaveValidationErrors[occurrenceIndex] = {};
      occurrence.deductionRules.forEach((_, ruleIndex) => {
        this.earlyLeaveValidationErrors[occurrenceIndex][ruleIndex] = {
          thresholdTime: false,
          deductionValue: false,
          deductionBase: false
        };
      });
    });

    // Map Time Gaps entries
    // New API structure: array of occurrences, each with index and list of rules
    // Same structure as lateness and early leave
    if (partTimeSettings.time_gaps && partTimeSettings.time_gaps.length > 0) {
      this.timeGapsOccurrences = partTimeSettings.time_gaps
        .sort((a: any, b: any) => (a?.index ?? 0) - (b?.index ?? 0))
        .map((occurrence: any, occurrenceIndex: number) => {
          // Each occurrence has an index and a list of rules
          const rules = occurrence.list && Array.isArray(occurrence.list)
            ? occurrence.list
              .sort((a: any, b: any) => (a?.index ?? 0) - (b?.index ?? 0))
              .map((rule: any) => ({
                thresholdTime: rule.minutes !== null && rule.minutes !== undefined
                  ? Number(rule.minutes)
                  : null,
                deductionValue: rule.value !== null && rule.value !== undefined
                  ? Number(rule.value)
                  : null,
                deductionBase: rule.salary_portion_index !== null && rule.salary_portion_index !== undefined
                  ? Number(rule.salary_portion_index)
                  : null
              }))
            : [];

          return {
            isExpanded: occurrenceIndex === 0, // Expand first occurrence by default
            deductionRules: rules.length > 0 ? rules : [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
          };
        });

      // Set first occurrence to expanded, others to collapsed
      if (this.timeGapsOccurrences.length > 0) {
        this.timeGapsOccurrences[0].isExpanded = true;
        for (let i = 1; i < this.timeGapsOccurrences.length; i++) {
          this.timeGapsOccurrences[i].isExpanded = false;
        }
      }
    } else {
      // No API data - create empty structure
      this.timeGapsOccurrences = [
        {
          isExpanded: true,
          deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
        }
      ];
    }

    // Initialize validation errors for time gaps
    this.timeGapsValidationErrors = {};
    this.timeGapsOccurrences.forEach((occurrence, occurrenceIndex) => {
      this.timeGapsValidationErrors[occurrenceIndex] = {};
      occurrence.deductionRules.forEach((_, ruleIndex) => {
        this.timeGapsValidationErrors[occurrenceIndex][ruleIndex] = {
          thresholdTime: false,
          deductionValue: false,
          deductionBase: false
        };
      });
    });

    // Map Absence entries
    if (partTimeSettings.absence && partTimeSettings.absence.length > 0) {
      this.absenceEntries = [...partTimeSettings.absence]
        .sort((a: any, b: any) => (a?.index ?? 0) - (b?.index ?? 0))
        .map((item: any) => ({
          value: item.value !== null && item.value !== undefined
            ? Number(item.value)
            : null,
          salaryPortionIndex: item.salary_portion_index !== null && item.salary_portion_index !== undefined
            ? Number(item.salary_portion_index)
            : null
        }));
    } else {
      this.absenceEntries = [{ value: null, salaryPortionIndex: null }];
    }
    this.absenceValidationErrors = {};
    this.absenceEntries.forEach((_, index) => {
      this.absenceValidationErrors[index] = { value: false, salaryPortion: false };
    });

    // Map Overtime settings
    const overtimeSettings = (partTimeSettings as any).overtime;
    if (overtimeSettings) {
      this.allowOvertime = overtimeSettings.flat_rate?.status || overtimeSettings.custom_hours?.status || false;

      if (overtimeSettings.flat_rate?.status) {
        this.overtimeType = 'flatRate';
        this.flatRateValue = overtimeSettings.flat_rate.value?.toString() || '';
        this.flatRateSalaryPortionIndex = overtimeSettings.flat_rate.salary_portion_index !== null && overtimeSettings.flat_rate.salary_portion_index !== undefined
          ? Number(overtimeSettings.flat_rate.salary_portion_index)
          : null;
      } else if (overtimeSettings.custom_hours?.status) {
        this.overtimeType = 'customHours';
        if (overtimeSettings.custom_hours.value && overtimeSettings.custom_hours.value.length > 0) {
          this.overtimeEntries = [...overtimeSettings.custom_hours.value]
            .map((item: any) => ({
              from: item.from_time || '',
              to: item.to_time || '',
              rate: item.rate !== null && item.rate !== undefined
                ? Number(item.rate)
                : null,
              salaryPortionIndex: item.salary_portion_index !== null && item.salary_portion_index !== undefined
                ? Number(item.salary_portion_index)
                : null
            }));
        } else {
          this.overtimeEntries = [{ from: '', to: '', rate: null, salaryPortionIndex: null }];
        }
      }
    }


    this.originalData = JSON.parse(JSON.stringify({
      allowGrace: this.allowGrace,
      graceMinutes: this.graceMinutes,
      latenessOccurrences: this.latenessOccurrences,
      earlyLeaveOccurrences: this.earlyLeaveOccurrences,
      timeGapsOccurrences: this.timeGapsOccurrences,
      allowOvertime: this.allowOvertime,
      overtimeType: this.overtimeType,
      flatRateValue: this.flatRateValue,
      flatRateSalaryPortionIndex: this.flatRateSalaryPortionIndex,
      overtimeEntries: this.overtimeEntries,
      absenceEntries: this.absenceEntries
    }));

  }

  hasChanges(): boolean {
    if (!this.originalData) return false;

    const current = {
      allowGrace: this.allowGrace,
      graceMinutes: this.graceMinutes,
      latenessOccurrences: this.latenessOccurrences,
      earlyLeaveOccurrences: this.earlyLeaveOccurrences,
      timeGapsOccurrences: this.timeGapsOccurrences,
      allowOvertime: this.allowOvertime,
      overtimeType: this.overtimeType,
      flatRateValue: this.flatRateValue,
      flatRateSalaryPortionIndex: this.flatRateSalaryPortionIndex,
      overtimeEntries: this.overtimeEntries,
      absenceEntries: this.absenceEntries
    };
    return JSON.stringify(current) !== JSON.stringify(this.originalData);
  }


  // step 1 - Grace Period
  allowGrace: boolean = false;
  graceMinutes: number = 0;

  // step 2 - Lateness
  // New structure: Each occurrence has multiple deduction rules
  latenessOccurrences: LatenessOccurrence[] = [
    {
      isExpanded: true,
      deductionRules: [
        { thresholdTime: null, deductionValue: null, deductionBase: null }
      ]
    },
    {
      isExpanded: false,
      deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
    },
    {
      isExpanded: false,
      deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
    }
  ];

  salaryPortions: { name: string; percentage: number | string; index: number }[] = [];
  salaryPortionsLoading: boolean = false;
  latenessValidationErrors: { [occurrenceIndex: number]: { [ruleIndex: number]: { thresholdTime: boolean; deductionValue: boolean; deductionBase: boolean } } } = {};

  // Legacy support - keep for backward compatibility during migration
  latenessEntries = [{ value: null as number | null, salaryPortionIndex: null as number | null }];

  toggleOccurrenceExpanded(occurrenceIndex: number) {
    if (this.latenessOccurrences[occurrenceIndex]) {
      this.latenessOccurrences[occurrenceIndex].isExpanded = !this.latenessOccurrences[occurrenceIndex].isExpanded;
    }
  }

  addLatenessOccurrence() {
    this.latenessOccurrences.push({
      isExpanded: false,
      deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
    });
  }

  removeLatenessOccurrence(occurrenceIndex: number) {
    if (this.latenessOccurrences.length > 1) {
      this.latenessOccurrences.splice(occurrenceIndex, 1);
      // Clean up validation errors
      const newErrors: { [key: number]: { [ruleIndex: number]: { thresholdTime: boolean; deductionValue: boolean; deductionBase: boolean } } } = {};
      Object.keys(this.latenessValidationErrors).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex < occurrenceIndex) {
          newErrors[oldIndex] = this.latenessValidationErrors[oldIndex];
        } else if (oldIndex > occurrenceIndex) {
          newErrors[oldIndex - 1] = this.latenessValidationErrors[oldIndex];
        }
      });
      this.latenessValidationErrors = newErrors;
    }
  }

  addLatenessDeductionRule(occurrenceIndex: number) {
    if (this.latenessOccurrences[occurrenceIndex]) {
      this.latenessOccurrences[occurrenceIndex].deductionRules.push({
        thresholdTime: null,
        deductionValue: null,
        deductionBase: null
      });
    }
  }

  removeLatenessDeductionRule(occurrenceIndex: number, ruleIndex: number) {
    if (this.latenessOccurrences[occurrenceIndex] && this.latenessOccurrences[occurrenceIndex].deductionRules.length > 1) {
      this.latenessOccurrences[occurrenceIndex].deductionRules.splice(ruleIndex, 1);
      // Clean up validation errors for this rule
      if (this.latenessValidationErrors[occurrenceIndex]) {
        const newRuleErrors: { [key: number]: { thresholdTime: boolean; deductionValue: boolean; deductionBase: boolean } } = {};
        Object.keys(this.latenessValidationErrors[occurrenceIndex]).forEach(key => {
          const oldRuleIndex = parseInt(key);
          if (oldRuleIndex < ruleIndex) {
            newRuleErrors[oldRuleIndex] = this.latenessValidationErrors[occurrenceIndex][oldRuleIndex];
          } else if (oldRuleIndex > ruleIndex) {
            newRuleErrors[oldRuleIndex - 1] = this.latenessValidationErrors[occurrenceIndex][oldRuleIndex];
          }
        });
        this.latenessValidationErrors[occurrenceIndex] = newRuleErrors;
      }
    }
  }

  clearLatenessValidationError(occurrenceIndex: number, ruleIndex: number, field: 'thresholdTime' | 'deductionValue' | 'deductionBase') {
    if (this.latenessValidationErrors[occurrenceIndex] && this.latenessValidationErrors[occurrenceIndex][ruleIndex]) {
      this.latenessValidationErrors[occurrenceIndex][ruleIndex][field] = false;
    }
  }

  getOccurrenceLabel(index: number): string {
    const labels = ['1st time', '2nd time', '3rd time'];
    return labels[index] || `${index + 1}th time`;
  }

  // Legacy methods - keep for backward compatibility
  addLatenessRow() {
    this.addLatenessOccurrence();
  }

  removeLatenessRow(index: number) {
    this.removeLatenessOccurrence(index);
  }

  // step 3 - Early Leave
  // New structure: Each occurrence has multiple deduction rules
  earlyLeaveOccurrences: EarlyLeaveOccurrence[] = [
    {
      isExpanded: true,
      deductionRules: [
        { thresholdTime: 15, deductionValue: 0.25, deductionBase: null }, // Will be set to "Base" if available
        { thresholdTime: null, deductionValue: null, deductionBase: null }
      ]
    },
    {
      isExpanded: false,
      deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
    },
    {
      isExpanded: false,
      deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
    }
  ];

  earlyLeaveValidationErrors: { [occurrenceIndex: number]: { [ruleIndex: number]: { thresholdTime: boolean; deductionValue: boolean; deductionBase: boolean } } } = {};
  sameAsLateness: boolean = false;

  toggleEarlyLeaveOccurrenceExpanded(occurrenceIndex: number) {
    if (this.earlyLeaveOccurrences[occurrenceIndex]) {
      this.earlyLeaveOccurrences[occurrenceIndex].isExpanded = !this.earlyLeaveOccurrences[occurrenceIndex].isExpanded;
    }
  }

  addEarlyLeaveOccurrence() {
    this.earlyLeaveOccurrences.push({
      isExpanded: false,
      deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
    });
    const newIndex = this.earlyLeaveOccurrences.length - 1;
    this.earlyLeaveValidationErrors[newIndex] = { 0: { thresholdTime: false, deductionValue: false, deductionBase: false } };
  }

  removeEarlyLeaveOccurrence(occurrenceIndex: number) {
    if (this.earlyLeaveOccurrences.length > 1) {
      this.earlyLeaveOccurrences.splice(occurrenceIndex, 1);
      // Clean up validation errors
      const newErrors: { [key: number]: { [ruleIndex: number]: { thresholdTime: boolean; deductionValue: boolean; deductionBase: boolean } } } = {};
      Object.keys(this.earlyLeaveValidationErrors).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex < occurrenceIndex) {
          newErrors[oldIndex] = this.earlyLeaveValidationErrors[oldIndex];
        } else if (oldIndex > occurrenceIndex) {
          newErrors[oldIndex - 1] = this.earlyLeaveValidationErrors[oldIndex];
        }
      });
      this.earlyLeaveValidationErrors = newErrors;
    }
  }

  addEarlyLeaveDeductionRule(occurrenceIndex: number) {
    if (this.earlyLeaveOccurrences[occurrenceIndex]) {
      this.earlyLeaveOccurrences[occurrenceIndex].deductionRules.push({
        thresholdTime: null,
        deductionValue: null,
        deductionBase: null
      });
      const ruleIndex = this.earlyLeaveOccurrences[occurrenceIndex].deductionRules.length - 1;
      if (!this.earlyLeaveValidationErrors[occurrenceIndex]) {
        this.earlyLeaveValidationErrors[occurrenceIndex] = {};
      }
      this.earlyLeaveValidationErrors[occurrenceIndex][ruleIndex] = {
        thresholdTime: false,
        deductionValue: false,
        deductionBase: false
      };
    }
  }

  removeEarlyLeaveDeductionRule(occurrenceIndex: number, ruleIndex: number) {
    if (this.earlyLeaveOccurrences[occurrenceIndex] &&
      this.earlyLeaveOccurrences[occurrenceIndex].deductionRules.length > 1) {
      this.earlyLeaveOccurrences[occurrenceIndex].deductionRules.splice(ruleIndex, 1);
      // Clean up validation errors for this occurrence
      if (this.earlyLeaveValidationErrors[occurrenceIndex]) {
        const newRuleErrors: { [ruleIndex: number]: { thresholdTime: boolean; deductionValue: boolean; deductionBase: boolean } } = {};
        Object.keys(this.earlyLeaveValidationErrors[occurrenceIndex]).forEach(key => {
          const oldRuleIndex = parseInt(key);
          if (oldRuleIndex < ruleIndex) {
            newRuleErrors[oldRuleIndex] = this.earlyLeaveValidationErrors[occurrenceIndex][oldRuleIndex];
          } else if (oldRuleIndex > ruleIndex) {
            newRuleErrors[oldRuleIndex - 1] = this.earlyLeaveValidationErrors[occurrenceIndex][oldRuleIndex];
          }
        });
        this.earlyLeaveValidationErrors[occurrenceIndex] = newRuleErrors;
      }
    }
  }

  clearEarlyLeaveValidationError(occurrenceIndex: number, ruleIndex: number, field: 'thresholdTime' | 'deductionValue' | 'deductionBase'): void {
    if (this.earlyLeaveValidationErrors[occurrenceIndex] && this.earlyLeaveValidationErrors[occurrenceIndex][ruleIndex]) {
      this.earlyLeaveValidationErrors[occurrenceIndex][ruleIndex][field] = false;
    }
  }

  // step 3 - Time Gaps
  // New structure: Each occurrence has multiple deduction rules
  timeGapsOccurrences: TimeGapsOccurrence[] = [
    {
      isExpanded: true,
      deductionRules: [
        { thresholdTime: null, deductionValue: null, deductionBase: null }
      ]
    },
    {
      isExpanded: false,
      deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
    },
    {
      isExpanded: false,
      deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
    }
  ];

  timeGapsValidationErrors: { [occurrenceIndex: number]: { [ruleIndex: number]: { thresholdTime: boolean; deductionValue: boolean; deductionBase: boolean } } } = {};

  toggleTimeGapsOccurrenceExpanded(occurrenceIndex: number) {
    if (this.timeGapsOccurrences[occurrenceIndex]) {
      this.timeGapsOccurrences[occurrenceIndex].isExpanded = !this.timeGapsOccurrences[occurrenceIndex].isExpanded;
    }
  }

  addTimeGapsOccurrence() {
    this.timeGapsOccurrences.push({
      isExpanded: false,
      deductionRules: [{ thresholdTime: null, deductionValue: null, deductionBase: null }]
    });
    const newIndex = this.timeGapsOccurrences.length - 1;
    this.timeGapsValidationErrors[newIndex] = { 0: { thresholdTime: false, deductionValue: false, deductionBase: false } };
  }

  removeTimeGapsOccurrence(occurrenceIndex: number) {
    if (this.timeGapsOccurrences.length > 1) {
      this.timeGapsOccurrences.splice(occurrenceIndex, 1);
      // Clean up validation errors
      const newErrors: { [key: number]: { [ruleIndex: number]: { thresholdTime: boolean; deductionValue: boolean; deductionBase: boolean } } } = {};
      Object.keys(this.timeGapsValidationErrors).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex < occurrenceIndex) {
          newErrors[oldIndex] = this.timeGapsValidationErrors[oldIndex];
        } else if (oldIndex > occurrenceIndex) {
          newErrors[oldIndex - 1] = this.timeGapsValidationErrors[oldIndex];
        }
      });
      this.timeGapsValidationErrors = newErrors;
    }
  }

  addTimeGapsDeductionRule(occurrenceIndex: number) {
    if (this.timeGapsOccurrences[occurrenceIndex]) {
      this.timeGapsOccurrences[occurrenceIndex].deductionRules.push({
        thresholdTime: null,
        deductionValue: null,
        deductionBase: null
      });
      const ruleIndex = this.timeGapsOccurrences[occurrenceIndex].deductionRules.length - 1;
      if (!this.timeGapsValidationErrors[occurrenceIndex]) {
        this.timeGapsValidationErrors[occurrenceIndex] = {};
      }
      this.timeGapsValidationErrors[occurrenceIndex][ruleIndex] = {
        thresholdTime: false,
        deductionValue: false,
        deductionBase: false
      };
    }
  }

  removeTimeGapsDeductionRule(occurrenceIndex: number, ruleIndex: number) {
    if (this.timeGapsOccurrences[occurrenceIndex] &&
      this.timeGapsOccurrences[occurrenceIndex].deductionRules.length > 1) {
      this.timeGapsOccurrences[occurrenceIndex].deductionRules.splice(ruleIndex, 1);
      // Clean up validation errors for this occurrence
      if (this.timeGapsValidationErrors[occurrenceIndex]) {
        const newRuleErrors: { [ruleIndex: number]: { thresholdTime: boolean; deductionValue: boolean; deductionBase: boolean } } = {};
        Object.keys(this.timeGapsValidationErrors[occurrenceIndex]).forEach(key => {
          const oldRuleIndex = parseInt(key);
          if (oldRuleIndex < ruleIndex) {
            newRuleErrors[oldRuleIndex] = this.timeGapsValidationErrors[occurrenceIndex][oldRuleIndex];
          } else if (oldRuleIndex > ruleIndex) {
            newRuleErrors[oldRuleIndex - 1] = this.timeGapsValidationErrors[occurrenceIndex][oldRuleIndex];
          }
        });
        this.timeGapsValidationErrors[occurrenceIndex] = newRuleErrors;
      }
    }
  }

  clearTimeGapsValidationError(occurrenceIndex: number, ruleIndex: number, field: 'thresholdTime' | 'deductionValue' | 'deductionBase'): void {
    if (this.timeGapsValidationErrors[occurrenceIndex] && this.timeGapsValidationErrors[occurrenceIndex][ruleIndex]) {
      this.timeGapsValidationErrors[occurrenceIndex][ruleIndex][field] = false;
    }
  }

  // step 4 - Absence
  absenceEntries = [{ value: null as number | null, salaryPortionIndex: null as number | null }];
  absenceValidationErrors: { [key: number]: { value: boolean; salaryPortion: boolean } } = {};

  addAbsenceRow() {
    this.absenceEntries.push({ value: null, salaryPortionIndex: null });
    const newIndex = this.absenceEntries.length - 1;
    this.absenceValidationErrors[newIndex] = { value: false, salaryPortion: false };
  }

  removeAbsenceRow(index: number) {
    if (this.absenceEntries.length > 1) {
      this.absenceEntries.splice(index, 1);

      // Clean up and re-index validation errors
      const newErrors: { [key: number]: { value: boolean; salaryPortion: boolean } } = {};
      Object.keys(this.absenceValidationErrors).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex < index) {
          newErrors[oldIndex] = this.absenceValidationErrors[oldIndex];
        } else if (oldIndex > index) {
          newErrors[oldIndex - 1] = this.absenceValidationErrors[oldIndex];
        }
      });
      this.absenceValidationErrors = newErrors;
    }
  }

  // step 5 - Overtime
  allowOvertime: boolean = false;
  overtimeType: string = 'flatRate';
  flatRateValue: string = '';
  flatRateSalaryPortionIndex: number | null = null;
  overtimeEntries = [{ from: '', to: '', rate: null as number | null, salaryPortionIndex: null as number | null }];

  addOvertimeRow() {
    this.overtimeEntries.push({ from: '', to: '', rate: null, salaryPortionIndex: null });
  }

  removeOvertimeRow(index: number) {
    if (this.overtimeEntries.length > 1) {
      this.overtimeEntries.splice(index, 1);
    }
  }

  // steps navigation
  currentStep = 1;
  isLoading: boolean = false;
  isSaving: boolean = false;

  /**
   * Header title reflects the current active tab
   */
  getHeaderTitle(): string {
    const labels: { [key: number]: string } = {
      1: 'Lateness',
      2: 'Early Leave',
      3: 'Time Gaps',
      4: 'Absence',
      5: 'Overtime',
      6: 'Grace Period'
    };
    const label = labels[this.currentStep] || '';
    return `Edit ${label} - Part Time`;
  }

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
      this.validateTimeGapsStep();
      if (!this.isStepValid(this.currentStep)) {
        return; // Don't proceed if validation fails
      }
    } else if (this.currentStep === 4) {
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
    this.latenessOccurrences.forEach((occurrence, occurrenceIndex) => {
      this.latenessValidationErrors[occurrenceIndex] = {};
      occurrence.deductionRules.forEach((rule, ruleIndex) => {
        this.latenessValidationErrors[occurrenceIndex][ruleIndex] = {
          thresholdTime: rule.thresholdTime === null || rule.thresholdTime === undefined,
          deductionValue: rule.deductionValue === null || rule.deductionValue === undefined,
          deductionBase: rule.deductionBase === null || rule.deductionBase === undefined
        };
      });
    });
  }

  validateEarlyLeaveStep(): void {
    this.earlyLeaveValidationErrors = {};
    this.earlyLeaveOccurrences.forEach((occurrence, occurrenceIndex) => {
      this.earlyLeaveValidationErrors[occurrenceIndex] = {};
      occurrence.deductionRules.forEach((rule, ruleIndex) => {
        this.earlyLeaveValidationErrors[occurrenceIndex][ruleIndex] = {
          thresholdTime: rule.thresholdTime === null || rule.thresholdTime === undefined,
          deductionValue: rule.deductionValue === null || rule.deductionValue === undefined,
          deductionBase: rule.deductionBase === null || rule.deductionBase === undefined
        };
      });
    });
  }

  validateTimeGapsStep(): void {
    this.timeGapsValidationErrors = {};
    this.timeGapsOccurrences.forEach((occurrence, occurrenceIndex) => {
      this.timeGapsValidationErrors[occurrenceIndex] = {};
      occurrence.deductionRules.forEach((rule, ruleIndex) => {
        this.timeGapsValidationErrors[occurrenceIndex][ruleIndex] = {
          thresholdTime: rule.thresholdTime === null || rule.thresholdTime === undefined,
          deductionValue: rule.deductionValue === null || rule.deductionValue === undefined,
          deductionBase: rule.deductionBase === null || rule.deductionBase === undefined
        };
      });
    });
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
    const maxStep = 6;
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
        this.validateTimeGapsStep();
      } else if (i === 3) {
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
        return this.latenessOccurrences.length > 0 &&
          this.latenessOccurrences.every(occurrence =>
            occurrence.deductionRules.length > 0 &&
            occurrence.deductionRules.every(rule =>
              rule.thresholdTime !== null && rule.thresholdTime !== undefined &&
              rule.deductionValue !== null && rule.deductionValue !== undefined &&
              rule.deductionBase !== null && rule.deductionBase !== undefined
            )
          );

      case 2: // Early Leave
        return this.earlyLeaveOccurrences.length > 0 &&
          this.earlyLeaveOccurrences.every(occurrence =>
            occurrence.deductionRules.length > 0 &&
            occurrence.deductionRules.every(rule =>
              rule.thresholdTime !== null && rule.thresholdTime !== undefined &&
              rule.deductionValue !== null && rule.deductionValue !== undefined &&
              rule.deductionBase !== null && rule.deductionBase !== undefined
            )
          );

      case 3: // Time Gaps
        return this.timeGapsOccurrences.length > 0 &&
          this.timeGapsOccurrences.every(occurrence =>
            occurrence.deductionRules.length > 0 &&
            occurrence.deductionRules.every(rule =>
              rule.thresholdTime !== null && rule.thresholdTime !== undefined &&
              rule.deductionValue !== null && rule.deductionValue !== undefined &&
              rule.deductionBase !== null && rule.deductionBase !== undefined
            )
          );

      case 4: // Absence
        return this.absenceEntries.length > 0 &&
          this.absenceEntries.every(entry =>
            entry.value !== null && entry.value !== undefined &&
            entry.salaryPortionIndex !== null && entry.salaryPortionIndex !== undefined
          );

      case 5: // Overtime
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

      case 6: // Grace Period
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

  // Helper function to build occurrences with sequential indices across all occurrences
  private buildOccurrencesWithSequentialIndices(occurrences: LatenessOccurrence[] | EarlyLeaveOccurrence[]): any[] {
    let globalRuleIndex = 1; // Start from 1 for sequential indices across all occurrences

    return occurrences.map((occurrence, occurrenceIndex) => {
      // Filter out empty rules (where all fields are null)
      const validRules = occurrence.deductionRules.filter(rule =>
        rule.thresholdTime !== null && rule.thresholdTime !== undefined &&
        rule.deductionValue !== null && rule.deductionValue !== undefined &&
        rule.deductionBase !== null && rule.deductionBase !== undefined
      );

      // Map rules with sequential indices
      const rulesWithIndices = validRules.map((rule) => {
        const ruleData = {
          index: globalRuleIndex++,
          minutes: rule.thresholdTime,
          value: rule.deductionValue,
          salary_portion_index: rule.deductionBase
        };
        return ruleData;
      });

      return {
        index: occurrenceIndex + 1,
        list: rulesWithIndices
      };
    }).filter(occurrence => occurrence.list.length > 0);
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
      this.validateTimeGapsStep();
      return;
    }
    if (!this.isStepValid(4)) {
      this.currentStep = 4;
      this.validateAbsenceStep();
      return;
    }
    if (!this.isStepValid(5)) {
      this.currentStep = 5;
      return;
    }
    if (!this.isStepValid(6)) {
      this.currentStep = 6;
      return;
    }

    this.isSaving = true;

    // Get existing full_time settings from API data
    const existingFullTimeSettings = this.attendanceRulesData.object_info.settings.full_time;

    const requestData = {
      request_data: {
        settings: {
          full_time: {
            // Preserve existing full_time structure (same as part_time - occurrences with lists)
            lateness: existingFullTimeSettings.lateness && Array.isArray(existingFullTimeSettings.lateness)
              ? existingFullTimeSettings.lateness.map((occurrence: any) => ({
                index: occurrence.index,
                list: occurrence.list && Array.isArray(occurrence.list)
                  ? occurrence.list.map((rule: any) => ({
                    index: rule.index,
                    minutes: rule.minutes,
                    value: rule.value,
                    salary_portion_index: rule.salary_portion_index
                  }))
                  : []
              }))
              : [],
            early_leave: existingFullTimeSettings.early_leave && Array.isArray(existingFullTimeSettings.early_leave)
              ? existingFullTimeSettings.early_leave.map((occurrence: any) => ({
                index: occurrence.index,
                list: occurrence.list && Array.isArray(occurrence.list)
                  ? occurrence.list.map((rule: any) => ({
                    index: rule.index,
                    minutes: rule.minutes,
                    value: rule.value,
                    salary_portion_index: rule.salary_portion_index
                  }))
                  : []
              }))
              : [],
            time_gaps: existingFullTimeSettings.time_gaps && Array.isArray(existingFullTimeSettings.time_gaps)
              ? existingFullTimeSettings.time_gaps.map((occurrence: any) => ({
                index: occurrence.index,
                list: occurrence.list && Array.isArray(occurrence.list)
                  ? occurrence.list.map((rule: any) => ({
                    index: rule.index,
                    minutes: rule.minutes,
                    value: rule.value,
                    salary_portion_index: rule.salary_portion_index
                  }))
                  : []
              }))
              : [],
            absence: (existingFullTimeSettings.absence || []).map((item: any) => ({
              index: item.index || 0,
              value: item.value || 0,
              salary_portion_index: item.salary_portion_index !== null && item.salary_portion_index !== undefined
                ? Number(item.salary_portion_index)
                : 1  // Default to 1 if not set
            })),
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
                value: parseFloat(((existingFullTimeSettings as any).overtime.flat_rate.value || 0).toString()),
                salary_portion_index: (existingFullTimeSettings as any).overtime.flat_rate.salary_portion_index !== null && (existingFullTimeSettings as any).overtime.flat_rate.salary_portion_index !== undefined
                  ? Number((existingFullTimeSettings as any).overtime.flat_rate.salary_portion_index)
                  : 1
              } : {
                status: false,
                value: 0.0,
                salary_portion_index: 1
              },
              custom_hours: (existingFullTimeSettings as any).overtime?.custom_hours ? {
                status: (existingFullTimeSettings as any).overtime.custom_hours.status,
                value: (existingFullTimeSettings as any).overtime.custom_hours.value.map((item: any) => ({
                  from_time: item.from_time || '0:0',
                  to_time: item.to_time || '0:0',
                  rate: parseFloat((item.rate || 0).toString())
                  // salary_portion_index: item.salary_portion_index !== null && item.salary_portion_index !== undefined
                  //   ? Number(item.salary_portion_index)
                  //   : 1
                }))
              } : {
                status: false,
                value: [{ from_time: '0:0', to_time: '0:0', rate: 0.0 }]
              }
            }
          },
          part_time: {
            lateness: this.buildOccurrencesWithSequentialIndices(this.latenessOccurrences),
            early_leave: this.buildOccurrencesWithSequentialIndices(this.earlyLeaveOccurrences),
            time_gaps: this.buildOccurrencesWithSequentialIndices(this.timeGapsOccurrences),
            absence: this.absenceEntries.map((entry, index) => ({
              index: index + 1,
              value: entry.value || 0,
              salary_portion_index: entry.salaryPortionIndex !== null && entry.salaryPortionIndex !== undefined
                ? Number(entry.salaryPortionIndex)
                : 0
            })).filter(entry => entry.value !== null && entry.value !== undefined),
            grace_period: {
              status: this.allowGrace,
              minutes: parseFloat((this.graceMinutes || 0).toString())
            },
            overtime: {
              flat_rate: {
                status: this.allowOvertime && this.overtimeType === 'flatRate',
                value: parseFloat((this.overtimeType === 'flatRate' ? parseFloat(this.flatRateValue) || 0 : 0).toString()),
                salary_portion_index: this.overtimeType === 'flatRate' && this.flatRateSalaryPortionIndex !== null && this.flatRateSalaryPortionIndex !== undefined
                  ? Number(this.flatRateSalaryPortionIndex)
                  : 1
              },
              custom_hours: {
                status: this.allowOvertime && this.overtimeType === 'customHours',
                value: this.overtimeType === 'customHours' ? this.overtimeEntries.map((entry) => ({
                  from_time: entry.from || '0:0',
                  to_time: entry.to || '0:0',
                  rate: parseFloat((entry.rate || 0).toString())
                  // salary_portion_index: entry.salaryPortionIndex !== null && entry.salaryPortionIndex !== undefined
                  //   ? Number(entry.salaryPortionIndex)
                  //   : 1
                })) : [{ from_time: '0:0', to_time: '0:0', rate: 0.0 }]
              }
            }
          }
        }
      }
    };


    // Send data to API
    this.attendanceRulesService.updateAttendanceRules(requestData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if percentage should be displayed
   */
  shouldShowPercentage(percentage: number | string | null | undefined): boolean {
    if (percentage == null) return false;
    const str = String(percentage).trim();
    return str !== '';
  }
}
