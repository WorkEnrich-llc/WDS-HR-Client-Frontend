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
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthHelperService } from '../services/authentication/auth-helper.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authHelper = inject(AuthHelperService);
  const router = inject(Router);
  const cookieService = inject(CookieService);

  // Skip authentication for public endpoints or if auth is not available
  if (!authHelper.validateAuth()) {
    return next(req);
  }

  const token = authHelper.getToken()!;
  const sessionToken = authHelper.getSessionToken()!;
  const subdomain = authHelper.getSubdomain()!;

  // Clone the request and add authentication headers
  const cloned = req.clone({
    setHeaders: {
      Authorization: token,
      SUBDOMAIN: subdomain,
      SESSIONTOKEN: sessionToken
    }
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        // Clear stored authentication data (same as logout functionality)
        const deviceToken = localStorage.getItem('device_token');
        localStorage.clear();
        
        // Preserve device token after clearing localStorage
        if (deviceToken) {
          localStorage.setItem('device_token', deviceToken);
        }
        
        // Clear all cookies
        cookieService.deleteAll('/', window.location.hostname);
        
        // Redirect to login page
        router.navigate(['/auth/login']);
      }
      
      // Re-throw the error so other interceptors and components can handle it
      return throwError(() => error);
    })
  );
};
