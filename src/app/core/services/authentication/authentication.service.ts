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

  private buildHeaders(isLogout: boolean = false, includeAuth: boolean = false): HttpHeaders {
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

    return headers;
  }

  // device register
  deviceRegister(formData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/1_0_2/authentication/device-register`;
    return this._HttpClient.post(url, formData, { headers: this.buildHeaders() });
  }

  // register user
  createAcount(formData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/1_0_2/authentication/register/create`;
    return this._HttpClient.post(url, formData, { headers: this.buildHeaders() });
  }

  // login
  login(formData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/1_0_2/authentication/login`;
    return this._HttpClient.post(url, formData, { headers: this.buildHeaders() });
  }

  getJobTitles(): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/job-titles`;
    return this._HttpClient.get(url, { headers: this.buildHeaders() });
  }

  checkEmail(email: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/check-email`;
    const body = new HttpParams().set('email', email);
    const headers = this.buildHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
    return this._HttpClient.put(url, body, { headers });
  }

  checkDomain(domain: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/check-domain`;
    const params = new HttpParams().set('company_domain', domain);
    return this._HttpClient.get(url, { params, headers: this.buildHeaders() });
  }

  sendCode(email: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/send-code`;
    const body = new HttpParams().set('email', email);
    const headers = this.buildHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
    return this._HttpClient.put(url, body, { headers });
  }

  forgetPassSendCode(email: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/forgot-password/send-code`;
    const body = new HttpParams().set('username', email);
    const headers = this.buildHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
    return this._HttpClient.post(url, body, { headers });
  }

  forgetCheckCode(formData: FormData): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/forgot-password/check-code`;
    return this._HttpClient.put(url, formData, { headers: this.buildHeaders() });
  }

  newPassword(formData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/forgot-password/new-password`;
    return this._HttpClient.post(url, formData, { headers: this.buildHeaders() });
  }

  // logout
  logout(): Observable<any> {
    const url = `${this.apiBaseUrl}main/1_0_2/authentication/logout`;
    const headers = this.buildHeaders(true, true);
    return this._HttpClient.put(url, {}, { headers });
  }
}
