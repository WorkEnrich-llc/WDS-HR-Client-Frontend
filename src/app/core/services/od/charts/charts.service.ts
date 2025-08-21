import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChartsService {
  private apiBaseUrl: string;
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  companyChart(): Observable<any> {
    const url = `${this.apiBaseUrl}od/organizational-chart/company-structure`;
    return this._HttpClient.get(url);
  }

  jobsChart(): Observable<any> {
    const url = `${this.apiBaseUrl}od/organizational-chart/job-titles-structure`;
    return this._HttpClient.get(url);
  }

}
