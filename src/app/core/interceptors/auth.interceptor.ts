import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthHelperService } from '../services/authentication/auth-helper.service';
import { AuthenticationService } from './../services/authentication/authentication.service';
import { ToastrService } from 'ngx-toastr';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authHelper = inject(AuthHelperService);
  const authService = inject(AuthenticationService);
  const router = inject(Router);
  const cookieService = inject(CookieService);
  const toastr = inject(ToastrService);

  const version = '1.0.1';
  const platform = 'DASHBOARD';

  if (
    req.url.includes('assets') ||
    req.url.endsWith('login') ||
    req.url.endsWith('register') ||
    req.url.includes('manifest.json')
  ) {
    return next(req);
  }

  if (!authHelper.validateAuth()) {
    const clonedNoAuth = req.clone({
      setHeaders: { ver: version, plat: platform }
    });
    return next(clonedNoAuth);
  }

  const token = authHelper.getToken();
  const sessionToken = authHelper.getSessionToken();
  const subdomain = authHelper.getSubdomain();

  const headers: Record<string, string> = {
    ver: version,
    plat: platform
  };

  if (token) headers['Authorization'] = token;
  if (subdomain) headers['SUBDOMAIN'] = subdomain;
  if (sessionToken) headers['SESSIONTOKEN'] = sessionToken;

  const cloned = req.clone({ setHeaders: headers });

  const performLogout = () => {
    const deviceToken = localStorage.getItem('device_token');

    authService.logout().subscribe({
      next: () => {
        cleanupAndRedirect(deviceToken);
      },
      error: (err) => {
        console.error('Logout error:', err);
        cleanupAndRedirect(deviceToken);
      }
    });
  };

  const cleanupAndRedirect = (deviceToken: string | null) => {
    localStorage.clear();
    if (deviceToken) {
      localStorage.setItem('device_token', deviceToken);
    }

    cookieService.deleteAll('/', window.location.hostname);
    router.navigate(['/auth/login']);
  };

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (!req.url.includes('logout')) {
          performLogout();
        }
      } else if (error.status === 406) {
        toastr.error('Version 1.0.1 is available but does not support this platform.');
      } else if (error.status === 410) {
        toastr.warning('Please update to a newer release.');
        localStorage.clear();
        sessionStorage.clear();
        cookieService.deleteAll('/', window.location.hostname);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (error.status === 425) {
        toastr.info('Coming soon — this feature is not yet available.');
      }

      return throwError(() => error);
    })
  );
};
