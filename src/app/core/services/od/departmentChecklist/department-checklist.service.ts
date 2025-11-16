import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DepartmentChecklistService {

  private apiBaseUrl: string;
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // get departmetCheck data
  getDepartmetChecks(page: number = 1, perPage: number = 1000): Observable<any> {
    const url = `${this.apiBaseUrl}od/departments/checklist`;

    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this._HttpClient.get(url, { params });
  }

  // create and update department check
  createDeptCheck(deptChecksData: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/departments/checklist`;
    return this._HttpClient.put(url, deptChecksData);
  }

}
