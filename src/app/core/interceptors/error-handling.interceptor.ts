import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
export const errorHandlingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log the error for debugging
      // console.error('HTTP Error:', error);

      // Don't show global error handling for certain endpoints that handle their own errors
      const skipGlobalHandling = req.url.includes('/check-email') || 
                                req.url.includes('/login') ||
                                req.headers.has('Skip-Error-Handling');

      if (!skipGlobalHandling) {
        // You can choose to show error immediately or let components handle it
        // For now, we'll let components handle it but the service is available
        // errorHandlingService.showError(error);
      }

      // Always rethrow the error so components can handle it
      return throwError(() => error);
    })
  );
};
