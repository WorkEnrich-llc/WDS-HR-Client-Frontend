import { Component, HostListener, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { AppTimeDisplayDirective } from 'app/core/directives/app-time-display.directive';
import { DateInputDirective } from 'app/core/directives/date.directive';
import { AttendanceLog } from 'app/core/models/attendance-log';
import { AttendanceLogService } from 'app/core/services/attendance/attendance-log/attendance-log.service';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-manage-attendance',
  imports: [CommonModule, PageHeaderComponent, PopupComponent, ReactiveFormsModule, FormsModule, AppTimeDisplayDirective, DateInputDirective],
  templateUrl: './manage-attendance.component.html',
  styleUrl: './manage-attendance.component.css'
})
export class ManageAttendanceComponent {
  public newLogForm!: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private attendanceService = inject(AttendanceLogService);
  private employeesService = inject(EmployeeService)
  private toasterService = inject(ToasterMessageService);
  private route = inject(ActivatedRoute);
  // employeeList!: Observable<any[]>;
  employeeList: any[] = [];
  filteredEmployeeList: any[] = [];
  employeeSearchTerm: string = '';
  isEmployeeDropdownOpen: boolean = false;
  selectedEmployee: any = null;
  employeesLoading: boolean = true;
  createDate: string = '';
  updatedDate: string = '';
  isEditMode = false;
  attendanceId?: number;
  id!: number;
  isSubmitting = false;
  maxDate: string = '';

  /**
   * Custom validator to prevent future dates
   */
  private noFutureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const today = new Date();

    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return { futureDate: true };
    }

    return null;
  }


  ngOnInit(): void {
    this.initFormModel();

    // Set max date to today for date input
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];

    const todayFormatted = new Date().toLocaleDateString('en-GB');
    this.createDate = todayFormatted;
    // load employees and set loading state
    this.employeesLoading = true;
    this.employeesService.getEmployees(1, 100000).subscribe({
      next: (res) => {
        this.employeeList = res?.data?.list_items ?? [];
        this.filteredEmployeeList = this.employeeList;
        this.employeesLoading = false;
        this.newLogForm.get('employee_id')?.enable();
        this.updateSelectedEmployee();
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.employeeList = [];
        this.filteredEmployeeList = [];
        this.employeesLoading = false;
      }
    });
    this.patchFormValues();


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
    this.router.navigate(['/attendance/attendance-log']);
  }

  private initFormModel(): void {
    this.newLogForm = this.fb.group({
      employee_id: [{ value: '', disabled: true }, [Validators.required]],
      date: ['', [Validators.required, this.noFutureDateValidator.bind(this)]],
      start: ['', [Validators.required]],
      end: ['', [Validators.required]],
    });
  }


  private patchFormValues(): void {
    const navigationRoute = history.state;
    if (navigationRoute && navigationRoute.attendance) {
      this.isEditMode = true;
      this.attendanceId = navigationRoute.attendance.working_details?.record_id;
      this.newLogForm.patchValue({
        employee_id: navigationRoute.attendance.emp_id,
        date: navigationRoute.attendance.date,
        start: navigationRoute.attendance.working_details?.actual_check_in,
        end: navigationRoute.attendance.working_details?.actual_check_out,
      });
      // Update selected employee after form is patched
      setTimeout(() => {
        this.updateSelectedEmployee();
      }, 0);
      const today = new Date().toLocaleDateString('en-GB');
      this.updatedDate = today;
    }
  }

  save(): void {
    if (this.newLogForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.newLogForm.controls).forEach(key => {
        this.newLogForm.get(key)?.markAsTouched();
      });

      // Show specific error message for future date
      if (this.newLogForm.get('date')?.hasError('futureDate')) {
        this.toasterService.showError('Cannot create attendance log for future dates');
      }
      return;
    }

    const raw = this.newLogForm.value;
    // Normalize time values to 24-hour format (HH:mm) before sending to backend
    const startTime = this.normalizeTo24(raw.start);
    const endTime = this.normalizeTo24(raw.end);

    const attendance: AttendanceLog = {
      id: this.attendanceId,
      employee_id: raw.employee_id,
      date: raw.date,
      start: startTime ?? '',
      end: endTime ?? '',
    };

    let request: Observable<AttendanceLog>;
    if (this.isEditMode && this.attendanceId) {
      request = this.attendanceService.updateAttendance(attendance);
    } else {
      request = this.attendanceService.createAttendance(attendance);
    }

    request.subscribe({
      next: () => {
        this.toasterService.showSuccess(
          `Attendance log ${this.isEditMode ? 'updated' : 'created'} successfully!`
        );
        this.router.navigate(['/attendance/attendance-log']);
      },
      error: (err) => console.error('Error:', err)
    });
  }

  /**
   * Toggle employee dropdown
   */
  toggleEmployeeDropdown(): void {
    if (!this.newLogForm.get('employee_id')?.disabled) {
      this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
      if (this.isEmployeeDropdownOpen) {
        this.employeeSearchTerm = '';
        this.filterEmployees();
      }
    }
  }

  /**
   * Close employee dropdown
   */
  closeEmployeeDropdown(): void {
    this.isEmployeeDropdownOpen = false;
    this.employeeSearchTerm = '';
    this.filterEmployees();
  }

  /**
   * Select an employee
   */
  selectEmployee(employee: any): void {
    this.selectedEmployee = employee;
    this.newLogForm.patchValue({ employee_id: employee.id });
    this.newLogForm.get('employee_id')?.markAsTouched();
    this.closeEmployeeDropdown();
  }

  /**
   * Update selected employee based on form value
   */
  updateSelectedEmployee(): void {
    const employeeId = this.newLogForm.get('employee_id')?.value;
    if (employeeId) {
      this.selectedEmployee = this.employeeList.find(emp => emp.id === employeeId) || null;
    } else {
      this.selectedEmployee = null;
    }
  }

  /**
   * Filter employees based on search term
   */
  filterEmployees(): void {
    if (!this.employeeSearchTerm.trim()) {
      this.filteredEmployeeList = this.employeeList;
      return;
    }

    const searchTerm = this.employeeSearchTerm.toLowerCase().trim();
    this.filteredEmployeeList = this.employeeList.filter(emp => {
      const name = emp.contact_info?.name?.toLowerCase() || '';
      return name.includes(searchTerm);
    });
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.employee-dropdown-container')) {
      this.closeEmployeeDropdown();
    }
  }

  /**
   * Convert a time string from 12-hour format (e.g. "2:30 PM") to 24-hour "HH:mm".
   * If the value is already in 24-hour format, it will be returned unchanged.
   */
  private normalizeTo24(value?: string): string | undefined {
    if (!value) return value;
    const v = value.trim();
    // If already 24-hour format HH:mm
    if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(v)) {
      return v;
    }

    // Match 12-hour format like "2:30 PM" or "02:30 am"
    const m = v.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/);
    if (!m) return v; // unknown format, return as-is

    let hour = parseInt(m[1], 10);
    const minute = m[2];
    const ampm = m[3].toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    const hh = hour < 10 ? `0${hour}` : `${hour}`;
    return `${hh}:${minute}`;
  }




}
