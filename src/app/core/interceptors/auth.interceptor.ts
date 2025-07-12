import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthHelperService } from '../services/authentication/auth-helper.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authHelper = inject(AuthHelperService);

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

  return next(cloned);
};
