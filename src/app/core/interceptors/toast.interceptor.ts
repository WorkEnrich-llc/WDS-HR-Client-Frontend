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
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthenticationService } from '../services/authentication/authentication.service';

// Helper function to extract error messages from the complex API error structure
function extractErrorMessages(error: HttpErrorResponse): string[] {
  const messages: string[] = [];

  try {
    const errorBody = error.error;

    // Check for error_handling array in data
    if (errorBody?.data?.error_handling && Array.isArray(errorBody.data.error_handling)) {
      errorBody.data.error_handling.forEach((errorItem: any) => {
        if (errorItem.error) {
          messages.push(errorItem.error);
        }
      });
    }

    // Check for direct error messages
    if (errorBody?.message && messages.length === 0) {
      messages.push(errorBody.message);
    } else if (errorBody?.details && messages.length === 0) {
      messages.push(errorBody.details);
    } else if (errorBody?.error && typeof errorBody.error === 'string' && messages.length === 0) {
      messages.push(errorBody.error);
    }

    // Check for validation errors if it's an object
    if (errorBody?.error && typeof errorBody.error === 'object' && messages.length === 0) {
      Object.keys(errorBody.error).forEach(key => {
        const fieldErrors = errorBody.error[key];
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach(fieldError => {
            messages.push(`${key}: ${fieldError}`);
          });
        } else if (typeof fieldErrors === 'string') {
          messages.push(`${key}: ${fieldErrors}`);
        }
      });
    }

  } catch (parseError) {
    console.error('Error parsing API error response:', parseError);
  }

  return messages;
}

// Helper function to get default error messages based on status code
function getDefaultErrorMessage(error: HttpErrorResponse): string {
  if (error.message && !error.message.includes('Http failure response')) {
    return error.message;
  }

  switch (error.status) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'Unauthorized. Please login again.';
    case 403:
      return 'Forbidden. You don\'t have permission.';
    case 404:
      return 'Resource not found.';
    case 422:
      return 'Validation error. Please check your input.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'Bad gateway. Please try again later.';
    case 0:
      return 'Network error. Please check your connection.';
    default:
      return `Error ${error.status}: ${error.statusText || 'Unknown error'}`;
  }
}

export const toastInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const toasterService = inject(ToasterMessageService);
  const router = inject(Router);
  const cookieService = inject(CookieService);
  const authService = inject(AuthenticationService);

  const skipToastMethods = ['GET'];
  const shouldShowToast = !skipToastMethods.includes(req.method);

  const performLogout = () => {
    const deviceToken = localStorage.getItem('device_token');

    authService.logout().subscribe({
      next: () => {
        localStorage.clear();
        if (deviceToken) {
          localStorage.setItem('device_token', deviceToken);
        }

        cookieService.deleteAll('/', window.location.hostname);
        router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);

        localStorage.clear();
        if (deviceToken) {
          localStorage.setItem('device_token', deviceToken);
        }

        cookieService.deleteAll('/', window.location.hostname);
        router.navigate(['/auth/login']);
      }
    });
  };


  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse && shouldShowToast) {
          if (event.status >= 200 && event.status < 300) {
            const responseBody = event.body;
            let message = '';

            if (responseBody?.data?.details) {
              message = responseBody.data.details;
            }
            else if (responseBody?.data?.message) {
              message = responseBody.data.message;
            }
            else if (responseBody?.message) {
              message = responseBody.message;
            }
            else if (responseBody?.details) {
              message = responseBody.details;
            }
            else if (typeof responseBody?.data === 'string') {
              message = responseBody.data;
            }

            // If no message found, use default message based on HTTP method
            if (!message) {
              // Check if request body contains 'request_data' - indicates an update operation
              const isUpdateOperation = req.body && typeof req.body === 'object' && 'request_data' in req.body;
              
              // Check if it's a delete operation
              let isDeleteOperation = false;
              if (req.method === 'DELETE') {
                isDeleteOperation = true;
              } else if (req.body instanceof FormData) {
                // Check FormData for delete indicators
                isDeleteOperation = req.body.get('is_remove') === 'true' || 
                                   req.body.get('is_delete') === 'true' ||
                                   req.body.get('action') === 'delete';
              } else if (req.body && typeof req.body === 'object') {
                // Check JSON body for delete indicators
                isDeleteOperation = req.body.is_remove === true || 
                                   req.body.is_delete === true ||
                                   req.body.action === 'delete';
              }

              if (isDeleteOperation) {
                message = 'Deleted successfully';
              } else if (isUpdateOperation) {
                message = 'Updated successfully';
              } else {
                switch (req.method) {
                  case 'POST':
                    message = 'Created successfully';
                    break;
                  case 'PUT':
                  case 'PATCH':
                    message = 'Updated successfully';
                    break;
                  default:
                    message = 'Operation completed successfully';
                }
              }
            }

            // Safely handle message - convert to string if needed
            if (!message) {
              return;
            }

            const messageStr = typeof message === 'string' ? message.trim() : '';
            if (!messageStr) {
              return;
            }

            toasterService.showSuccess(messageStr);
          }
        }
      },

      error: (error) => {
        if (error instanceof HttpErrorResponse && shouldShowToast) {
          if (error.status === 401) {
            performLogout();
            return;
          }

          const errorMessages = extractErrorMessages(error);
          if (errorMessages.length > 0) {
            errorMessages.forEach((message: string) => {
              toasterService.showError(message);
            });
          } else {
            const defaultMessage = getDefaultErrorMessage(error);
            toasterService.showError(defaultMessage);
          }
        }
      }
    })
  );
};