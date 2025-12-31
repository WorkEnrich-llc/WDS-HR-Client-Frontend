import { Component, inject, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PermissionsService } from '../../../../core/services/attendance/permissions/permissions.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-late-arrive',
  imports: [PageHeaderComponent, PopupComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-late-arrive.component.html',
  styleUrl: './edit-late-arrive.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditLateArriveComponent {
  private toasterService = inject(ToasterMessageService);
  // Maximum allowed minutes for permission inputs. Backend appears to cap values (e.g., 60),
  // so we validate on the frontend to avoid confusing resets where backend returns 0.
  readonly maxMinutes = 480;
  readonly maxHours = this.maxMinutes / 60;
  get maxHoursLabel(): string {
    return this.formatHours(this.maxMinutes);
  }
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
  invalidCharacterWarning: string = '';

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

  // Prevent non-numeric characters from being typed
  onMinutesKeyDown(event: KeyboardEvent): void {
    const char = event.key;
    // Allow: backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(char)) {
      return;
    }
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(char.toLowerCase())) {
      return;
    }
    // Prevent: non-numeric characters
    if (!/^[0-9]$/.test(char)) {
      event.preventDefault();
    }
  }

  // Sanitize minutes input - remove non-numeric characters and validate
  sanitizeMinutesInput(): void {
    if (this.minutes === null || this.minutes === undefined) {
      this.invalidCharacterWarning = '';
      return;
    }

    // Convert to string, remove all non-numeric characters
    const stringValue = String(this.minutes);
    const sanitized = stringValue.replace(/[^0-9]/g, '');

    // Check if invalid characters were present
    if (sanitized.length < stringValue.length) {
      this.invalidCharacterWarning = 'Only numbers are allowed';
    } else {
      this.invalidCharacterWarning = '';
    }

    // If empty after sanitization, set to null
    if (sanitized === '') {
      this.minutes = null;
      return;
    }

    // Convert to number and enforce constraints
    let numValue = parseInt(sanitized, 10);

    // Ensure positive number
    if (numValue < 0) {
      numValue = 0;
    }

    // Enforce max limit
    if (numValue > this.maxMinutes) {
      numValue = this.maxMinutes;
    }

    this.minutes = numValue;
  }

  // Validate minutes field
  isMinutesInvalid(): boolean {
    if (!this.allowPermission || this.minutes === null || this.minutes === undefined) {
      return false;
    }
    return this.minutes < 1 || this.minutes > this.maxMinutes;
  }

  // Get validation error message
  getMinutesErrorMessage(): string {
    if (!this.allowPermission || this.minutes === null || this.minutes === undefined) {
      return '';
    }

    if (this.minutes < 1) {
      return 'Maximum Requested Minutes must be at least 1';
    }

    if (this.minutes > this.maxMinutes) {
      return `Maximum allowed time is ${this.formatHours(this.maxMinutes)}. Please enter a smaller value.`;
    }

    return '';
  }

  saveChanges() {
    this.isLoading = true;
    if (!this.isChanged) {
      this.isLoading = false;
      return;
    }

    // Sanitize input first
    this.sanitizeMinutesInput();

    // Validation: minutes must be valid when permission is allowed
    if (this.allowPermission && (this.minutes === null || this.minutes === undefined || this.minutes < 1)) {
      this.isLoading = false;
      this.errMsg = 'Maximum Requested Minutes must be at least 1';
      this.toasterService.showError(this.errMsg);
      return;
    }

    // Validation: prevent values greater than allowed max to avoid backend clipping to 0.
    if (this.allowPermission && this.minutes !== null && this.minutes !== undefined && this.minutes > this.maxMinutes) {
      this.isLoading = false;
      this.errMsg = `Maximum allowed time is ${this.formatHours(this.maxMinutes)}. Please enter a smaller value.`;
      this.toasterService.showError(this.errMsg);
      return;
    }
    const earlyLeave = this.permissions?.early_leave || {
      minutes: null,
      note: null
    };

    const sharedMinutes = this.permissions?.shared_minutes || {
      minutes: null,
      note: null
    };

    // Determine whether early_leave has content (minutes defined or note non-empty)
    const earlyLeaveHasContent =
      (earlyLeave.minutes !== null && earlyLeave.minutes !== undefined) ||
      (earlyLeave.note && earlyLeave.note.trim() !== '');

    const sharedMinutesHasContent =
      (sharedMinutes.minutes !== null && sharedMinutes.minutes !== undefined) ||
      (sharedMinutes.note && sharedMinutes.note.trim() !== '');

    const shared_minutes_status = sharedMinutesHasContent ? 'true' : 'false';
    const early_leave_status = earlyLeaveHasContent ? 'true' : 'false';
    const late_arrive_status = this.allowPermission ? 'true' : 'false';

    const formData = new FormData();
    formData.append('late_arrive_minutes', this.minutes !== null && this.minutes !== undefined ? this.minutes.toString() : '');
    formData.append('late_arrive_note', this.note || '');
    formData.append('late_arrive_status', late_arrive_status);

    formData.append('early_leave_minutes', earlyLeave.minutes !== null && earlyLeave.minutes !== undefined ? earlyLeave.minutes.toString() : '');
    formData.append('early_leave_note', earlyLeave.note || '');
    formData.append('early_leave_status', early_leave_status);


    formData.append('shared_minutes', sharedMinutes.minutes !== null && sharedMinutes.minutes !== undefined ? sharedMinutes.minutes.toString() : '');
    formData.append('shared_minutes_note', sharedMinutes.note || '');
    formData.append('shared_minutes_status', shared_minutes_status);

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

  private formatHours(minutes: number): string {
    const hours = minutes / 60;
    const formatted = Number.isInteger(hours) ? hours.toString() : hours.toFixed(2).replace(/\.00$/, '');
    return `${formatted} hour${formatted === '1' ? '' : 's'}`;
  }
}
