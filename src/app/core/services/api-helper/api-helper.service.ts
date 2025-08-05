import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ErrorHandlingService } from '../error-handling/error-handling.service';
import { NetworkService } from '../network/network.service';

@Injectable({
  providedIn: 'root'
})
export class ApiHelperService {

  constructor(
    private errorHandlingService: ErrorHandlingService,
    private networkService: NetworkService
  ) { }

  /**
   * Generic method to handle API calls with consistent error handling
   */
  handleApiCall<T>(
    apiCall: Observable<T>,
    options?: {
      showToast?: boolean;
      customErrorHandler?: (error: HttpErrorResponse) => string;
      loadingCallback?: (loading: boolean) => void;
    }
  ): Observable<T> {
    const {
      showToast = false,
      customErrorHandler,
      loadingCallback
    } = options || {};

    // Set loading to true when starting
    if (loadingCallback) {
      loadingCallback(true);
    }

    return apiCall.pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle custom error processing
        if (customErrorHandler) {
          const customMessage = customErrorHandler(error);
          if (customMessage) {
            return throwError(() => ({ ...error, customMessage }));
          }
        }

        // Show toast if requested
        if (showToast) {
          this.errorHandlingService.showError(error);
        }

        return throwError(() => error);
      }),
      finalize(() => {
        // Set loading to false when completed
        if (loadingCallback) {
          loadingCallback(false);
        }
      })
    );
  }

  /**
   * Check network connectivity before making API calls
   */
  checkNetworkBeforeCall(): { canProceed: boolean; errorMessage?: string } {
    if (!this.networkService.isOnline()) {
      return {
        canProceed: false,
        errorMessage: 'No internet connection. Please check your connection and try again.'
      };
    }
    return { canProceed: true };
  }

  /**
   * Wrapper for common API error handling pattern
   */
  executeApiCall<T>(
    apiCall: () => Observable<T>,
    errorCallback: (message: string) => void,
    loadingCallback?: (loading: boolean) => void
  ): Observable<T> {
    // Check network first
    const networkCheck = this.checkNetworkBeforeCall();
    if (!networkCheck.canProceed) {
      errorCallback(networkCheck.errorMessage!);
      return throwError(() => new Error(networkCheck.errorMessage));
    }

    // Set loading state
    if (loadingCallback) {
      loadingCallback(true);
    }

    return apiCall().pipe(
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.errorHandlingService.getErrorMessage(error);
        errorCallback(errorMessage);
        return throwError(() => error);
      }),
      finalize(() => {
        if (loadingCallback) {
          loadingCallback(false);
        }
      })
    );
  }
}
