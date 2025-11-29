import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToasterMessageService {
  private messageSource = new BehaviorSubject<string>('');
  currentMessage$ = this.messageSource.asObservable();

  constructor(private toastr: ToastrService) {}

  /**
   * @deprecated Use showSuccess, showError, showWarning, or showInfo instead.
   */
  sendMessage(message: string) {
    this.messageSource.next(message);
  }

  /**
   * @deprecated Use showSuccess, showError, showWarning, or showInfo instead.
   */
  clearMessage() {
    this.messageSource.next('');
  }

  // Toast methods for different types
  showSuccess(message: string, title?: string) {
    this.toastr.success(message, title || 'Success', {
      timeOut: 4000,
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-top-right',
      toastClass: 'custom-toast success-toast'
    });
  }

  showError(message: string, title?: string) {
    this.toastr.error(message, title || 'Error', {
      timeOut: 4000,
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-top-right',
      toastClass: 'custom-toast error-toast'
    });
  }

  showWarning(message: string, title?: string) {
    this.toastr.warning(message, title || 'Warning', {
      timeOut: 4000,
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-top-right',
      toastClass: 'custom-toast warning-toast'
    });
  }

  showInfo(message: string, title?: string) {
    this.toastr.info(message, title || 'Info', {
      timeOut: 4000,
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-top-right',
      toastClass: 'custom-toast info-toast'
    });
  }

  // Method to show toast based on API response
  showApiResponseToast(response: any, successMessage?: string) {
    if (response.status >= 200 && response.status < 300) {
      const message = successMessage || response.message || 'Operation completed successfully';
      this.showSuccess(message);
    } else if (response.status >= 400) {
      const message = response.message || 'An error occurred';
      this.showError(message);
    }
  }
}
