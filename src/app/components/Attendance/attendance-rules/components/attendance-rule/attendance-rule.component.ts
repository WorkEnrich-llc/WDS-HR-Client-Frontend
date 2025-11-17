import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { AttendanceRulesService } from '../../service/attendance-rules.service';
import { AttendanceRulesData, WorkTypeSettings } from '../../models/attendance-rules.interface';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';

@Component({
  selector: 'app-attendance-rule',
  imports: [PageHeaderComponent, RouterLink],
  templateUrl: './attendance-rule.component.html',
  styleUrls: ['../../../../shared/table/table.component.css', './attendance-rule.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AttendanceRuleComponent implements OnInit, OnDestroy {
  attendanceRulesData: AttendanceRulesData | null = null;
  loading: boolean = true;
  salaryPortionsLoading: boolean = true;
  error: string | null = null;
  salaryPortions: any[] = [];
  private destroy$ = new Subject<void>();
  private salaryPortionsRequestInFlight = false;
  private attendanceRulesRequestInFlight = false;

  constructor(
    private attendanceRulesService: AttendanceRulesService,
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
    this.salaryPortionsService.single().pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.salaryPortionsLoading = false;
        this.salaryPortionsRequestInFlight = false;
      })
    ).subscribe({
      next: (response) => {
        if (response && response.settings && Array.isArray(response.settings)) {
          this.salaryPortions = response.settings.map((setting: any) => ({
            name: setting.name,
            percentage: setting.percentage,
            index: setting.index !== undefined ? setting.index : null
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
      },
      error: (error) => {
        console.error('Error loading attendance rules:', error);
        this.error = 'Failed to load attendance rules';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getFullTimeSettings(): WorkTypeSettings | null {
    return this.attendanceRulesData?.object_info?.settings?.full_time || null;
  }

  getPartTimeSettings(): WorkTypeSettings | null {
    return this.attendanceRulesData?.object_info?.settings?.part_time || null;
  }

  getGracePeriodText(settings: WorkTypeSettings | null): string {
    if (!settings?.grace_period) return 'No Grace Period';
    if (!settings.grace_period.status) return 'No Grace Period';
    const minutes = settings.grace_period.minutes;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours} Hour${hours > 1 ? 's' : ''} ${remainingMinutes} Minute${remainingMinutes > 1 ? 's' : ''} Per Day`
        : `${hours} Hour${hours > 1 ? 's' : ''} Per Day`;
    }
    return `${minutes} Minute${minutes > 1 ? 's' : ''} Per Day`;
  }

  getPenaltyValue(penalties: any[], index: number): string {
    const penalty = penalties?.find(p => p.index === index);
    return penalty ? `${penalty.value} day${penalty.value !== 1 ? 's' : ''}` : '-';
  }

  getPenaltyWithSalaryPortion(penalties: any[], occurrenceIndex: number): { value: string; salaryPortion: any } {
    const penalty = penalties?.find(p => p.index === occurrenceIndex);
    if (!penalty) {
      return { value: '-', salaryPortion: null };
    }

    const value = `${penalty.value} day${penalty.value !== 1 ? 's' : ''}`;
    const salaryPortionIndex = penalty.salary_portion_index !== null && penalty.salary_portion_index !== undefined
      ? Number(penalty.salary_portion_index)
      : 1; // Default to 1 if not set

    const salaryPortion = this.salaryPortions.find(sp => sp.index === salaryPortionIndex);

    return {
      value,
      salaryPortion: salaryPortion || null
    };
  }

  truncateName(name: string, maxLength: number = 6): string {
    if (!name || name.length <= maxLength) {
      return name;
    }
    return name.substring(0, maxLength) + '...';
  }

  getSalaryPortionDisplayText(salaryPortion: any): string {
    if (!salaryPortion) return '';
    return `${salaryPortion.name} (${salaryPortion.percentage}%)`;
  }
}
