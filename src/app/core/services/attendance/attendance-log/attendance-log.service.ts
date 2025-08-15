import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttendanceLogService {

  private apiBaseUrl: string;
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // get Attendance Log
  getAttendanceLog(
    pageNumber: number,
    perPage: number,
    date: string,
    filters?: {
      employee?: string;
    }
  ): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/attendance-log`;

    let params = new HttpParams()
      .set('page', pageNumber.toString())
      .set('per_page', perPage.toString())
      .set('date', date);

    if (filters?.employee) {
      params = params.set('employee', filters.employee);
    }

    return this._HttpClient.get(url, { params });
  }



}
