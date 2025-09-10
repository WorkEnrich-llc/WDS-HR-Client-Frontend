import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PermissionsService } from '../../../../core/services/attendance/permissions/permissions.service';

@Component({
  selector: 'app-edit-late-arrive',
  imports: [PageHeaderComponent, PopupComponent, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './edit-late-arrive.component.html',
  styleUrl: './edit-late-arrive.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditLateArriveComponent {
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
    if (!this.isChanged) return;

    const earlyLeave = this.permissions?.early_leave || {
      minutes: null,
      note: null
    };

    const early_leave_status =
      (earlyLeave.minutes && earlyLeave.minutes !== 0) ||
        (earlyLeave.note && earlyLeave.note.trim() !== '')
        ? 'true'
        : 'false';

    const late_arrive_status = this.allowPermission ? 'true' : 'false';

    const formData = new FormData();
    formData.append('late_arrive_minutes', this.minutes ? this.minutes.toString() : '');
    formData.append('late_arrive_note', this.note || '');
    formData.append('late_arrive_status', late_arrive_status);

    formData.append('early_leave_minutes', earlyLeave.minutes ? earlyLeave.minutes.toString() : '');
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
