import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthHelperService } from './auth-helper.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private apiBaseUrl: string;
  private readonly version = '1.0.1';
  private readonly platform = 'WEBSITE';

  constructor(private _HttpClient: HttpClient, private authHelper: AuthHelperService) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private buildHeaders(isLogout: boolean = false, includeAuth: boolean = false, includeCsrf: boolean = false): HttpHeaders {
    const plat = isLogout ? 'DASHBOARD' : this.platform;
    let headers = new HttpHeaders({
      'ver': this.version,
      'plat': plat
    });

    if (includeAuth) {
      const token = this.authHelper.getToken();
      const sessionToken = this.authHelper.getSessionToken();
      if (token) headers = headers.set('Authorization', token);
      if (sessionToken) headers = headers.set('SESSIONTOKEN', sessionToken);
    }

    if (includeCsrf) {
      const csrfToken = this.getCookie('csrftoken');
      if (csrfToken) {
        headers = headers.set('X-CSRFToken', csrfToken);
      }
    }

    return headers;
  }

  private buildHttpOptions(headers?: HttpHeaders, params?: HttpParams): any {
    return {
      headers: headers || this.buildHeaders(),
      withCredentials: true, // Enable cookies for cross-origin requests
      ...(params && { params })
    };
  }

  // device register
  deviceRegister(formData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/1_0_2/authentication/device-register`;
    return this._HttpClient.post(url, formData, this.buildHttpOptions(this.buildHeaders(false, false, true)));
  }

  // register user
  createAcount(formData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/1_0_2/authentication/register/create`;
    return this._HttpClient.post(url, formData, this.buildHttpOptions(this.buildHeaders(false, false, true)));
  }

  // login
  login(formData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/1_0_2/authentication/login`;
    return this._HttpClient.post(url, formData, this.buildHttpOptions(this.buildHeaders(false, false, true)));
  }

  getJobTitles(): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/job-titles`;
    return this._HttpClient.get(url, this.buildHttpOptions(this.buildHeaders()));
  }

  checkEmail(email: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/check-email`;
    const body = new HttpParams().set('email', email);
    const headers = this.buildHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
    return this._HttpClient.put(url, body, this.buildHttpOptions(headers));
  }

  checkDomain(domain: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/check-domain`;
    const params = new HttpParams().set('company_domain', domain);
    return this._HttpClient.get(url, this.buildHttpOptions(this.buildHeaders(), params));
  }

  sendCode(email: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/send-code`;
    const body = new HttpParams().set('email', email);
    const headers = this.buildHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
    return this._HttpClient.put(url, body, this.buildHttpOptions(headers));
  }

  forgetPassSendCode(email: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/forgot-password/send-code`;
    const body = new HttpParams().set('username', email);
    const headers = this.buildHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
    return this._HttpClient.post(url, body, this.buildHttpOptions(headers));
  }

  forgetCheckCode(formData: FormData): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/forgot-password/check-code`;
    return this._HttpClient.put(url, formData, this.buildHttpOptions(this.buildHeaders()));
  }

  newPassword(formData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/forgot-password/new-password`;
    return this._HttpClient.post(url, formData, this.buildHttpOptions(this.buildHeaders()));
  }

  // session login
  sessionLogin(requestData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/1_0_2/authentication/S-L`;
    const headers = this.buildHeaders(false, false, true);
    return this._HttpClient.post(url, requestData, this.buildHttpOptions(headers));
  }

  // logout
  logout(): Observable<any> {
    const url = `${this.apiBaseUrl}main/1_0_2/authentication/logout`;
    const headers = this.buildHeaders(true, true, true);
    return this._HttpClient.put(url, {}, this.buildHttpOptions(headers));
  }
}
