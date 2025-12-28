import { Component, ElementRef, inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { DatePipe, NgClass, NgStyle } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';
import { EmployeeService } from '../../../../../../core/services/personnel/employees/employee.service';
import { AttendanceLogService } from 'app/core/services/attendance/attendance-log/attendance-log.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IAttendanceFilters } from 'app/core/models/attendance-log';
import { PopupComponent } from 'app/components/shared/popup/popup.component';

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
  imports: [PopupComponent, NgClass, NgStyle, DatePipe],
  templateUrl: './attendance-tab.component.html',
  providers: [DatePipe],
  styleUrls: ['./../../../../../shared/table/table.component.css', './attendance-tab.component.css']
})
export class AttendanceTabComponent implements OnChanges {
  @Input() employee: Employee | null = null;
  @Input() date: string | null = '2025-08-06'
  @Input() isEmployeeActive: boolean = false;
  @ViewChild('tableHeader', { static: false }) tableHeader!: ElementRef;
  attendanceData: AttendanceRecord[] = [];
  loading: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  filterForm!: FormGroup;
  // Date slider properties
  today: Date = new Date();
  selectedDate!: Date;
  baseDate: Date = new Date();
  skeletonRows = Array.from({ length: 5 });
  days: { label: string, date: Date, isToday: boolean }[] = [];
  constructor(private fb: FormBuilder, private employeeService: EmployeeService, private _AttendanceLogService: AttendanceLogService, private datePipe: DatePipe) {

    // Initialize dates
    this.today.setHours(0, 0, 0, 0);
    this.selectedDate = new Date(this.today);
    this.baseDate = this.getStartOfWeek(this.today);
    this.generateDays(this.baseDate);
  }
  employees: any[] = [];
  columnWidths: string[] = [];
  ngAfterViewInit(): void {
    setTimeout(() => {
      const thElements = this.tableHeader.nativeElement.querySelectorAll('th');
      this.columnWidths = Array.from(thElements).map((th: any) => `${th.offsetWidth}px`);
    });
  }

  private toasterService = inject(ToasterMessageService);


  ngOnInit(): void {
    this.filterForm = this.fb.group({
      employee: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['employee'] && this.employee) {
      const filters: IAttendanceFilters = this.buildFilters();
      this.getAllAttendanceLog(filters);
    }

    if (changes['date'] && this.date) {
      this.selectedDate = new Date(this.date);
      const filters: IAttendanceFilters = this.buildFilters();
      this.getAllAttendanceLog(filters);
    }
  }
  private buildFilters(): IAttendanceFilters {
    const formattedDate = this.datePipe.transform(this.selectedDate || this.today, 'yyyy-MM-dd')!;

    const filters: IAttendanceFilters = {
      employee: this.employee ? this.employee.id : undefined,
      from_date: formattedDate,
      to_date: formattedDate
    };

    return filters;
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

    const filters: IAttendanceFilters = this.buildFilters();
    this.getAllAttendanceLog(filters);
  }


  isSelected(date: Date): boolean {
    return this.selectedDate.toDateString() === date.toDateString();
  }

  trackByDate(index: number, day: { date: Date }): number {
    return new Date(day.date).getTime();
  }


  getAllAttendanceLog(filters: IAttendanceFilters): void {
    this.loading = true;

    if (this.employee && this.employee.id) {
      filters = {
        ...filters,
        employee: this.employee.id
      };
    }

    this._AttendanceLogService.getAttendanceLog(filters).subscribe({
      next: (data) => {
        const info = data.data.object_info;
        this.employees = info.list_items.map((emp: any) => ({
          ...emp,
          collapsed: true
        }));

        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching attendance logs:', error);
        this.loading = false;
      }
    });
  }


  formatTimeTo12Hour(time: string): string {
    if (!time) return '';
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Present':
        return 'text-primary';
      case 'Absent':
      case 'Not Checked In':
        return 'text-danger';
      case 'On Leave':
      case 'Outside Shift Hours':
      case 'Not Checked Out':
      case 'Official Mission':
        return 'text-warning';
      case 'Holiday':
      case 'Weekly leave':
        return 'text-success';
      default:
        return '';
    }
  }

  // but time or -- in absent and leave 
  getFirstCheckIn(emp: any): string {
    const list = emp?.list_items;
    if (!list || list.length === 0) return '--';

    const first = list[0];
    return this.getFormattedCheckIn(first);
  }

  getLastCheckOut(emp: any): string {
    const list = emp?.list_items;
    if (!list || list.length === 0) return '--';

    const last = list[list.length - 1];
    return this.getFormattedCheckOut(last);
  }


  getSafeCheckInTime(status: string | undefined, time: string | undefined): string {
    if (!status || !time) return '--';

    const normalizedStatus = status.trim();
    const normalizedTime = time.trim();

    if (
      (normalizedStatus === 'Absent' ||
        normalizedStatus === 'On Leave' ||
        normalizedStatus === 'Holiday' ||
        normalizedStatus === 'Weekly leave') &&
      normalizedTime === '00:00'
    ) {
      return '--';
    }

    return this.formatTimeTo12Hour(normalizedTime);
  }


  getFormattedCheckIn(log: any): string {
    return this.getSafeCheckInTime(log?.status, log?.times_object?.actual_check_in);
  }

  getFormattedCheckOut(log: any): string {
    const checkOut = log?.times_object?.actual_check_out;
    const finished = log?.working_details?.finished;

    if (!checkOut || checkOut === '00:00' || finished === false) {
      return '--';
    }

    return this.formatTimeTo12Hour(checkOut);
  }

  getMainRecord(list: any[]): any {
    return list?.find(item => item.main_record === true);
  }


  cancelLog(attendance: any): void {
    this.isLoading = true;
    const id = attendance.id ?? attendance.record_id;
    if (!id) {
      this.toasterService.showError('Attendance log ID not found.');
      this.isLoading = false;
      return;
    }
    this._AttendanceLogService.cancelAttendanceLogById(id).subscribe({
      next: () => {
        attendance.canceled = true;
        this.isLoading = false;
        this.toasterService.showSuccess('Attendance log canceled successfully.');
      },
      error: (err: any) => {
        this.toasterService.showError('Failed to cancel attendance log.');
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  isModalOpen = false;
  attendanceToCancel: any = null;


  openModal(attendance: any, emp: any) {
    this.attendanceToCancel = {
      record_id: attendance?.record_id,
      employee_id: emp?.employee?.id,
      employeeName: emp?.employee?.name,
      date: emp?.date,
      status: attendance?.status,
      times_object: attendance?.times_object
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.attendanceToCancel = null;
  }

  confirmAction() {
    if (this.attendanceToCancel) {
      this.cancelLog(this.attendanceToCancel);
    }
    this.isModalOpen = false;
    this.attendanceToCancel = null;
  }

}
