import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { TableComponent } from '../../../shared/table/table.component';
import { WorkSchaualeService } from '../../../../core/services/attendance/work-schaduale/work-schauale.service';
import { AttendanceLogService } from '../../../../core/services/attendance/attendance-log/attendance-log.service';

@Component({
  selector: 'app-attendance-log',
  imports: [PageHeaderComponent, OverlayFilterBoxComponent, TableComponent, CommonModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './attendance-log.component.html',
  styleUrl: './attendance-log.component.css'
})
export class AttendanceLogComponent {
  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private _AttendanceLogService: AttendanceLogService, private _WorkSchaualeService: WorkSchaualeService, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;



  
attendanceLogs = [
  {
    id: '12',
    name: 'Ahmed Ali',
    arriveTime: '09:00 AM',
    leaveTime: '05:00 PM',
    in: '09:00 AM',
    out: '04:00 PM',
    date: '2023-10-01',
    dayType: 'Working Day',
    worksHours: '8',
    workHours: '7',
    missingHours: '1',
    deduction: '0.25 Day'
  },
  {
    id: '13',
    name: 'Sara Mostafa',
    arriveTime: '09:00 AM',
    leaveTime: '05:00 PM',
    in: '08:45 AM',
    out: '05:00 PM',
    date: '2023-10-02',
    dayType: 'Working Day',
    worksHours: '8',
    workHours: '8',
    missingHours: '',
    deduction: ''
  },
  {
    id: '14',
    name: 'Mohamed Ibrahim',
    arriveTime: '09:00 AM',
    leaveTime: '05:00 PM',
    in: '09:15 AM',
    out: '04:30 PM',
    date: '2023-10-03',
    dayType: 'Working Day',
    worksHours: '8',
    workHours: '6.5',
    missingHours: '1.5',
    deduction: '0.5 Day'
  }
];


  // error text 
  isLate(actual: string, expected: string): boolean {
    return this.parseTime(actual) > this.parseTime(expected);
  }

  leftEarly(actual: string, expected: string): boolean {
    return this.parseTime(actual) < this.parseTime(expected);
  }
  isMissingHours(actual: string | number, expected: string | number): boolean {
    const actualHours = Number(actual);
    const expectedHours = Number(expected);
    return !isNaN(actualHours) && !isNaN(expectedHours) && actualHours < expectedHours;
  }

  private parseTime(timeStr: string): number {
    if (!timeStr) return -1;
    const [time, modifier] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }


  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalpages: number = 0;
  loadData: boolean = false;
  today: Date = new Date();
  selectedDate!: Date;
  baseDate: Date = new Date();
  days: { label: string, date: Date, isToday: boolean }[] = [];
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;
ngOnInit(): void {
  this.today.setHours(0, 0, 0, 0);
  this.selectedDate = new Date(this.today);
  this.baseDate = this.getStartOfWeek(this.today);
  this.generateDays(this.baseDate);

  // أول تحميل ببيانات اليوم
  this.getAllAttendanceLog(this.currentPage, '', this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!);

  // عند تغيير الصفحة من queryParams
  this.route.queryParams.subscribe(params => {
    this.currentPage = +params['page'] || 1;
  });

  // عند وصول رسالة توست
  this.toasterSubscription = this.toasterMessageService.currentMessage$
    .pipe(filter(msg => !!msg && msg.trim() !== ''))
    .subscribe(msg => {
      this.toastr.clear();
      this.toastr.success(msg, '', { timeOut: 3000 });
      this.toasterMessageService.clearMessage();
    });

  // البحث أثناء الكتابة
  this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;
    this.getAllAttendanceLog(this.currentPage, value, formattedDate);
  });
}

getAllAttendanceLog(page: number, searchTerm: string = '', date?: string): void {
  const targetDate = date || this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;

  this._AttendanceLogService.getAttendanceLog(targetDate, { employee: searchTerm })
    .subscribe({
      next: (data) => {
        this.attendanceLogs = data.data.object_info;
        this.totalItems = data.data.total_items;
        this.totalpages = data.data.total_pages;
        this.loadData = true;
      },
      error: (error) => {
        console.error('Error fetching attendance logs:', error);
      }
    });
}


  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.attendanceLogs = this.attendanceLogs.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
      } else {
        return nameA < nameB ? 1 : (nameA > nameB ? -1 : 0);
      }
    });
  }

  // calender 
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


  getStartOfWeek(date: Date): Date {
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek;
    const start = new Date(date);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }



  canGoNext(): boolean {
    const nextStart = new Date(this.baseDate);
    nextStart.setDate(this.baseDate.getDate() + 7);
    return nextStart <= this.getStartOfWeek(this.today);
  }

selectDate(date: Date): void {
  if (date > this.today) return;

  this.selectedDate = date;

  const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;
  console.log('Selected date:', formattedDate);

  this.getAllAttendanceLog(this.currentPage, '', formattedDate);
}

  isSelected(date: Date): boolean {
    return this.selectedDate.toDateString() === date.toDateString();
  }

  // end calender

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    // this.getAllWorkSchedule(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    // this.getAllWorkSchedule(this.currentPage);
  }

}
