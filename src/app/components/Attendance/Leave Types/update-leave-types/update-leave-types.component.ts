import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';

@Component({
  selector: 'app-update-leave-types',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './update-leave-types.component.html',
  styleUrl: './update-leave-types.component.css'
})
export class UpdateLeaveTypesComponent {
  isFormChanged = false;
  carryoverAllowed: boolean = false;
  errMsg: string = '';
  isLoading: boolean = false;
  leaveTypeData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  leaveId: string | null = null;
  constructor(
    private _LeaveTypeService: LeaveTypeService,
    private router: Router,
    private route: ActivatedRoute,
    private toasterMessageService: ToasterMessageService,
    private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.leaveId = this.route.snapshot.paramMap.get('id');
    // this.getLeaveJob(Number(this.leaveId));
    if (this.leaveId) {
      this.getLeaveJob(Number(this.leaveId));
    }
  }


  getLeaveJob(leaveId: number) {

    this._LeaveTypeService.showLeaveType(leaveId).subscribe({
      next: (response) => {
      this.leaveTypeData = response.data.object_info;

      const settings = this.leaveTypeData.settings;
      this.carryoverAllowed = settings.allow_carryover;

      // تعبئة الفورم 1
      this.leaveType1.patchValue({
        code: this.leaveTypeData.code,
        name: this.leaveTypeData.name,
        PermissionType: this.leaveTypeData.permission,
        description: this.leaveTypeData.description,
        employmentType: this.leaveTypeData.employment_type?.id || ''
      });

      // تعبئة الفورم 2
      this.leaveType2.patchValue({
        accrual_rate: settings.accrual_rate,
        leave_limits: settings.leave_limits,
        max_review_days: settings.max_review_days,
        maximum_carryover_days: settings.maximum_carryover_days
      });

      // تعديل صلاحية maximum_carryover_days
      this.toggleCarryoverValidators();

      // مراقبة التغييرات
      this.monitorFormChanges();

      // تواريخ الإنشاء والتحديث
      const created = this.leaveTypeData?.created_at;
      const updated = this.leaveTypeData?.updated_at;
      if (created) this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
      if (updated) this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
    },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }


monitorFormChanges() {
  const initialLeaveType1 = this.leaveType1.getRawValue();
  const initialLeaveType2 = this.leaveType2.getRawValue();

  this.leaveType1.valueChanges.subscribe(() => {
    const current1 = this.leaveType1.getRawValue();
    this.isFormChanged = JSON.stringify(current1) !== JSON.stringify(initialLeaveType1) ||
                         JSON.stringify(this.leaveType2.getRawValue()) !== JSON.stringify(initialLeaveType2);
  });

  this.leaveType2.valueChanges.subscribe(() => {
    const current2 = this.leaveType2.getRawValue();
    this.isFormChanged = JSON.stringify(this.leaveType1.getRawValue()) !== JSON.stringify(initialLeaveType1) ||
                         JSON.stringify(current2) !== JSON.stringify(initialLeaveType2);
  });
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

  updateleaveType() {
    this.isLoading = true;
    const request_data = {
      id:Number(this.leaveTypeData.id),
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
    console.log(finalData);

    this._LeaveTypeService.updateLeaveType(finalData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/leave-types/all-leave-types']);
        this.toasterMessageService.sendMessage("Leave Type Updated successfully");

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
