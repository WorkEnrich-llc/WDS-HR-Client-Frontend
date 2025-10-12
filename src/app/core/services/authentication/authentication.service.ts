import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthHelperService } from './auth-helper.service';
import { environment } from './../../../../environments/environment';

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

  // device register
  deviceRegister(FormData: any): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/device-register`;

      const headers = new HttpHeaders({
        'ver': this.version,
        'plat': this.platform
      });

      return this._HttpClient.post(url, FormData, { headers });
    } else {
      throw new Error('API URL not found');
    }
  }

  // register user
  createAcount(FormData: any): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/register/create`;

      const headers = new HttpHeaders({
        'ver': this.version,
        'plat': this.platform
      });

      return this._HttpClient.post(url, FormData, { headers });
    } else {
      throw new Error('API URL not found');
    }
  }

  // login
  login(FormData: any): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/login`;

      const headers = new HttpHeaders({
        'ver': this.version,
        'plat': this.platform
      });

      return this._HttpClient.post(url, FormData, { headers });
    } else {
      throw new Error('API URL not found');
    }
  }

  getJobTitles(): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/job-titles`;
    return this._HttpClient.get(url);
  }

  checkEmail(email: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/check-email`;
    const body = new HttpParams().set('email', email);
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return this._HttpClient.put(url, body, { headers });
  }

  checkDomain(domain: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/check-domain`;
    const params = new HttpParams().set('company_domain', domain);
    return this._HttpClient.get(url, { params });
  }

  sendCode(email: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/register/send-code`;
    const body = new HttpParams().set('email', email);
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return this._HttpClient.put(url, body, { headers });
  }

  forgetPassSendCode(email: string): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/forgot-password/send-code`;
    const body = new HttpParams().set('username', email);
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return this._HttpClient.post(url, body, { headers });
  }

  forgetCheckCode(formData: FormData): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/forgot-password/check-code`;
    return this._HttpClient.put(url, formData);
  }

  newPassword(FormData: any): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/forgot-password/new-password`;
    return this._HttpClient.post(url, FormData);
  }

  logout(): Observable<any> {
    const token = this.authHelper.getToken()!;
    const sessionToken = this.authHelper.getSessionToken()!;

    const url = `${this.apiBaseUrl}main/authentication/logout`;
    const headers = new HttpHeaders({
      'Authorization': token,
      'SESSIONTOKEN': sessionToken
    });

    return this._HttpClient.put(url, {}, { headers });
  }
}
