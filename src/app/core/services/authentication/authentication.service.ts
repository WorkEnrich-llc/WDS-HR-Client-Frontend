import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  getJobTitles(): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/register/job-titles`;

      return this._HttpClient.get(url);
    } else {
      throw new Error('API URL not found');
    }
  }




}
