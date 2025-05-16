import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private apiBaseUrl: string;
  email: string = '';
  domain: string = '';
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

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


createAcount(FormData: any): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/register/create`;

      return this._HttpClient.post(url, FormData);
    } else {
      throw new Error('API URL not found');
    }
  }



}
