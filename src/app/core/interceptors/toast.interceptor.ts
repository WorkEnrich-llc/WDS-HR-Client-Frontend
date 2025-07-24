import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ToasterMessageService } from '../services/tostermessage/tostermessage.service';

export const toastInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const toasterService = inject(ToasterMessageService);

  // Skip toast for GET requests (to avoid too many success messages)
  const skipToastMethods = ['GET'];
  const shouldShowToast = !skipToastMethods.includes(req.method);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse && shouldShowToast) {
          // Only show success toast for 2xx status codes
          if (event.status >= 200 && event.status < 300) {
            // Check if response has a success message
            const responseBody = event.body;
            let message = 'Operation completed successfully';
            
            if (responseBody?.message) {
              message = responseBody.message;
            } else if (responseBody?.data?.message) {
              message = responseBody.data.message;
            } else {
              // Customize message based on HTTP method
              switch (req.method) {
                case 'POST':
                  message = 'Created successfully';
                  break;
                case 'PUT':
                  message = 'Updated successfully';
                  break;
                case 'PATCH':
                  message = 'Updated successfully';
                  break;
                case 'DELETE':
                  message = 'Deleted successfully';
                  break;
                default:
                  message = 'Operation completed successfully';
              }
            }
            
            toasterService.showSuccess(message);
          }
        }
      },
      error: (error) => {
        if (error instanceof HttpErrorResponse && shouldShowToast) {
          let errorMessage = 'An error occurred';
          
          // Extract error message from response
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.details) {
            errorMessage = error.error.details;
          } else if (error.error?.error) {
            errorMessage = error.error.error;
          } else if (error.message) {
            errorMessage = error.message;
          } else {
            // Default messages based on status code
            switch (error.status) {
              case 400:
                errorMessage = 'Bad request. Please check your input.';
                break;
              case 401:
                errorMessage = 'Unauthorized. Please login again.';
                break;
              case 403:
                errorMessage = 'Forbidden. You don\'t have permission.';
                break;
              case 404:
                errorMessage = 'Resource not found.';
                break;
              case 422:
                errorMessage = 'Validation error. Please check your input.';
                break;
              case 500:
                errorMessage = 'Server error. Please try again later.';
                break;
              default:
                errorMessage = `Error ${error.status}: ${error.statusText}`;
            }
          }
          
          toasterService.showError(errorMessage);
        }
      }
    })
  );
};
