
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';
import { AttendanceLog, IAttendanceFilters } from 'app/core/models/attendance-log';

@Injectable({
  providedIn: 'root'
})
export class AttendanceLogService {

  http = inject(HttpClient);

  private apiBaseUrl: string;
  constructor() {
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

  // Cancel log by id for new endpoint
  cancelAttendanceLogById(id: string | number) {
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/canceled`;
    const formData = new FormData();
    formData.append('id', String(id));
    return this.http.put(url, formData);
  }

  exportAttendanceLog(params: IAttendanceFilters = {}): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/log`;
    return this.http.get(url, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  updateCheckIn(id: string | number, check_in: string) {
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/update-check-in`;
    const formData = new FormData();
    formData.append('id', String(id));
    formData.append('check_in', check_in);
    return this.http.put(url, formData);
  }

  updateCheckOut(id: string | number, check_out: string) {
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/update-check-out`;
    const formData = new FormData();
    formData.append('id', String(id));
    formData.append('check_out', check_out);
    return this.http.put(url, formData);
  }

  updateLog(id: string | number, check_in: string, check_out: string) {
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/update-check-in-and-out`;
    const formData = new FormData();
    formData.append('id', String(id));
    formData.append('check_in', check_in);
    formData.append('check_out', check_out);
    return this.http.put(url, formData);
  }

  toggleDeduction(id: string | number) {
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/deduction`;
    const formData = new FormData();
    formData.append('id', String(id));
    return this.http.put(url, formData);
  }
}
