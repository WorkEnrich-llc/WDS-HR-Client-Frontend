import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthHelperService } from '../../authentication/auth-helper.service';
import { environment } from '../../../../../environments/environment';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkSchaualeService {

  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient, private authHelper: AuthHelperService) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // getAuthHeaders
  private getAuthHeaders(includeBearer: boolean = false): HttpHeaders | null {
    if (!this.authHelper.validateAuth()) {
      return null;
    }

    const token = this.authHelper.getToken()!;
    const sessionToken = this.authHelper.getSessionToken()!;
    const subdomain = this.authHelper.getSubdomain()!;

    let headers = new HttpHeaders()
      .set('Authorization', token)
      .set('SUBDOMAIN', subdomain)
      .set('SESSIONTOKEN', sessionToken);

    return headers;
  }

  // create work schadule
  createWorkScaduale(workSchaduleData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/work-schedule`;
    return this._HttpClient.post(url, workSchaduleData, { headers });
  }


  // get all work schedule with pagination and filters
  getAllWorkSchadule(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      department?: string;
      schedules_type?: string;
      work_schedule_type?: string;
    }
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/work-schedule`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.department) params = params.set('department', filters.department);
      if (filters.schedules_type) params = params.set('schedules_type', filters.schedules_type);
      if (filters.work_schedule_type) params = params.set('work_schedule_type', filters.work_schedule_type);
    }

    return this._HttpClient.get(url, { headers, params });
  }

  // show work schedule by ID
  showWorkSchedule(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/work-schedule/${id}`;
    return this._HttpClient.get(url, { headers });
  }

  // update work schedule status
  updateWorkStatus(id: number, status: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/work-schedule/${id}/`;
    return this._HttpClient.patch(url, status, { headers });
  }

  // update work schedule
  updateWorkSchedule(workScheduleData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/work-schedule`;
    return this._HttpClient.put(url, workScheduleData, { headers });
  }
}
