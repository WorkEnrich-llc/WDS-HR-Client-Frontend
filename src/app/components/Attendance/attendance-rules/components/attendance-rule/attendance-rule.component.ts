import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';
import { RouterLink } from '@angular/router';

import { AttendanceRulesService } from '../../service/attendance-rules.service';
import { AttendanceRulesData, WorkTypeSettings } from '../../models/attendance-rules.interface';

@Component({
  selector: 'app-attendance-rule',
  imports: [PageHeaderComponent, RouterLink],
  templateUrl: './attendance-rule.component.html',
  styleUrls: ['../../../../shared/table/table.component.css', './attendance-rule.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AttendanceRuleComponent implements OnInit {
  attendanceRulesData: AttendanceRulesData | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(private attendanceRulesService: AttendanceRulesService) { }

  ngOnInit(): void {
    this.loadAttendanceRules();
  }

  loadAttendanceRules(): void {
    this.loading = true;
    this.attendanceRulesService.getAttendanceRules().subscribe({
      next: (response) => {
        this.attendanceRulesData = response?.data;
        // console.log(this.attendanceRulesData);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendance rules:', error);
        this.error = 'Failed to load attendance rules';
        this.loading = false;
      }
    });
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
}
