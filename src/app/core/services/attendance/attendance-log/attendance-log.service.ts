
import { HttpClient, HttpParams, HttpResponse, HttpHeaders } from '@angular/common/http';
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
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/create`;
    const payload = {
      request_data: {
        employee_id: Number(data.employee_id),
        date: data.date,
        start: data.start,
        end: data.end
      }
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AttendanceLog>(url, payload, { headers });
  }


  updateAttendance(data: AttendanceLog): Observable<AttendanceLog> {
    const url = `${this.apiBaseUrl}personnel/attendance-update`;
    const payload = {
      request_data: {
        id: Number(data.id),
        employee_id: Number(data.employee_id),
        date: data.date,
        start: data.start,
        end: data.end
      }
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AttendanceLog>(url, payload, { headers });
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
    const payload = {
      request_data: {
        id: Number(id)
      }
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, payload, { headers });
  }

  exportAttendanceLog(params: IAttendanceFilters = {}): Observable<HttpResponse<Blob>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/log`;
    return this.http.get(url, {
      params: httpParams,
      responseType: 'blob',
      observe: 'response'
    });
  }

  updateCheckIn(id: string | number, check_in: string) {
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/update-check-in`;
    const payload = {
      request_data: {
        id: Number(id),
        check_in: check_in
      }
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, payload, { headers });
  }

  updateCheckOut(id: string | number, check_out: string) {
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/update-check-out`;
    const payload = {
      request_data: {
        id: Number(id),
        check_out: check_out
      }
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, payload, { headers });
  }

  updateLog(id: string | number, check_in: string, check_out: string) {
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/update-check-in-and-out`;
    const payload = {
      request_data: {
        id: Number(id),
        check_in: check_in,
        check_out: check_out
      }
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, payload, { headers });
  }

  toggleDeduction(id: string | number) {
    const url = `${this.apiBaseUrl}personnel/1_0_2/attendance/control/deduction`;
    const payload = {
      request_data: {
        id: Number(id)
      }
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, payload, { headers });
  }
}
