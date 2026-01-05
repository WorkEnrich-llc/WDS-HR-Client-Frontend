
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { PermissionsService } from 'app/core/services/attendance/permissions/permissions.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-shared-minutes',
  imports: [PageHeaderComponent, PopupComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-shared-minutes.component.html',
  styleUrl: './edit-shared-minutes.component.css'
})
export class EditSharedMinutesComponent {
  private toasterService = inject(ToasterMessageService);
  private router = inject(Router);
  private _PermissionsService = inject(PermissionsService);
  readonly maxMinutes = 480;
  readonly maxHours = this.maxMinutes / 60;
  get maxHoursLabel(): string {
    return this.formatHours(this.maxMinutes);
  }
  constructor() { }
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
    this.getPermissions();
  }

  getPermissions() {
    this._PermissionsService.getPermissions().subscribe({
      next: (data) => {
        this.permissions = data.data.object_info;

        const shared = this.permissions?.shared_minutes;
        if (shared && (shared.minutes || shared.note)) {
          this.allowPermission = true;
          this.minutes = shared.minutes;
          this.note = shared.note ?? '';
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
    // Prevent: non-numeric characters except decimal point
    if (!/^[0-9.]$/.test(char)) {
      event.preventDefault();
    }
  }

  // Sanitize minutes input - remove non-numeric characters and validate
  sanitizeMinutesInput(): void {
    if (this.minutes === null || this.minutes === undefined) {
      this.invalidCharacterWarning = '';
      return;
    }

    // Convert to string, remove all non-numeric characters except decimal point
    const stringValue = String(this.minutes);
    const sanitized = stringValue.replace(/[^0-9.]/g, '');

    // Check if invalid characters were present
    if (sanitized.length < stringValue.length) {
      this.invalidCharacterWarning = 'Only numbers and decimal point are allowed';
    } else {
      this.invalidCharacterWarning = '';
    }

    // If empty after sanitization, set to null
    if (sanitized === '' || sanitized === '.') {
      this.minutes = null;
      return;
    }

    // Convert to number and enforce constraints
    let numValue = parseFloat(sanitized);

    // Handle NaN
    if (isNaN(numValue)) {
      this.minutes = null;
      return;
    }

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

  // saveChanges() {
  //   this.isLoading = true;
  //   if (!this.isChanged) {
  //     this.isLoading = false;
  //     return;
  //   }

  //   // Sanitize input first
  //   this.sanitizeMinutesInput();

  //   // Validation: minutes must be valid when permission is allowed
  //   if (this.allowPermission && (this.minutes === null || this.minutes === undefined || this.minutes < 1)) {
  //     this.isLoading = false;
  //     this.errMsg = 'Maximum Requested Minutes must be at least 1';
  //     this.toasterService.showError(this.errMsg);
  //     return;
  //   }

  //   // Validation: prevent values greater than allowed max to avoid backend clipping to 0.
  //   if (this.allowPermission && this.minutes !== null && this.minutes !== undefined && this.minutes > this.maxMinutes) {
  //     this.isLoading = false;
  //     this.errMsg = `Maximum allowed minutes is ${this.maxMinutes}. Please enter a smaller value.`;
  //     this.toasterService.showError(this.errMsg);
  //     return;
  //   }

  //   const lateFromApi = this.permissions?.late_arrive || {
  //     minutes: null,
  //     note: null
  //   };

  //   const late_arrive_status =
  //     (lateFromApi.minutes && lateFromApi.minutes !== 0) ||
  //       (lateFromApi.note && lateFromApi.note.trim() !== '')
  //       ? 'true'
  //       : 'false';

  //   const early_leave_status = this.allowPermission ? 'true' : 'false';

  //   const formData = new FormData();

  //   formData.append('late_arrive_minutes', lateFromApi.minutes ? lateFromApi.minutes.toString() : '');
  //   formData.append('late_arrive_note', lateFromApi.note || '');
  //   formData.append('late_arrive_status', late_arrive_status);

  //   formData.append('early_leave_minutes', this.minutes ? this.minutes.toString() : '');
  //   formData.append('early_leave_note', this.note || '');
  //   formData.append('early_leave_status', early_leave_status);

  //   // console.log('FormData content:');
  //   // formData.forEach((value, key) => {
  //   //   console.log(key, value);
  //   // });

  //   this._PermissionsService.updatePermission(formData).subscribe({
  //     next: () => {
  //       this.isLoading = false;
  //       this.errMsg = '';
  //       this.toasterService.showSuccess('Permissions updated successfully');
  //       this.router.navigate(['/permissions']);
  //     },
  //     error: (err) => {
  //       this.isLoading = false;
  //       const statusCode = err?.status;
  //       const errorHandling = err?.error?.data?.error_handling;

  //       if (statusCode === 400) {
  //         if (Array.isArray(errorHandling) && errorHandling.length > 0) {
  //           this.errMsg = errorHandling[0].error;
  //         } else if (err?.error?.details) {
  //           this.errMsg = err.error.details;
  //         } else {
  //           this.errMsg = "An unexpected error occurred. Please try again later.";
  //         }
  //       } else {
  //         this.errMsg = "An unexpected error occurred. Please try again later.";
  //       }
  //       this.toasterService.showError(this.errMsg);
  //     }
  //   });
  // }


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

    // Validation: prevent values greater than allowed max
    if (this.allowPermission && this.minutes !== null && this.minutes !== undefined && this.minutes > this.maxMinutes) {
      this.isLoading = false;
      this.errMsg = `Maximum allowed time is ${this.formatHours(this.maxMinutes)}. Please enter a smaller value.`;
      this.toasterService.showError(this.errMsg);
      return;
    }

    const lateFromApi = this.permissions?.late_arrive || { minutes: null, note: null };
    const late_arrive_status = (lateFromApi.minutes || lateFromApi.note) ? 'true' : 'false';

    const earlyFromApi = this.permissions?.early_leave || { minutes: null, note: null };
    const early_leave_status = (earlyFromApi.minutes || earlyFromApi.note) ? 'true' : 'false';

    const shared_minutes_status = this.allowPermission ? 'true' : 'false';

    const formData = new FormData();

    formData.append('shared_minutes', this.minutes ? this.minutes.toString() : '');
    formData.append('shared_minutes_note', this.note || '');
    formData.append('shared_minutes_status', shared_minutes_status);

    formData.append('late_arrive_minutes', lateFromApi.minutes ? lateFromApi.minutes.toString() : '');
    formData.append('late_arrive_note', lateFromApi.note || '');
    formData.append('late_arrive_status', late_arrive_status);

    formData.append('early_leave_minutes', earlyFromApi.minutes ? earlyFromApi.minutes.toString() : '');
    formData.append('early_leave_note', earlyFromApi.note || '');
    formData.append('early_leave_status', early_leave_status);

    this._PermissionsService.updatePermission(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        this.toasterService.showSuccess('Permissions updated successfully', "Updated Successfully");
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
