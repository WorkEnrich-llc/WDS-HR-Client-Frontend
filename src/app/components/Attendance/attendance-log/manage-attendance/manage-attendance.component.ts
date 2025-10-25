import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { AttendanceLogService } from 'app/core/services/attendance/attendance-log/attendance-log.service';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { Observable } from 'rxjs';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { AttendanceLog } from 'app/core/models/attendance-log';
import { TimeInputDirective } from 'app/core/directives/app-time-input.directive';
import { DateInputDirective } from 'app/core/directives/date.directive';

@Component({
  selector: 'app-manage-attendance',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule, TimeInputDirective, DateInputDirective],
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
  createDate: string = '';
  updatedDate: string = '';
  isEditMode = false;
  attendanceId?: number;
  id!: number;
  isSubmitting = false;


  ngOnInit(): void {
    this.initFormModel();

    const today = new Date().toLocaleDateString('en-GB');
    this.createDate = today;
    // load employees and set loading state
    this.employeesService.getAllEmployees().subscribe({
      next: (res) => {
        this.employeeList = res?.data?.list_items ?? [];
        this.newLogForm.get('employee_id')?.enable();
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.employeeList = [];
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
      date: ['', [Validators.required]],
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
      const today = new Date().toLocaleDateString('en-GB');
      this.updatedDate = today;
    }
  }

  save(): void {
    if (this.newLogForm.invalid) return;
    const raw = this.newLogForm.value;
    const attendance: AttendanceLog = {
      id: this.attendanceId,
      employee_id: raw.employee_id,
      date: raw.date,
      start: raw.start,
      end: raw.end,
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




}
