import { Component, inject, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../../../../core/services/attendance/permissions/permissions.service';
import { CommonModule } from '@angular/common';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-early-leave',
  imports: [PageHeaderComponent, PopupComponent, FormsModule, CommonModule],
  templateUrl: './edit-early-leave.component.html',
  styleUrl: './edit-early-leave.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditEarlyLeaveComponent {
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

  ngOnInit(): void {
    this.getpermissions();
  }
  getpermissions() {
    this._PermissionsService.getPermissions().subscribe({
      next: (data) => {
        this.permissions = data.data.object_info;

        const early = this.permissions?.early_leave;
        if (early && (early.minutes || early.note)) {
          this.allowPermission = true;
          this.minutes = early.minutes;
          this.note = early.note ?? '';
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

    const lateFromApi = this.permissions?.late_arrive || {
      minutes: null,
      note: null
    };

    const late_arrive_status =
      (lateFromApi.minutes && lateFromApi.minutes !== 0) ||
        (lateFromApi.note && lateFromApi.note.trim() !== '')
        ? 'true'
        : 'false';

    const early_leave_status = this.allowPermission ? 'true' : 'false';

    const formData = new FormData();

    formData.append('late_arrive_minutes', lateFromApi.minutes ? lateFromApi.minutes.toString() : '');
    formData.append('late_arrive_note', lateFromApi.note || '');
    formData.append('late_arrive_status', late_arrive_status);

    formData.append('early_leave_minutes', this.minutes ? this.minutes.toString() : '');
    formData.append('early_leave_note', this.note || '');
    formData.append('early_leave_status', early_leave_status);

    // console.log('FormData content:');
    // formData.forEach((value, key) => {
    //   console.log(key, value);
    // });

    this._PermissionsService.updatePermission(formData).subscribe({
      next: () => {
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
  isModalOpen = false;

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
