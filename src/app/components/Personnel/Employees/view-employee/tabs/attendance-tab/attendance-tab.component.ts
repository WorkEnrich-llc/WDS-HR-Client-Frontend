import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';
import { EmployeeService } from '../../../../../../core/services/personnel/employees/employee.service';

interface RawAttendanceItem {
  emp_id: number;
  date: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  working_check_in: string | null;
  working_check_out: string | null;
  is_working_day: boolean;
  missing_hrs: number | null;
  deduction: number | null;
  work_hours?: string | null;
}

interface AttendanceRecord {
  in: string;
  out: string;
  date: string;
  dayType: string;
  workingHrs: string;
  missingHrs: string;
  deduction: string;
}

@Component({
  selector: 'app-attendance-tab',
  imports: [CommonModule, TableComponent],
  templateUrl: './attendance-tab.component.html',
  styleUrl: './attendance-tab.component.css'
})
export class AttendanceTabComponent implements OnChanges {
  @Input() employee: Employee | null = null;
  @Input() date: string | null = '2025-08-06'
  @Input() isEmployeeActive: boolean = false;

  attendanceData: AttendanceRecord[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(private employeeService: EmployeeService) { }

  ngOnChanges(changes: SimpleChanges) {
    // When employee or date changes, fetch attendance
    if ((changes['employee'] && this.employee) || (changes['date'] && this.date)) {
      this.fetchAttendance();
    }
  }

  private mapRawToRecord(item: RawAttendanceItem): AttendanceRecord {
    const formatTime = (t: string | null) => {
      if (!t || t === '-') return '-';
      // If time is full timestamp, take only time portion
      if (t.includes('T')) return t.split('T')[1].split('.')[0];
      if (t.includes('.')) return t.split('.')[0];
      return t;
    };

    return {
      in: formatTime(item.working_check_in || item.actual_check_in),
      out: formatTime(item.working_check_out || item.actual_check_out),
      date: item.date || '-',
      dayType: item.is_working_day ? 'Working Day' : 'Non-working Day',
      workingHrs: item.is_working_day ? (item.work_hours ? `${item.work_hours}` : '-') : 'Holiday',
      missingHrs: item.missing_hrs === null || item.missing_hrs === undefined ? '-' : `${item.missing_hrs} Hr${item.missing_hrs !== 1 ? 's' : ''}`,
      deduction: item.deduction === null || item.deduction === undefined ? '-' : (item.deduction === 0 ? '-' : `${item.deduction}`)
    } as AttendanceRecord;
  }

  fetchAttendance() {
    if (!this.employee || !this.date) {
      this.attendanceData = [];
      return;
    }

    this.loading = true;
    this.error = null;
    this.employeeService.getAttendanceLog(this.date, this.employee.id).subscribe({
      next: (res) => {
        try {
          const list: RawAttendanceItem[] = res?.data?.object_info?.list_items || [];
          this.attendanceData = list.map(i => this.mapRawToRecord(i));
        } catch (e) {
          this.attendanceData = [];
          this.error = 'Failed to parse attendance data';
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load attendance data';
        this.attendanceData = [];
      }
    });
  }
}
