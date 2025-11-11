import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AttendanceRulesResponse } from '../models/attendance-rules.interface';

@Injectable({
  providedIn: 'root'
})
export class AttendanceRulesService {
  private apiBaseUrl: string;

  constructor(
    private http: HttpClient
  ) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // Get attendance rules data
  getAttendanceRules(): Observable<AttendanceRulesResponse> {
    const url = `${this.apiBaseUrl}personnel/attendance-rules`;
    return this.http.get<AttendanceRulesResponse>(url);
  }

  // Update attendance rules
  updateAttendanceRules(requestData: any): Observable<AttendanceRulesResponse> {
    const url = `${this.apiBaseUrl}personnel/attendance-rules`;
    return this.http.put<AttendanceRulesResponse>(url, requestData);
  }
}
