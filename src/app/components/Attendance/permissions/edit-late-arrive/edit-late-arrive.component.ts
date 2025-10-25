import { Component, inject, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PermissionsService } from '../../../../core/services/attendance/permissions/permissions.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-late-arrive',
  imports: [PageHeaderComponent, PopupComponent, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './edit-late-arrive.component.html',
  styleUrl: './edit-late-arrive.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditLateArriveComponent {
  private toasterService = inject(ToasterMessageService);
  // Maximum allowed minutes for permission inputs. Backend appears to cap values (e.g., 60),
  // so we validate on the frontend to avoid confusing resets where backend returns 0.
  readonly maxMinutes = 60;
  constructor(
    private router: Router,
    private _PermissionsService: PermissionsService
  ) { }
  isLoading = false;
  permissions: any;
  allowPermission = false;
  minutes: number | null = null;
  note: string = '';
  errMsg: string = '';

  originalData: any;

  isModalOpen = false;

  ngOnInit(): void {
    this.getpermissions();
  }

  getpermissions() {
    this._PermissionsService.getPermissions().subscribe({
      next: (data) => {
        this.permissions = data.data.object_info;

        const late = this.permissions?.late_arrive;
        if (late && (late.minutes || late.note)) {
          this.allowPermission = true;
          this.minutes = late.minutes;
          this.note = late.note ?? '';
        } else {
          this.allowPermission = false;
          this.minutes = null;
          this.note = '';
        }
        this.originalData = {
          allowPermission: this.allowPermission,
          minutes: this.minutes,
          note: this.note
        };

      },
      error: (error) => {
        console.error('Error fetching permissions:', error);
      }
    });
  }

  onPermissionChange() {
    if (!this.allowPermission) {
      this.minutes = null;
      this.note = '';
    }
  }

  get isChanged(): boolean {
    if (!this.originalData) return false;
    return (
      this.allowPermission !== this.originalData.allowPermission ||
      this.minutes !== this.originalData.minutes ||
      this.note !== this.originalData.note
    );
  }

  saveChanges() {
    this.isLoading = true;
    if (!this.isChanged) {
      this.isLoading = false;
      return;
    }

    // Validation: minutes must not be negative when permission is allowed
    if (this.allowPermission && this.minutes !== null && this.minutes !== undefined && this.minutes < 0) {
      // field-level validation is displayed in template; stop submission
      this.isLoading = false;
      return;
    }

    // Validation: prevent values greater than allowed max to avoid backend clipping to 0.
    if (this.allowPermission && this.minutes !== null && this.minutes !== undefined && this.minutes > this.maxMinutes) {
      this.isLoading = false;
      this.errMsg = `Maximum allowed minutes is ${this.maxMinutes}. Please enter a smaller value.`;
      this.toasterService.showError(this.errMsg);
      return;
    }
    const earlyLeave = this.permissions?.early_leave || {
      minutes: null,
      note: null
    };

    // Determine whether early_leave has content (minutes defined or note non-empty)
    const earlyLeaveHasContent =
      (earlyLeave.minutes !== null && earlyLeave.minutes !== undefined) ||
      (earlyLeave.note && earlyLeave.note.trim() !== '');

    const early_leave_status = earlyLeaveHasContent ? 'true' : 'false';
    const late_arrive_status = this.allowPermission ? 'true' : 'false';

    const formData = new FormData();
    formData.append('late_arrive_minutes', this.minutes !== null && this.minutes !== undefined ? this.minutes.toString() : '');
    formData.append('late_arrive_note', this.note || '');
    formData.append('late_arrive_status', late_arrive_status);

    formData.append('early_leave_minutes', earlyLeave.minutes !== null && earlyLeave.minutes !== undefined ? earlyLeave.minutes.toString() : '');
    formData.append('early_leave_note', earlyLeave.note || '');
    formData.append('early_leave_status', early_leave_status);

    // console.log('FormData content:');
    // formData.forEach((value, key) => {
    //   console.log(key, value);
    // });


    this._PermissionsService.updatePermission(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        this.toasterService.showSuccess('Permissions updated successfully');
        this.router.navigate(['/permissions']);
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
        this.toasterService.showError(this.errMsg);
      }
    });
  }


  // discard popup
  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/permissions']);
  }
}
