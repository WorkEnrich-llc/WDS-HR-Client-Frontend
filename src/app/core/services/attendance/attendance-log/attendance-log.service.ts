import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.ts';
import { map, Observable } from 'rxjs';
import { AttendanceLog, IAttendanceFilters } from 'app/core/models/attendance-log';

@Injectable({
  providedIn: 'root'
})
export class AttendanceLogService {

  http = inject(HttpClient);

  private apiBaseUrl: string;
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  createAttendance(data: AttendanceLog): Observable<AttendanceLog> {
    const url = `${this.apiBaseUrl}personnel/attendance-create`;
    const formData = new FormData();
    formData.append('employee_id', data.employee_id?.toString() || '');
    formData.append('date', data.date);
    formData.append('start', data.start);
    formData.append('end', data.end);

    return this.http.post<AttendanceLog>(url, formData);
  }


  updateAttendance(data: AttendanceLog): Observable<AttendanceLog> {
    const url = `${this.apiBaseUrl}personnel/attendance-update`;
    const formData = new FormData();
    formData.append('record_id', data.id?.toString() || '');
    formData.append('employee_id', data.employee_id?.toString() || '');
    formData.append('date', data.date);
    formData.append('start', data.start);
    formData.append('end', data.end);

    return this.http.put<AttendanceLog>(url, formData);
  }


  getAttendanceLog(params: IAttendanceFilters = {}): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('page', String(params.page ?? 1));
    httpParams = httpParams.set('per_page', String(params.per_page ?? 10));
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/log`;
    return this.http.get<any>(url, { params: httpParams });
  }

  cancelAttendanceLog(data: { record_id: number; employee_id: number; date: string }) {
    const formData = new FormData();
    formData.append('record_id', String(data.record_id));
    formData.append('employee_id', String(data.employee_id));
    formData.append('date', data.date);

    return this.http.put(`${this.apiBaseUrl}personnel/attendance-inactive`, formData);
  }


}
