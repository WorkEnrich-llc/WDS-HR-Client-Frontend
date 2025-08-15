import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { DatePipe, formatDate } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { RestrictedService } from '../../../../core/services/attendance/restricted-days/restricted.service';

@Component({
  selector: 'app-update-restricted-days',
  imports: [PageHeaderComponent, PopupComponent, NgxDaterangepickerMd, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './update-restricted-days.component.html',
  styleUrl: './update-restricted-days.component.css'
})
export class UpdateRestrictedDaysComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  departments: any[] = [];
  resterictedDayData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  dayId: string | null = null;
  originalFormValue: any;
  constructor(
    private _DepartmentsService: DepartmentsService,
    private _RestrictedService: RestrictedService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private router: Router,
    private toasterMessageService: ToasterMessageService,
    private fb: FormBuilder
  ) {
  }

  ngOnInit(): void {
    this.getAllDepartments();
    this.dayId = this.route.snapshot.paramMap.get('id');
    if (this.dayId) {
      this.getRestrictedDay(Number(this.dayId));
    }
  }
  getAllDepartments(
    searchTerm: string = '',
    filters?: {
      employment_type?: string;
    }
  ) {
    this._DepartmentsService.getAllDepartment(1, 10000, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.departments = response.data.list_items;
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }


  restrictedDayForm: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    restriction_type: new FormControl('', [Validators.required]),
    departments: new FormControl(''),
    dates: new FormControl('', [Validators.required]),
  });

 getRestrictedDay(dayId: number) {
  this._RestrictedService.showRestrictedDay(dayId).subscribe({
    next: (response) => {
      this.resterictedDayData = response.data.object_info;

      const created = this.resterictedDayData?.created_at;
      const updated = this.resterictedDayData?.updated_at;

      if (created) {
        this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
      }
      if (updated) {
        this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
      }

      // console.log(this.resterictedDayData);

      let start: Date | null = null;
      let end: Date | null = null;

      if (this.resterictedDayData?.all_dates && this.resterictedDayData.all_dates.length > 0) {
        start = new Date(this.resterictedDayData.all_dates[0]);
        end = new Date(this.resterictedDayData.all_dates[this.resterictedDayData.all_dates.length - 1]);
      }

      this.restrictedDayForm.patchValue({
        code: this.resterictedDayData.code,
        name: this.resterictedDayData.name,
        restriction_type: this.resterictedDayData.restriction_type,
        departments: this.resterictedDayData.all_departments.map((dep: { id: number }) => dep.id),
        dates: start && end ? { startDate: start, endDate: end } : null
      });

      this.originalFormValue = this.restrictedDayForm.getRawValue();
    },
    error: (err) => {
      console.log(err.error?.details);
    }
  });
}


  formChanged(): boolean {
    return JSON.stringify(this.restrictedDayForm.getRawValue()) !== JSON.stringify(this.originalFormValue);
  }

  // update restricted
  updateRestrictedDay() {
    this.isLoading = true;

    const formValue = this.restrictedDayForm.value;

    const datesRange = formValue.dates;
    const formattedDates: string[] = [];

    if (datesRange && datesRange.startDate && datesRange.endDate) {
      const start = new Date(datesRange.startDate);
      const end = new Date(datesRange.endDate);

      const current = new Date(start);
      while (current <= end) {
        formattedDates.push(formatDate(current, 'yyyy-MM-dd', 'en'));
        current.setDate(current.getDate() + 1);
      }
    }

    const departmentsRaw = formValue.departments;
    const departments: number[] = Array.isArray(departmentsRaw)
      ? departmentsRaw.map((id: any) => +id)
      : departmentsRaw
        ? [+departmentsRaw]
        : [];

    const finalData = {
      request_data: {
        id:this.resterictedDayData.id,
        code: formValue.code,
        name: formValue.name,
        restriction_type: formValue.restriction_type,
        departments: departments,
        dates: formattedDates
      }
    };

    // console.log(finalData);
    this._RestrictedService.updateRestrictedDay(finalData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/restricted-days/all-restricted-days']);
        this.toasterMessageService.sendMessage("Restricted Day updated successfully");

      },
      error: (err) => {
        this.isLoading = false;
        const statusCode = err?.status;
        const errorHandling = err?.error?.data?.error_handling;
        if (statusCode === 400) {
          if (Array.isArray(errorHandling) && errorHandling.length > 0) {
            this.errMsg = errorHandling[0].error;
          } else if (err?.error?.details) {
            this.errMsg = err.error.details;
          } else {
            this.errMsg = "An unexpected error occurred. Please try again later.";
          }
        } else {
          this.errMsg = "An unexpected error occurred. Please try again later.";
        }
      }

    });
  }
  // popups
  isModalOpen = false;
  isSuccessModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/restricted-days/all-restricted-days']);
  }
}
