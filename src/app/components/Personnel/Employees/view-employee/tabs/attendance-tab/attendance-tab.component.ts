import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';
import { EmployeeService } from '../../../../../../core/services/personnel/employees/employee.service';
import { TimeFormatPipe } from './time-format.pipe';

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
  imports: [CommonModule, TableComponent, TimeFormatPipe],
  providers: [DatePipe],
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

  // Date slider properties
  today: Date = new Date();
  selectedDate!: Date;
  baseDate: Date = new Date();
  days: { label: string, date: Date, isToday: boolean }[] = [];

  constructor(private employeeService: EmployeeService, private datePipe: DatePipe) {
    // Initialize dates
    this.today.setHours(0, 0, 0, 0);
    this.selectedDate = new Date(this.today);
    this.baseDate = this.getStartOfWeek(this.today);
    this.generateDays(this.baseDate);
  }

  ngOnChanges(changes: SimpleChanges) {
    // When employee changes, fetch attendance for selected date
    if (changes['employee'] && this.employee) {
      this.fetchAttendance();
    }
    // If date input changes from parent, update selected date
    if (changes['date'] && this.date) {
      this.selectedDate = new Date(this.date);
      this.fetchAttendance();
    }
  }

  // Date slider methods
  generateDays(startDate: Date): void {
    this.days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isToday = date.toDateString() === this.today.toDateString();

      this.days.push({ label, date, isToday });
    }
  }

  getStartOfWeek(date: Date): Date {
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek;
    const start = new Date(date);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  prevWeek(): void {
    this.baseDate.setDate(this.baseDate.getDate() - 7);
    this.generateDays(this.baseDate);
  }

  nextWeek(): void {
    const tempDate = new Date(this.baseDate);
    tempDate.setDate(tempDate.getDate() + 7);

    if (tempDate > this.getStartOfWeek(this.today)) {
      return;
    }

    this.baseDate = tempDate;
    this.generateDays(this.baseDate);
  }

  canGoNext(): boolean {
    const nextStart = new Date(this.baseDate);
    nextStart.setDate(this.baseDate.getDate() + 7);
    return nextStart <= this.getStartOfWeek(this.today);
  }

  selectDate(date: Date): void {
    if (date > this.today) return;

    this.selectedDate = date;
    this.fetchAttendance();
  }

  isSelected(date: Date): boolean {
    return this.selectedDate.toDateString() === date.toDateString();
  }

  trackByDate(index: number, day: { date: Date }): number {
    return new Date(day.date).getTime();
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
      workingHrs: item.is_working_day ? (item.work_hours ? `${item.work_hours}` : '-') : 'NA',
      missingHrs: item.missing_hrs === null || item.missing_hrs === undefined ? '-' : `${item.missing_hrs} Hr${item.missing_hrs !== 1 ? 's' : ''}`,
      deduction: item.deduction === null || item.deduction === undefined ? '-' : (item.deduction === 0 ? '-' : `${item.deduction}`)
    } as AttendanceRecord;
  }

  fetchAttendance() {
    if (!this.employee) {
      this.attendanceData = [];
      return;
    }

    const dateToFetch = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd');
    if (!dateToFetch) {
      this.attendanceData = [];
      return;
    }

    this.loading = true;
    this.error = null;
    this.employeeService.getAttendanceLog(dateToFetch, this.employee.id).subscribe({
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
