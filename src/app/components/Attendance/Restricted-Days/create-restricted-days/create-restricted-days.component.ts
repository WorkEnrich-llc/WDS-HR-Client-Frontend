import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { formatDate } from '@angular/common';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { RestrictedService } from '../../../../core/services/attendance/restricted-days/restricted.service';
import { DateRangeValidators } from 'app/core/validators/date-range-validators';

@Component({
  selector: 'app-create-restricted-days',
  imports: [PageHeaderComponent, PopupComponent, NgxDaterangepickerMd, ReactiveFormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './create-restricted-days.component.html',
  styleUrl: './create-restricted-days.component.css'
})
export class CreateRestrictedDaysComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  departments: any[] = [];


  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private _RestrictedService: RestrictedService,
    private _DepartmentsService: DepartmentsService,
    private toasterMessageService: ToasterMessageService,
    private fb: FormBuilder
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  ngOnInit(): void {
    this.getAllDepartments();
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
        console.error(err.error?.details);
      }
    });
  }


  restrictedDayForm: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    restriction_type: new FormControl('', [Validators.required]),
    departments: new FormControl(''),
    dates: new FormControl('', [Validators.required, DateRangeValidators.futureDateRange()]),
  });


  createRestrictedDay() {
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
        code: formValue.code,
        name: formValue.name,
        restriction_type: formValue.restriction_type,
        departments: departments,
        dates: formattedDates
      }
    };

    this._RestrictedService.createRestrictedDay(finalData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/restricted-days/all-restricted-days']);
        this.toasterMessageService.sendMessage("Restricted Day created successfully");

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
