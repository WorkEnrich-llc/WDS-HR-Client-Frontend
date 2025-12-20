

import { Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { debounceTime, distinctUntilChanged, filter, map, Observable, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { WorkSchaualeService } from '../../../../core/services/attendance/work-schaduale/work-schauale.service';
import { AttendanceLogService } from '../../../../core/services/attendance/attendance-log/attendance-log.service';
import { IAttendanceFilters } from 'app/core/models/attendance-log';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { NgxPaginationModule } from 'ngx-pagination';
import dayjs, { Dayjs } from 'dayjs';

@Component({
  selector: 'app-attendance-log',
  imports: [PageHeaderComponent, OverlayFilterBoxComponent,
    CommonModule, ReactiveFormsModule, FormsModule, NgxPaginationModule, NgxDaterangepickerMd, PopupComponent],
  providers: [DatePipe],
  templateUrl: './attendance-log.component.html',
  styleUrls: ['./../../../shared/table/table.component.css', './attendance-log.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AttendanceLogComponent implements OnDestroy {


  constructor(private route: ActivatedRoute, private _AttendanceLogService: AttendanceLogService, private _WorkSchaualeService: WorkSchaualeService, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder, private router: Router) { }

  // Action menu stubs for template
  addLog(emp: any) { /* TODO: Implement add log */ }
  editDeduction(emp: any) { /* TODO: Implement edit deduction */ }
  // Deduction confirmation modal state
  deductionModalOpen: boolean = false;
  deductionModalLog: any = null;
  deductionModalEmp: any = null;
  deductionModalLoading: boolean = false;

  toggleDeduction(log: any, emp: any) {
    this.deductionModalLog = log;
    this.deductionModalEmp = emp;
    this.deductionModalOpen = true;
  }

  closeDeductionModal() {
    this.deductionModalOpen = false;
    this.deductionModalLog = null;
    this.deductionModalEmp = null;
    this.deductionModalLoading = false;
  }

  confirmDeductionToggle() {
    if (!this.deductionModalLog) return;
    this.handleDeductionToggle(this.deductionModalLog, this.deductionModalEmp, true);
  }
  editLog(log: any, emp: any) { this.openEditLogModal(log, emp); }

  // Cancel log confirmation modal state
  cancelModalOpen: boolean = false;
  cancelModalLog: any = null;
  cancelModalEmp: any = null;
  cancelModalLoading: boolean = false;

  openCancelLogModal(log: any, emp: any) {
    this.cancelModalLog = log;
    this.cancelModalEmp = emp;
    this.cancelModalOpen = true;
  }

  closeCancelLogModal() {
    this.cancelModalOpen = false;
    this.cancelModalLog = null;
    this.cancelModalEmp = null;
    this.cancelModalLoading = false;
  }

  confirmCancelLog() {
    if (!this.cancelModalLog) return;
    const id = this.cancelModalLog.id ?? this.cancelModalLog.record_id;
    if (!id) {
      this.toastr.error('Attendance log ID not found.');
      return;
    }
    this.cancelModalLoading = true;
    this._AttendanceLogService.cancelAttendanceLogById(id).subscribe({
      next: () => {
        this.closeCancelLogModal();
        this.getAllAttendanceLog({
          page: this.currentPage,
          per_page: this.itemsPerPage,
          from_date: this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!,
          to_date: ''
        });
        this.toastr.success('Attendance log canceled successfully');
      },
      error: () => {
        this.toastr.error('Failed to cancel attendance log');
        this.closeCancelLogModal();
      }
    });
  }
  editCheckIn(log: any, emp: any) { this.openEditCheckInModal(log, emp); }
  addCheckOut(log: any, emp: any) { this.openEditCheckOutModal(log, emp); }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @ViewChild('tableHeader', { static: false }) tableHeader!: ElementRef;

  private departmentService = inject(DepartmentsService);
  private toasterService = inject(ToasterMessageService);
  selectedRange: { startDate: string; endDate: string } | null = null;
  editModalLoading: boolean = false;

  attendanceLogs: any[] = [];
  departmentList$!: Observable<any[]>;
  skeletonRows = Array.from({ length: 5 });
  // Modal state for editing logs
  editModalOpen: boolean = false;
  editModalType: 'checkin' | 'checkout' | 'log' | null = null;
  editModalLog: any = null;
  editModalEmp: any = null;
  editCheckInValue: string = '';
  editCheckOutValue: string = '';

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

  isLoading: boolean = false;
  isExporting: boolean = false;
  todayDayjs: Dayjs = dayjs();
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
  private searchSubscription!: Subscription;
  private toasterSubscription!: Subscription;
  private destroy$ = new Subject<void>();

  employees: any[] = [];
  columnWidths: string[] = [];
  ngAfterViewInit(): void {
    setTimeout(() => {
      const thElements = this.tableHeader.nativeElement.querySelectorAll('th');
      this.columnWidths = Array.from(thElements).map((th: any) => `${th.offsetWidth}px`);
    });
  }


  toggleCollapse(emp: any) {
    emp.collapsed = !emp.collapsed;
  }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      department_id: [''],
      from_date: [''],
      offenses: [''],
      day_type: [''],
    });

    this.filterForm.get('from_date')?.valueChanges.subscribe(val => {
      if (val && val.startDate && val.endDate) {
        const start = val.startDate.toDate();
        const end = val.endDate.toDate();
        const today = new Date();

        if (start > today || end > today) {
          this.toastr.warning('You cannot select future dates.');
          this.filterForm.patchValue({ from_date: '' }, { emitEvent: false });
          this.hasSelectedDateRange = false;
          return;
        }

        this.selectedRange = {
          startDate: val.startDate.format('YYYY-MM-DD'),
          endDate: val.endDate.format('YYYY-MM-DD')
        };

        this.hasSelectedDateRange = true;
        this.filterForm.patchValue({
          to_date: this.selectedRange.endDate
        }, { emitEvent: false });

      } else {
        this.selectedRange = null;
        this.hasSelectedDateRange = false;
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

    // Improved search with request cancellation, whitespace trimming, and better performance
    this.searchSubscription = this.searchSubject.pipe(
      takeUntil(this.destroy$),
      // First filter: Skip whitespace-only searches, but allow empty string to clear search
      filter((originalSearchTerm: string) => {
        // Allow empty string (user cleared search - we want to reload without search filter)
        if (originalSearchTerm === '') {
          return true;
        }
        // Block whitespace-only strings (like "   "), but allow strings with content
        return originalSearchTerm.trim().length > 0;
      }),
      // Trim ONLY leading whitespace and limit trailing spaces to maximum 3
      map((searchTerm: string) => {
        // Remove only leading whitespace
        let trimmedStart = searchTerm.replace(/^\s+/, '');

        // Limit trailing spaces to maximum 3 (ignore spaces beyond 3)
        // Match trailing spaces and replace if more than 3
        trimmedStart = trimmedStart.replace(/(\s{4,})$/, (match) => {
          // If 4 or more trailing spaces, keep only 3
          return '   ';
        });

        // Update searchTerm property to reflect processed value in UI
        this.searchTerm = trimmedStart;
        return trimmedStart;
      }),
      // Debounce to wait for user to stop typing
      debounceTime(600),
      // Avoid duplicate consecutive searches
      distinctUntilChanged(),
      // Cancel previous request and make new one (switchMap cancels previous observables)
      switchMap((searchTerm: string) => {
        // Reset to page 1 when searching
        this.currentPage = 1;
        this.loadData = true;
        this.isLoading = true;

        const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;

        // If search is empty or whitespace-only, load without search term (clear search)
        // Note: searchTerm already has leading spaces removed, so we check if it has any non-whitespace content
        const finalSearchTerm = (searchTerm && searchTerm.trim().length > 0) ? searchTerm : undefined;

        // Return the observable which switchMap will subscribe to
        // This automatically cancels any previous incomplete requests
        return this._AttendanceLogService.getAttendanceLog({
          page: this.currentPage,
          per_page: this.itemsPerPage,
          from_date: formattedDate,
          search: finalSearchTerm
        });
      })
    ).subscribe({
      next: (data) => {
        const info = data.data.object_info;
        this.employees = info.list_items.map((emp: any) => ({
          ...emp,
          collapsed: true
        }));

        this.totalItems = info.total_items;
        this.totalPages = info.total_pages;
        this.loadData = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching attendance logs:', error);
        this.loadData = false;
        this.isLoading = false;
      }
    });


    this.departmentList$ = this.departmentService.getAllDepartment(1, 10000, { status: 'true' }).pipe(
      map((res: any) => res?.data?.list_items ?? [])
    );

  }

  getAllAttendanceLog(filters: IAttendanceFilters): void {
    this.loadData = true;
    this.isLoading = true;
    this._AttendanceLogService.getAttendanceLog(filters).subscribe({
      next: (data) => {
        const info = data.data.object_info;
        this.employees = info.list_items.map((emp: any) => ({
          ...emp,
          collapsed: true
        }));

        this.totalItems = info.total_items;
        this.totalPages = info.total_pages;
        this.loadData = false;
        this.isLoading = false;

      },
      error: (error) => {
        console.error('Error fetching attendance logs:', error);
        this.loadData = false;
        this.isLoading = false;
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
  // get times
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

  // git status of first main record in list
  getMainRecord(list: any[]): any {
    return list?.find(item => item.main_record === true);
  }


  onSearchChange() {
    // Emit the search term to the subject for debounced processing
    this.searchSubject.next(this.searchTerm);
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.employees = this.employees.sort((a, b) => {
      const nameA = (a.employee?.name || '').toLowerCase();
      const nameB = (b.employee?.name || '').toLowerCase();

      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
      } else {
        return nameA < nameB ? 1 : nameA > nameB ? -1 : 0;
      }
    });
  }



  isInvalidTime(time: string | null | undefined): boolean {
    return !time || time === '00:00';
  }

  formatTimeDisplay(time: string | null | undefined): string {
    if (this.isInvalidTime(time)) {
      return '--';
    }

    const dateObj = this.toTime(time!);
    return this.datePipe.transform(dateObj, 'hh:mm a') || '--';
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

    const totalDays = 14;
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isToday = date.toDateString() === this.today.toDateString();

      this.days.push({ label, date, isToday });
    }
  }

  prevWeek(): void {
    this.baseDate.setDate(this.baseDate.getDate() - 14);
    this.generateDays(this.baseDate);
  }

  nextWeek(): void {
    const tempDate = new Date(this.baseDate);
    tempDate.setDate(tempDate.getDate() + 14);

    if (tempDate > this.getStartOfWeek(this.today)) {
      return;
    }

    this.baseDate = tempDate;
    this.generateDays(this.baseDate);
  }

  canGoNext(): boolean {
    const nextStart = new Date(this.baseDate);
    nextStart.setDate(this.baseDate.getDate() + 14);
    return nextStart <= this.getStartOfWeek(this.today);
  }

  getStartOfWeek(date: Date): Date {
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek;
    const start = new Date(date);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
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
  hasSelectedDateRange: boolean = false;
  selectDate(date: Date): void {
    if (date > this.today) return;

    this.selectedDate = date;

    this.filterForm.patchValue({ from_date: '' });
    this.selectedRange = null;

    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;

    this.getAllAttendanceLog({
      page: this.currentPage,
      per_page: this.itemsPerPage,
      from_date: formattedDate,
      to_date: '',
      search: this.searchTerm || undefined
    });
  }


  // isSelected(date: Date): boolean {
  //   return this.selectedDate.toDateString() === date.toDateString();
  // }



  trackByDate(index: number, day: { date: Date }): number {
    return new Date(day.date).getTime();
  }
  // end calender

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadFilteredAttendance();
  }

  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.loadFilteredAttendance();
  }

  private loadFilteredAttendance(): void {
    const raw = this.filterForm.value;

    let from_date = '';
    let to_date = '';

    if (raw.from_date) {
      from_date = this.datePipe.transform(raw.from_date.startDate?.toDate(), 'yyyy-MM-dd') || '';
      to_date = this.datePipe.transform(raw.from_date.endDate?.toDate(), 'yyyy-MM-dd') || '';
    }

    const filters: IAttendanceFilters = {
      page: this.currentPage,
      per_page: this.itemsPerPage,
      department_id: raw.department_id || undefined,
      from_date,
      to_date,
      offenses: raw.offenses || undefined,
      day_type: raw.day_type || undefined,
      search: this.searchTerm || undefined,
    };

    this.getAllAttendanceLog(filters);
  }



  navigateToNewLog(): void {
    this.router.navigate(['/attendance/manage-attendance']);
  }

  exportAttendanceLog(): void {
    // Prevent multiple simultaneous requests
    if (this.isExporting) {
      return;
    }

    this.isExporting = true;

    // Build filter params same as loadFilteredAttendance
    const raw = this.filterForm.value;
    let from_date = '';
    let to_date = '';

    // If date range is selected from filter form
    if (raw.from_date && raw.from_date.startDate && raw.from_date.endDate) {
      from_date = this.datePipe.transform(raw.from_date.startDate.toDate(), 'yyyy-MM-dd') || '';
      to_date = this.datePipe.transform(raw.from_date.endDate.toDate(), 'yyyy-MM-dd') || '';
    }
    // If single date is selected from calendar
    else if (this.selectedDate) {
      from_date = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd') || '';
    }

    const filters: IAttendanceFilters = {
      department_id: raw.department_id || undefined,
      from_date,
      to_date,
      offenses: raw.offenses || undefined,
      day_type: raw.day_type || undefined,
      search: this.searchTerm || undefined,
    };

    // Remove undefined/null/empty values
    const cleanFilters: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanFilters[key] = value;
      }
    });

    this._AttendanceLogService.exportAttendanceLog(cleanFilters).subscribe({
      next: (blob: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-log-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.isExporting = false;
        this.toasterService.showSuccess('Attendance log exported successfully.');
      },
      error: (error) => {
        console.error('Error exporting attendance log:', error);
        this.isExporting = false;
        this.toasterService.showError('Failed to export attendance log.');
      }
    });
  }

  navigateToEditAttendance(log: any, emp: any): void {
    const attendanceData = {
      emp_id: emp?.employee?.id,
      date: emp?.date,
      working_details: {
        record_id: log?.record_id,
        actual_check_in: log?.times_object?.actual_check_in,
        actual_check_out: log?.times_object?.actual_check_out
      }
    };

    this.router.navigate(['/attendance/manage-attendance'], {
      state: { attendance: attendanceData }
    });
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
    if (this.filterForm.valid) {
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

    this.selectedRange = null;

    const filters: IAttendanceFilters = {
      page: this.currentPage,
      per_page: this.itemsPerPage,
      department_id: undefined,
      from_date: '',
      to_date: '',
      offenses: '',
      day_type: '',
      search: this.searchTerm || ''
    };

    this.filterBox.closeOverlay();
    this.getAllAttendanceLog(filters);
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

  // Action menu state
  openMainMenuIndex: number | null = null;
  openSubMenu: { mainIndex: number; subIndex: number } | null = null;
  private outsideClickListener: any;

  openMainMenu(idx: number) {
    this.openMainMenuIndex = idx;
    this.openSubMenu = null;
    // Add outside click listener
    setTimeout(() => {
      this.outsideClickListener = (event: MouseEvent) => {
        const menu = document.querySelector('.action-menu-dropdown');
        const btn = document.querySelector('.action-menu-btn');
        if (menu && !menu.contains(event.target as Node) && btn && !btn.contains(event.target as Node)) {
          this.closeMainMenu();
        }
      };
      document.addEventListener('mousedown', this.outsideClickListener);
    }, 0);
  }
  closeMainMenu() {
    this.openMainMenuIndex = null;
    if (this.outsideClickListener) {
      document.removeEventListener('mousedown', this.outsideClickListener);
      this.outsideClickListener = null;
    }
  }
  openSubLogMenu(mainIdx: number, subIdx: number) {
    this.openSubMenu = { mainIndex: mainIdx, subIndex: subIdx };
    this.openMainMenuIndex = null;
  }
  closeSubLogMenu() {
    this.openSubMenu = null;
  }



  openEditCheckInModal(log: any, emp: any) {
    this.editModalType = 'checkin';
    this.editModalLog = log;
    this.editModalEmp = emp;
    this.editCheckInValue = log?.times_object?.actual_check_in || '';
    this.editModalOpen = true;
  }

  openEditCheckOutModal(log: any, emp: any) {
    this.editModalType = 'checkout';
    this.editModalLog = log;
    this.editModalEmp = emp;
    this.editCheckOutValue = log?.times_object?.actual_check_out || '';
    this.editModalOpen = true;
  }

  openEditLogModal(log: any, emp: any) {
    this.editModalType = 'log';
    this.editModalLog = log;
    this.editModalEmp = emp;
    this.editCheckInValue = log?.times_object?.actual_check_in || '';
    this.editCheckOutValue = log?.times_object?.actual_check_out || '';
    this.editModalOpen = true;
  }

  closeEditModal() {
    this.editModalOpen = false;
    this.editModalType = null;
    this.editModalLog = null;
    this.editModalEmp = null;
    this.editCheckInValue = '';
    this.editCheckOutValue = '';
  }

  updateEditModal() {
    if (!this.editModalLog) return;
    const id = this.editModalLog.id ?? this.editModalLog.record_id;
    if (!id) {
      this.toastr.error('Attendance log ID not found.');
      return;
    }
    this.editModalLoading = true;
    let obs$;
    if (this.editModalType === 'checkin') {
      obs$ = this._AttendanceLogService.updateCheckIn(id, this.editCheckInValue);
    } else if (this.editModalType === 'checkout') {
      obs$ = this._AttendanceLogService.updateCheckOut(id, this.editCheckOutValue);
    } else if (this.editModalType === 'log') {
      obs$ = this._AttendanceLogService.updateLog(id, this.editCheckInValue, this.editCheckOutValue);
    } else {
      this.closeEditModal();
      this.editModalLoading = false;
      return;
    }
    obs$.subscribe({
      next: () => {
        this.closeEditModal();
        this.editModalLoading = false;
        this.getAllAttendanceLog({
          page: this.currentPage,
          per_page: this.itemsPerPage,
          from_date: this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!,
          to_date: ''
        });
        this.toastr.success('Attendance log updated successfully');
      },
      error: (err) => {
        this.toastr.error('Failed to update attendance log');
        this.closeEditModal();
        this.editModalLoading = false;
      }
    });
  }

  handleDeductionToggle(log: any, emp: any, fromModal: boolean = false) {
    // Debug: log the object to help diagnose missing id
    console.log('Deduction toggle log object:', log);
    const id = log?.id ?? log?.record_id ?? log?.recordID ?? log?.attendance_id;
    if (!id) {
      this.toastr.error('Attendance log ID not found. Please contact support.');
      console.error('Deduction toggle error: log object missing id/record_id:', log);
      return;
    }
    if (!fromModal) {
      // Only toggleDeduction should open the modal, not here
      return;
    }
    this.deductionModalLoading = true;
    const hasDeduction = log?.hours_object?.total_deduction > 0;
    const actionText = hasDeduction ? 'remove' : 'add';
    this._AttendanceLogService.toggleDeduction(id).subscribe({
      next: () => {
        this.getAllAttendanceLog({
          page: this.currentPage,
          per_page: this.itemsPerPage,
          from_date: this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!,
          to_date: ''
        });
        this.toastr.success(`Deduction ${actionText}ed successfully`);
        this.closeDeductionModal();
      },
      error: () => {
        this.toastr.error(`Failed to ${actionText} deduction`);
        this.deductionModalLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.outsideClickListener) {
      document.removeEventListener('mousedown', this.outsideClickListener);
      this.outsideClickListener = null;
    }
        // Complete the destroy subject to trigger takeUntil for all subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // Unsubscribe from individual subscriptions if they exist
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    // Complete the search subject
    this.searchSubject.complete();
  }
}
