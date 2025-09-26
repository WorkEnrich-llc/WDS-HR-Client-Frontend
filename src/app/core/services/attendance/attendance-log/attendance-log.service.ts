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
  // /personnel/attendance - create

  private apiBaseUrl: string;
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  createAttendance(formData: FormData): Observable<AttendanceLog> {
    const url = `${this.apiBaseUrl}personnel/attendance-create`;
    return this.http.post<AttendanceLog>(url, formData);
  }


  // createAttendance(data: AttendanceLog): Observable<AttendanceLog> {
  //   const url = `${this.apiBaseUrl}personnel/attendance-create`;
  //   const formData = new FormData();
  //   formData.append('employee_id', data.employee_id?.toString() || '');
  //   formData.append('date', data.date);
  //   formData.append('start', data.start);
  //   formData.append('end', data.end);

  //   return this.http.post<AttendanceLog>(url, formData);
  // }

  updateAttendance(id: number, formData: FormData): Observable<AttendanceLog> {
    const url = `${this.apiBaseUrl}personnel/attendance/${id}`;
    return this.http.put<AttendanceLog>(url, formData);
  }

  // updateAttendance(id: number, data: AttendanceLog): Observable<AttendanceLog> {
  //   const url = `${this.apiBaseUrl}personnel/attendance/${id}`;
  //   const formData = {
  //     employee_id: data.employee_id,
  //     date: data.date,
  //     start: data.start,
  //     end: data.end
  //   };
  //   return this.http.put<AttendanceLog>(url, formData);
  // }

  getAttendanceById(id: number): Observable<AttendanceLog> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(
      map(res => {
        return {
          employee_id: res.emp_id,
          date: res.date,
          start: res.working_details?.actual_check_in,
          end: res.working_details?.actual_check_out,
          id: res.working_details?.record_id
        } as AttendanceLog;
      })
    );
  }

  // getAttendanceById(id: number): Observable<AttendanceLog> {
  //   return this.http.get<AttendanceLog>(`${this.url}/${id}`);
  // }

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
