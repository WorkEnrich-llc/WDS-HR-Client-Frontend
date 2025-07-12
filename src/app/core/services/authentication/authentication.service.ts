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
  email: string = '';
  domain: string = '';
  constructor(private _HttpClient: HttpClient, private authHelper: AuthHelperService) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // device register
  deviceRegister(FormData: any): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/device-register`;

      return this._HttpClient.post(url, FormData);
    } else {
      throw new Error('API URL not found');
    }
  }




  // =========================================
  // get job titles
  getJobTitles(): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/register/job-titles`;

      return this._HttpClient.get(url);
    } else {
      throw new Error('API URL not found');
    }
  }

  // check email avilable
  checkEmail(email: string): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/register/check-email`;

      const body = new HttpParams().set('email', email);
      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      return this._HttpClient.put(url, body, { headers });
    } else {
      throw new Error('API URL not found');
    }
  }

  // ceck domain available
  checkDomain(domain: string): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/register/check-domain`;

      const params = new HttpParams().set('company_domain', domain);

      return this._HttpClient.get(url, { params });
    } else {
      throw new Error('API URL not found');
    }
  }

  // otp to mail

  sendCode(email: string): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/register/send-code`;

      const body = new HttpParams().set('email', email);
      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      return this._HttpClient.put(url, body, { headers });
    } else {
      throw new Error('API URL not found');
    }
  }

  // register user
  createAcount(FormData: any): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/register/create`;

      return this._HttpClient.post(url, FormData);
    } else {
      throw new Error('API URL not found');
    }
  }




  // login
  login(FormData: any): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/login`;

      return this._HttpClient.post(url, FormData);
    } else {
      throw new Error('API URL not found');
    }
  }


  // forgot password
  forgetPassSendCode(email: string): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/forgot-password/send-code`;

      const body = new HttpParams().set('username', email);
      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      return this._HttpClient.post(url, body, { headers });
    } else {
      throw new Error('API URL not found');
    }
  }

  // forget password check code
  forgetCheckCode(formData: FormData): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/forgot-password/check-code`;
      return this._HttpClient.put(url, formData);
    } else {
      throw new Error('API URL not found');
    }
  }


  // new password
  newPassword(FormData: any): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/forgot-password/new-password`;

      return this._HttpClient.post(url, FormData);
    } else {
      throw new Error('API URL not found');
    }
  }


  // logout
  logout(): Observable<any> {
    const token = this.authHelper.getToken()!;
    const sessionToken = this.authHelper.getSessionToken()!;

    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/logout`;

      const headers = new HttpHeaders({
        'Authorization': token,
        'SESSIONTOKEN': sessionToken
      });

      return this._HttpClient.put(url, {}, { headers });
    } else {
      throw new Error('API URL not found');
    }
  }

}
