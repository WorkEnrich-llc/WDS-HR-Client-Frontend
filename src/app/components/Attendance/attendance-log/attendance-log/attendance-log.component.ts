import { Component, ViewChild, inject } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { debounceTime, filter, map, Observable, Subject, Subscription } from 'rxjs';
import { TableComponent } from '../../../shared/table/table.component';
import { WorkSchaualeService } from '../../../../core/services/attendance/work-schaduale/work-schauale.service';
import { AttendanceLogService } from '../../../../core/services/attendance/attendance-log/attendance-log.service';
import { IAttendanceFilters } from 'app/core/models/attendance-log';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { PopupComponent } from 'app/components/shared/popup/popup.component';

@Component({
  selector: 'app-attendance-log',
  imports: [PageHeaderComponent, OverlayFilterBoxComponent, TableComponent,
    CommonModule, ReactiveFormsModule, FormsModule, RouterLink, NgxDaterangepickerMd, PopupComponent],
  providers: [DatePipe],
  templateUrl: './attendance-log.component.html',
  styleUrl: './attendance-log.component.css'
})
export class AttendanceLogComponent {

  constructor(private route: ActivatedRoute, private _AttendanceLogService: AttendanceLogService, private _WorkSchaualeService: WorkSchaualeService, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder, private router: Router) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  private departmentService = inject(DepartmentsService);
  private toasterService = inject(ToasterMessageService);
  selectedRange: { startDate: string; endDate: string } | null = null;

  attendanceLogs: any[] = [];
  departmentList$!: Observable<any[]>;



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
  filterForm!: FormGroup;
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  loadData: boolean = false;
  today: Date = new Date();
  selectedDate!: Date;
  baseDate: Date = new Date();
  days: { label: string, date: Date, isToday: boolean }[] = [];
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;


