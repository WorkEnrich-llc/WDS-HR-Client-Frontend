# Comprehensive Network Error Handling Solution

## Overview
This document provides a complete solution for handling network connectivity errors across your Angular application. The solution builds upon your existing error handling infrastructure and provides consistent network error handling for all API calls.

## Current Issue Analysis
The reset password component shows "An error occurred" instead of specific network error messages when there's no internet connection during the code verification step.

## Solution Implementation

### 1. Enhanced HTTP Interceptor (Recommended Upgrade)

The current interceptor can be enhanced to provide automatic network error handling:

```typescript
// Update: src/app/core/interceptors/error-handling.interceptor.ts
import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timer, switchMap } from 'rxjs/operators';
import { ErrorHandlingService } from '../services/error-handling/error-handling.service';
import { NetworkService } from '../services/network/network.service';

export const errorHandlingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const errorHandlingService = inject(ErrorHandlingService);
  const networkService = inject(NetworkService);

  return next(req).pipe(
    retry({
      count: 1,
      delay: (error) => {
        // Only retry on network errors, not HTTP errors
        if (error.status === 0 && networkService.isOnline()) {
          return timer(1000); // Wait 1 second before retry
        }
        throw error;
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Log the error for debugging
      console.error('HTTP Error:', error);

      // Enhanced network error detection
      if (errorHandlingService.isNetworkError(error)) {
        // Override error message for network issues
        const networkError = new HttpErrorResponse({
          ...error,
          error: {
            details: networkService.isOnline() 
              ? 'Unable to connect to the server. Please check your internet connection and try again.'
              : 'No internet connection. Please check your connection and try again.'
          }
        });
        
        console.error('Network connectivity issue detected');
        return throwError(() => networkError);
      }

      // Don't show global error handling for certain endpoints that handle their own errors
      const skipGlobalHandling = req.url.includes('/check-email') || 
                                req.url.includes('/login') ||
                                req.headers.has('Skip-Error-Handling');

      if (!skipGlobalHandling) {
        // You can choose to show error immediately or let components handle it
        // errorHandlingService.showError(error);
      }

      // Always rethrow the error so components can handle it
      return throwError(() => error);
    })
  );
};
```

### 2. Enhanced ApiHelper Service (Immediate Solution)

Update your ApiHelper service to handle all API calls consistently:

```typescript
// Update: src/app/core/services/api-helper/api-helper.service.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, finalize, retry, switchMap } from 'rxjs/operators';
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
   * Enhanced network connectivity check with detailed error messages
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
   * Enhanced API call wrapper with comprehensive error handling
   */
  executeApiCall<T>(
    apiCall: () => Observable<T>,
    errorCallback: (message: string) => void,
    loadingCallback?: (loading: boolean) => void,
    options?: {
      skipNetworkCheck?: boolean;
      enableRetry?: boolean;
      customErrorMessage?: string;
    }
  ): Observable<T> {
    // Default options
    const config = {
      skipNetworkCheck: false,
      enableRetry: true,
      ...options
    };

    // Check network first (unless skipped)
    if (!config.skipNetworkCheck) {
      const networkCheck = this.checkNetworkBeforeCall();
      if (!networkCheck.canProceed) {
        errorCallback(config.customErrorMessage || networkCheck.errorMessage!);
        return throwError(() => new Error(networkCheck.errorMessage));
      }
    }

    // Set loading state
    if (loadingCallback) {
      loadingCallback(true);
    }

    let apiObservable = apiCall();

    // Add retry logic if enabled
    if (config.enableRetry) {
      apiObservable = apiObservable.pipe(
        retry({
          count: 1,
          delay: (error) => {
            // Only retry on network errors
            if (this.errorHandlingService.isNetworkError(error)) {
              return timer(1000);
            }
            throw error;
          }
        })
      );
    }

    return apiObservable.pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = this.errorHandlingService.getErrorMessage(error);
        
        // Override with custom message if provided
        if (config.customErrorMessage && this.errorHandlingService.isNetworkError(error)) {
          errorMessage = config.customErrorMessage;
        }
        
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

  /**
   * Simplified API call for basic use cases
   */
  simpleApiCall<T>(
    apiCall: () => Observable<T>,
    onSuccess: (response: T) => void,
    onError: (message: string) => void,
    onLoading?: (loading: boolean) => void
  ): void {
    this.executeApiCall(
      apiCall,
      onError,
      onLoading
    ).subscribe({
      next: onSuccess,
      error: () => {} // Error already handled in executeApiCall
    });
  }
}
```

