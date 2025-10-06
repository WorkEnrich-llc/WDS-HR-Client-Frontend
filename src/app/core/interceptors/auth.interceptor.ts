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

  // تخطي المصادقة لو المستخدم غير مسجل أو البيانات ناقصة
  if (!authHelper.validateAuth()) {
    return next(req);
  }

  const token = authHelper.getToken();
  const sessionToken = authHelper.getSessionToken();
  const subdomain = authHelper.getSubdomain();

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = token; 
  if (subdomain) headers['SUBDOMAIN'] = subdomain;
  if (sessionToken) headers['SESSIONTOKEN'] = sessionToken;

  const cloned = req.clone({ setHeaders: headers });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const deviceToken = localStorage.getItem('device_token');
        localStorage.clear();

        if (deviceToken) {
          localStorage.setItem('device_token', deviceToken);
        }

        cookieService.deleteAll('/', window.location.hostname);

        router.navigate(['/auth/login']);
      }

      return throwError(() => error);
    })
  );
};