  ngOnInit(): void {
    this.filterForm = this.fb.group({
      department_id: [''],
      from_date: [''],
      offenses: [''],
      day_type: [''],
    });

    this.filterForm.get('from_date')?.valueChanges.subscribe(val => {
      if (val && val.startDate && val.endDate) {
        this.selectedRange = {
          startDate: val.startDate.format('YYYY-MM-DD'),
          endDate: val.endDate.format('YYYY-MM-DD')
        };
        this.filterForm.patchValue({
          to_date: this.selectedRange.endDate
        }, { emitEvent: false });
      } else {
        this.selectedRange = null;
        this.filterForm.patchValue({ to_date: '' }, { emitEvent: false });
      }
    });

    this.today.setHours(0, 0, 0, 0);
    this.selectedDate = new Date(this.today);
    this.baseDate = this.getStartOfWeek(this.today);
    this.generateDays(this.baseDate);
    // this.getAllAttendanceLog(this.currentPage, this.itemsPerPage, '', this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!);

    this.getAllAttendanceLog({
      page: this.currentPage,
      per_page: this.itemsPerPage,
      from_date: this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!,
      to_date: ''
    });

    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;
      this.getAllAttendanceLog({
        page: this.currentPage,
        per_page: this.itemsPerPage,
        search: value
      });
    });


    this.departmentList$ = this.departmentService.getAllDepartments().pipe(
      map((res: any) => res?.data?.list_items ?? [])
    );

  }



  getAllAttendanceLog(filters: IAttendanceFilters): void {
    this.loadData = true;
    this._AttendanceLogService.getAttendanceLog(filters).subscribe({
      next: (data) => {
        const info = data.data.object_info;
        this.attendanceLogs = info.list_items;
        this.totalItems = info.total_items;
        this.totalPages = info.total_pages;
        this.loadData = false;
      },
      error: (error) => {
        console.error('Error fetching attendance logs:', error);
        this.loadData = false;
      }
    });
  }


  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
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

  toTime(timeString: string | null): Date | null {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  getRowStatus(isWorkingDay: boolean): string {
    const allFalse = this.attendanceLogs.every(a => !a.is_working_day);
    const hasTrue = this.attendanceLogs.some(a => a.is_working_day);

    if (allFalse) {
      return 'Holiday';
    }

    if (hasTrue && !allFalse) {
      return isWorkingDay ? 'Working Day' : 'Day Off';
    }

    return 'Working Day';
  }

  // calender 
  generateDays(startDate: Date): void {
    this.days = [];

    for (let i = 0; i < 13; i++) {
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



  isSelected(date: Date): boolean {
    //  highlighted selected range dates
    if (this.selectedRange) {
      const dayStr = this.datePipe.transform(date, 'yyyy-MM-dd')!;
      const fromStr = this.selectedRange.startDate;
      const toStr = this.selectedRange.endDate;

      return dayStr >= fromStr && dayStr <= toStr;
    }
    // highlighted single selected date
    return this.selectedDate && this.selectedDate.toDateString() === date.toDateString();
  }

  selectDate(date: Date): void {
    if (date > this.today) return;

    this.selectedDate = date;

    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;
    console.log('Selected date:', formattedDate);

    this.getAllAttendanceLog({
      page: this.currentPage,
      per_page: this.itemsPerPage,
      from_date: formattedDate,
      to_date: ''
    });
  }

  // isSelected(date: Date): boolean {
  //   return this.selectedDate.toDateString() === date.toDateString();
  // }



  trackByDate(index: number, day: { date: Date }): number {
    return new Date(day.date).getTime();
  }
  // end calender

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;
    this.getAllAttendanceLog({
      page: this.currentPage,
      per_page: this.itemsPerPage,
      from_date: formattedDate,
      to_date: ''
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;
    this.getAllAttendanceLog({
      page: this.currentPage,
      per_page: this.itemsPerPage,
      from_date: formattedDate,
      to_date: ''
    });
  }



  navigateToNewLog(): void {
    this.router.navigate(['/attendance/manage-attendance']);
  }

  cancelLog(attendance: any): void {
    const payload = {
      record_id: attendance.working_details.record_id,
      employee_id: attendance.emp_id,
      date: attendance.date
    };
    this._AttendanceLogService.cancelAttendanceLog(payload).subscribe({
      next: () => {
        attendance.working_details.canceled = true;
        this.toasterService.showSuccess('Attendance log canceled successfully.');
      },
      error: (err) => {
        this.toasterService.showError('Failed to cancel attendance log.');
        console.error(err);
      }
    });
  }


  applyFilters(): void {
    if (this.filterForm.valid) {
      const raw = this.filterForm.value;
      let from_date = '';
      let to_date = '';
      if (raw.from_date) {
        from_date = this.datePipe.transform(raw.from_date.startDate?.toDate(), 'yyyy-MM-dd') || '';
        to_date = this.datePipe.transform(raw.from_date.endDate?.toDate(), 'yyyy-MM-dd') || '';
      }
      const filters: IAttendanceFilters = {
        department_id: raw.department_id,
        offenses: raw.offenses,
        day_type: raw.day_type,
        from_date,
        to_date
      };
      this.filterBox.closeOverlay();
      this.getAllAttendanceLog(filters);
    }


  }


  applyFilter(): void {
    console.log('filterForm', this.filterForm.value);
    if (this.filterForm.valid) {
      console.log('filterForm', this.filterForm.value);
      const rawFilters = this.filterForm.value;
      const filters: IAttendanceFilters = {
        page: this.currentPage,
        department_id: rawFilters.department_id || undefined,
        from_date: rawFilters.from_date || undefined,
        to_date: rawFilters.to_date || undefined,
        offenses: rawFilters.offenses || undefined,
        day_type: rawFilters.day_type || undefined,
      };

      this.filterBox.closeOverlay();
      this.getAllAttendanceLog(filters);
    }
  }

  resetFilterForm(): void {
    this.filterForm.reset({
      department_id: '',
      from_date: '',
      to_date: '',
      offenses: '',
      day_type: ''
    });
    const filters: IAttendanceFilters = {
      page: this.currentPage,
      per_page: this.itemsPerPage,
      department_id: undefined,
      from_date: '',
      to_date: '',
      offenses: '',
      day_type: '',
      search: ''
    };
    this.filterBox.closeOverlay();
    this.getAllAttendanceLog(filters);
  }


  isModalOpen = false;
  attendanceToCancel: any = null;

  openModal(attendance: any) {
    this.attendanceToCancel = attendance;
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