### 3. Updated Reset Password Component (Preferred Approach)

Use the enhanced ApiHelper service in your reset password component:

```typescript
// Update checkCode method in reset-password.component.ts
checkCode(): void {
  this.errMsg = '';
  
  const formData = new FormData();
  formData.append('username', this.emailForm.get('email')?.value);
  formData.append('verification_code', this.otpForm.get('otp')?.value);

  // Use ApiHelper for consistent error handling
  this.apiHelper.executeApiCall(
    () => this._AuthenticationService.forgetCheckCode(formData),
    (errorMessage) => this.errMsg = errorMessage,
    (loading) => this.isLoading = loading,
    {
      customErrorMessage: 'Unable to verify code. Please check your internet connection and try again.'
    }
  ).subscribe({
    next: (response) => {
      this.goNext();
    }
  });
}

// Similarly, update sendOtp method:
sendOtp(): void {
  this.errMsg = '';
  const emailControl = this.emailForm.get('email');
  if (!emailControl?.value) return;

  this.apiHelper.executeApiCall(
    () => this._AuthenticationService.forgetPassSendCode(emailControl.value),
    (errorMessage) => this.errMsg = errorMessage,
    (loading) => this.isLoading = loading
  ).subscribe({
    next: (response) => {
      this.goNext();
    }
  });
}

// And newPassword method:
newPassword(): void {
  this.errMsg = '';
  
  const formData = new FormData();
  formData.append('username', this.emailForm.get('email')?.value);
  formData.append('verification_code', this.otpForm.get('otp')?.value);
  formData.append('password', this.passwordForm.get('password')?.value);
  formData.append('re_password', this.passwordForm.get('rePassword')?.value);

  this.apiHelper.executeApiCall(
    () => this._AuthenticationService.newPassword(formData),
    (errorMessage) => this.errMsg = errorMessage,
    (loading) => this.isLoading = loading
  ).subscribe({
    next: (response) => {
      this.emailForm.reset();
      this.otpForm.reset();
      this.passwordForm.reset();
      this.toasterMessageService.sendMessage(response.details);
      this._Router.navigate(['/auth/login']);
    }
  });
}
```

### 4. Global Network Status Component

Add the network status component to your main app component to show network status globally:

```html
<!-- In app.component.html -->
<app-network-status></app-network-status>
<router-outlet></router-outlet>
```

### 5. Enhanced Error Messages

Your ErrorHandlingService already provides good error messages. To make them even more specific for network issues, you can enhance the network detection:

```typescript
// Update in error-handling.service.ts
isNetworkError(error: HttpErrorResponse): boolean {
  return !this.networkService.isOnline() || 
         error.status === 0 || 
         error.status === 504 || // Gateway timeout
         (error.name === 'HttpErrorResponse' && !error.status) ||
         error.message?.toLowerCase().includes('network') ||
         error.message?.toLowerCase().includes('timeout');
}
```

## Benefits of This Solution

1. **Consistent Error Handling**: All API calls use the same error handling pattern
2. **Automatic Network Detection**: Detects network issues and provides specific messages
3. **Retry Logic**: Automatically retries failed network requests
4. **Loading State Management**: Handles loading states consistently
5. **Flexible Configuration**: Can be customized per API call
6. **Global Network Status**: Shows network status to users
7. **Debugging Support**: Maintains console logging for developers

## Implementation Priority

1. **Immediate Fix**: Update the checkCode method to use ApiHelper service
2. **Short Term**: Implement enhanced ApiHelper service methods
3. **Long Term**: Update HTTP interceptor for global handling

## Testing

To test network error handling:

1. Disconnect internet and try API calls
2. Use Chrome DevTools Network tab to simulate offline mode
3. Use throttling to simulate slow connections
4. Test with server shutdown to simulate connection failures

## Migration Guide

To migrate existing components:

1. Replace manual network checks with `apiHelper.executeApiCall()`
2. Remove individual error handling logic
3. Use consistent error callback pattern
4. Remove manual loading state management

This solution ensures that all network connectivity issues are handled consistently across your entire application with specific, user-friendly error messages.
