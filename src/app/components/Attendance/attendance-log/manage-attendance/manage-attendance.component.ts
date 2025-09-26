import { ToastrService } from 'ngx-toastr';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { TimeInputDirective } from 'app/core/directives/app-time-input.directive';
import { DateInputDirective } from 'app/core/directives/date.directive';
import { AttendanceLogService } from 'app/core/services/attendance/attendance-log/attendance-log.service';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { firstValueFrom, Observable } from 'rxjs';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { AttendanceLog } from 'app/core/models/attendance-log';

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



  // constructor() { }

  ngOnInit(): void {
    this.initFormModel();
    // this.patchFormValues();
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.id;;

    console.log('attendanceId', this.attendanceService.getAttendanceById(this.id));

    const today = new Date().toLocaleDateString('en-GB');
    this.createDate = today;
    this.employeesService.getAllEmployees().subscribe(res => {
      this.employeeList = res?.data?.list_items ?? [];
      console.log('Employee List:', this.employeeList);
    });

    if (this.isEditMode) {
      this.patchFormValues();  // 👈 اعمل patch بعد ما ييجي الليست
    }

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
    this.router.navigate(['/payroll-components/all-payroll-components']);
  }


  private initFormModel(): void {
    this.newLogForm = this.fb.group({
      employee: ['', [Validators.required]],
      date: ['', [Validators.required]],
      start: ['', [Validators.required]],
      end: ['', [Validators.required]],
    });
  }





  // createNewLog(): void {
  //   if (this.newLogForm.invalid) {
  //     this.newLogForm.markAllAsTouched();
  //     return;
  //   }
  //   const formValue = this.newLogForm.value;
  //   this.attendanceService.createAttendance(formValue).subscribe({
  //     next: (res) => {
  //       this.toasterService.showSuccess('Attendance log created successfully!');
  //       this.router.navigate(['/attendance/attendance-log']);
  //     },
  //     error: (err) => {
  //       this.toasterService.showError('Failed to create attendance log.');
  //     }
  //   });
  // }

  // async saveAttendance(): Promise<void> {
  //   if (this.newLogForm.invalid) {
  //     this.newLogForm.markAllAsTouched();
  //     return;
  //   }

  //   this.isSubmitting = true;
  //   const formValue = this.newLogForm.value;

  //   // Build the data object (adapt to your API model)
  //   const attendanceData: AttendanceLog = {
  //     employee_id: formValue.employee,
  //     date: formValue.date,
  //     start: formValue.start,
  //     end: formValue.end,
  //   };

  //   if (this.isEditMode && this.id) {
  //     attendanceData.id = this.id; // if backend expects an id in payload
  //   }

  //   try {
  //     if (this.isEditMode && this.id) {
  //       // ✅ Update existing log
  //       await firstValueFrom(
  //         this.attendanceService.updateAttendance(
  //           this.id,
  //           attendanceData.employee_id,
  //           attendanceData.date,
  //           attendanceData.start,
  //           attendanceData.end
  //         )
  //       );
  //       this.toasterService.showSuccess('Attendance log updated successfully!');
  //     } else {
  //       // ✅ Create new log
  //       await firstValueFrom(
  //         this.attendanceService.createAttendance(
  //           attendanceData.employee_id,
  //           attendanceData.date,
  //           attendanceData.start,
  //           attendanceData.end
  //         )
  //       );
  //       this.toasterService.showSuccess('Attendance log created successfully!');
  //     }

  //     this.router.navigate(['/attendance/attendance-log']);
  //   } catch (err) {
  //     this.toasterService.showError(
  //       this.isEditMode
  //         ? 'Failed to update attendance log.'
  //         : 'Failed to create attendance log.'
  //     );
  //     console.error('❌ Save attendance failed', err);
  //   } finally {
  //     this.isSubmitting = false;
  //   }
  // }






  private patchFormValues(): void {
    // this.id = Number(this.route.snapshot.paramMap.get('id'));
    // this.isEditMode = !!this.id;
    if (this.isEditMode) {
      console.log('Route ID:', this.id);
      this.attendanceService.getAttendanceById(this.id).subscribe({
        next: (attendance) => {
          this.newLogForm.patchValue({
            employee: attendance.employee_id,
            date: attendance.date,
            start: attendance.start,
            end: attendance.end
          });
          console.log('Attendance fetched for editing:', attendance);
        },
        error: (err) => console.error('Error loading attendance:', err)
      });
    }
    else {
      const today = new Date().toLocaleDateString('en-GB');
      this.createDate = today;
    }
  }

  save(): void {
    if (this.newLogForm.invalid) return;

    const formData = this.buildFormData(this.newLogForm.value);

    let request$: Observable<AttendanceLog>;
    if (this.isEditMode && this.attendanceId) {
      request$ = this.attendanceService.updateAttendance(this.attendanceId, formData);
    } else {
      request$ = this.attendanceService.createAttendance(formData);
    }

    request$.subscribe({
      next: (res) => {
        console.log(this.isEditMode ? 'Updated:' : 'Created:', res);
        // optionally reset form or navigate
      },
      error: (err) => console.error('Error:', err)
    });
  }


  private buildFormData(data: any): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    return formData;
  }

  // createNewLog() {
  //   if (this.newLogForm.valid) {
  //     console.log('Creating new attendance log:', this.newLogForm.value);
  //   }
  // }

}
