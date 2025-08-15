import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ApiToastHelper } from '../../../../core/helpers/api-toast.helper';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';
@Component({
  selector: 'app-create-leave-type',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './create-leave-type.component.html',
  styleUrl: './create-leave-type.component.css'
})
export class CreateLeaveTypeComponent {
  carryoverAllowed: boolean = false;
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService,
    private _LeaveTypeService: LeaveTypeService
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  leaveType1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required,Validators.minLength(3),Validators.maxLength(100)]),
    PermissionType: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    employmentType: new FormControl('', [Validators.required]),
  });



  leaveType2: FormGroup = new FormGroup({
    accrual_rate: new FormControl('', [Validators.required,  Validators.pattern('^\\d+(\\.\\d+)?$')]),
    leave_limits: new FormControl('', [Validators.required,  Validators.pattern('^\\d+(\\.\\d+)?$')]),
    max_review_days: new FormControl('', [Validators.required,  Validators.pattern('^\\d+(\\.\\d+)?$')]),
    maximum_carryover_days: new FormControl({ value: '', disabled: true }, [ Validators.pattern('^\\d+(\\.\\d+)?$')])
  });
  toggleCarryoverValidators() {
    const control = this.leaveType2.get('maximum_carryover_days');
    if (this.carryoverAllowed) {
      control?.enable();
      control?.setValidators([Validators.required,  Validators.pattern('^\\d+(\\.\\d+)?$')]);
    } else {
      control?.disable();
      control?.clearValidators();
      control?.setValue('');
    }
    control?.updateValueAndValidity();
  }

 createleaveType() {
    this.isLoading = true;
    const request_data = {
      code: this.leaveType1.get('code')?.value,
      name: this.leaveType1.get('name')?.value,
      permission: this.leaveType1.get('PermissionType')?.value,
      description: this.leaveType1.get('description')?.value,
      employment_type: Number(this.leaveType1.get('employmentType')?.value),
      settings: {
        accrual_rate: Number(this.leaveType2.get('accrual_rate')?.value),
        leave_limits: Number(this.leaveType2.get('leave_limits')?.value),
        max_review_days: Number(this.leaveType2.get('max_review_days')?.value),
        allow_carryover: this.carryoverAllowed,
        maximum_carryover_days: this.carryoverAllowed
          ? Number(this.leaveType2.get('maximum_carryover_days')?.value)
          : 0
      }
    };
    const finalData = { request_data };
    // console.log(finalData);
    this._LeaveTypeService.createLeavetype(finalData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        
        // Show success toast
        this.toasterMessageService.showSuccess("Leave Type created successfully", "Success");
        
        // Navigate to list page
        this.router.navigate(['/leave-types/all-leave-types']);
      },
      error: (err) => {
        this.isLoading = false;
        const statusCode = err?.status;
        const errorHandling = err?.error?.data?.error_handling;
        
        if (statusCode === 400) {
          if (Array.isArray(errorHandling) && errorHandling.length > 0) {
            this.currentStep = errorHandling[0].tap;
            this.errMsg = errorHandling[0].error;
          } else if (err?.error?.details) {
            this.errMsg = err.error.details;
          } else {
            this.errMsg = "An unexpected error occurred. Please try again later.";
          }
        } else {
          this.errMsg = "An unexpected error occurred. Please try again later.";
          // Use the helper for general error handling
          ApiToastHelper.handleApiError(err, this.toasterMessageService);
        }
      }
    });
  }

  // next and prev
  currentStep = 1;

  goNext() {
    this.currentStep++;

  }

  goPrev() {
    this.currentStep--;
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
    this.router.navigate(['/leave-types/all-leave-types']);
  }

}
