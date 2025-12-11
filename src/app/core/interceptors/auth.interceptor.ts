import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpContextToken
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthHelperService } from '../services/authentication/auth-helper.service';
import { AuthenticationService } from './../services/authentication/authentication.service';
import { ToastrService } from 'ngx-toastr';

// HttpContextToken to indicate that credentials should be sent
export const WITH_CREDENTIALS = new HttpContextToken<boolean>(() => true);

// Flag to prevent infinite logout loops
let isLoggingOut = false;

/**
 * Centralized HTTP Interceptor that handles:
 * 1. All authentication headers (Authorization, SESSIONTOKEN, SUBDOMAIN)
 * 2. Version and platform headers (ver, plat)
 * 3. Special logic for subscription-status requests
 * 4. Error handling (401, 406, 410, 425)
 * 5. Automatic logout on 401 errors
 * 
 * Note: withCredentials must be set in HTTP options when making requests,
 * not in headers. Services should include { withCredentials: true } in their HTTP options.
 */
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

  // Skip interceptor for static assets and auth endpoints
  if (
    req.url.includes('assets') ||
    req.url.endsWith('login') ||
    req.url.endsWith('register') ||
    req.url.includes('manifest.json')
  ) {
    // Still add withCredentials context for these requests
    const clonedWithCredentials = req.clone({
      context: req.context.set(WITH_CREDENTIALS, true)
    });
    return next(clonedWithCredentials);
  }

  // Build headers object with version and platform
  const headers: Record<string, string> = {
    ver: version,
    plat: platform
  };

  // Get auth tokens and subdomain
  const token = authHelper.getToken();
  const sessionToken = authHelper.getSessionToken();
  const subdomain = authHelper.getSubdomain();

  // Check if this is a subscription-status request (special handling)
  const isSubscriptionStatusRequest = req.url.includes('subscription-status');

  // Add Authorization header (with special logic for subscription-status)
  if (token) {
    // For subscription-status: don't send Authorization if token is "true" or "false"
    if (isSubscriptionStatusRequest && (token === 'true' || token === 'false')) {
      // Skip adding Authorization header
    } else {
      headers['Authorization'] = token;
    }
  }

  // Add SUBDOMAIN header (with special logic for subscription-status)
  if (subdomain) {
    // For subscription-status: don't send SUBDOMAIN if authorization is "true"
    if (isSubscriptionStatusRequest && token === 'true') {
      // Skip adding SUBDOMAIN header
    } else {
      headers['SUBDOMAIN'] = subdomain;
    }
  }

  // Add SESSIONTOKEN header (with special logic for subscription-status)
  if (sessionToken) {
    // For subscription-status: don't send SESSIONTOKEN if it's "true" or "false"
    if (isSubscriptionStatusRequest && (sessionToken === 'true' || sessionToken === 'false')) {
      // Skip adding SESSIONTOKEN header
    } else {
      headers['SESSIONTOKEN'] = sessionToken;
    }
  }

  // Clone request with headers and withCredentials context
  // The WITH_CREDENTIALS context token indicates that cookies should be sent
  const cloned = req.clone({
    setHeaders: headers,
    context: req.context.set(WITH_CREDENTIALS, true)
  });

  const performLogout = () => {
    // Prevent infinite loop if already logging out
    if (isLoggingOut) {
      return;
    }

    isLoggingOut = true;
    const deviceTokenRaw = localStorage.getItem('device_token');
    // Handle both boolean and string types (localStorage returns string, but handle edge cases)
    let deviceToken: string | null = null;
    if (deviceTokenRaw !== null && deviceTokenRaw !== undefined) {
      deviceToken = deviceTokenRaw;
    }

    authService.logout().subscribe({
      next: () => {
        cleanupAndRedirect(deviceToken);
        isLoggingOut = false;
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Even if logout fails (e.g., 401), still cleanup and redirect
        cleanupAndRedirect(deviceToken);
        isLoggingOut = false;
      }
    });
  };

  const cleanupAndRedirect = (deviceToken: string | null) => {
    localStorage.clear();
    sessionStorage.clear();

    if (deviceToken !== null && deviceToken !== undefined) {
      // Ensure we save it as a string (handles both boolean and string types)
      const tokenToSave = typeof deviceToken === 'boolean'
        ? String(deviceToken)
        : deviceToken;
      localStorage.setItem('device_token', tokenToSave);
    }

    cookieService.deleteAll('/', window.location.hostname);
    router.navigate(['/auth/login']);
  };

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      const hasAuthData =
        (token && token.length > 0) ||
        (sessionToken && sessionToken.length > 0) ||
        (subdomain && subdomain.length > 0);

      const onlyDeviceTokenExists =
        Object.keys(localStorage).length === 1 &&
        localStorage.getItem('device_token') !== null;

      switch (error.status) {
        case 401:
          if (!hasAuthData || onlyDeviceTokenExists) {
            console.warn('401 received but user is not logged in → skipping logout');
            break;
          }

          // If this is a logout request that returned 401, just cleanup without calling logout again
          if (req.url.includes('logout')) {
            const deviceTokenRaw = localStorage.getItem('device_token');
            let deviceToken: string | null = null;
            if (deviceTokenRaw !== null && deviceTokenRaw !== undefined) {
              deviceToken = deviceTokenRaw;
            }
            cleanupAndRedirect(deviceToken);
            break;
          }

          // Prevent infinite loop - don't call performLogout if already logging out
          if (!isLoggingOut) {
            performLogout();
          }
          break;

        case 406:
          toastr.error('Version 1.0.1 is available but does not support this platform.');
          break;

        case 410:
          toastr.warning('Please update to a newer release.');
          localStorage.clear();
          sessionStorage.clear();
          cookieService.deleteAll('/', window.location.hostname);
          setTimeout(() => window.location.reload(), 2000);
          break;

        case 425:
          toastr.info('Coming soon — this feature is not yet available.');
          break;

        default:
          console.error('Unhandled HTTP error:', error);
          break;
      }

      return throwError(() => error);
    })
  );

};
