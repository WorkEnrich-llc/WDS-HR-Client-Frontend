import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { map, Observable } from 'rxjs';
import { AttendanceLog } from 'app/core/models/attendance-log';

@Injectable({
  providedIn: 'root'
})
export class AttendanceLogService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}personnel/attendance`;

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

  // getAttendanceById(id: number): Observable<AttendanceLog> {
  //   return this.http.get<any>(`${this.url}/${id}`).pipe(
  //     map(res => {
  //       return {
  //         employee_id: res.emp_id,
  //         date: res.date,
  //         start: res.working_details?.actual_check_in,
  //         end: res.working_details?.actual_check_out,
  //         id: res.working_details?.record_id
  //       } as AttendanceLog;
  //     })
  //   );
  // }

}
