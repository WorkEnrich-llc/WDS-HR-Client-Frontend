import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkSchaualeService {

  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // create work schedule
  createWorkScaduale(workSchaduleData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/work-schedule`;
    return this._HttpClient.post(url, workSchaduleData);
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
      status?: boolean;
    }
  ): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/work-schedule`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.department) params = params.set('department', filters.department);
      if (filters.schedules_type) params = params.set('schedules_type', filters.schedules_type);
      if (filters.work_schedule_type) params = params.set('work_schedule_type', filters.work_schedule_type);
      if (filters.status) params = params.set('status', filters.status);
    }

    return this._HttpClient.get(url, { params });
  }

  // show work schedule by ID
  showWorkSchedule(id: number): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/work-schedule/${id}`;
    return this._HttpClient.get(url);
  }

  // get work schedule by id
  getWorkScheduleById(id: number): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/work-schedule/${id}`;
    return this._HttpClient.get(url);
  }

  // update work schedule status
  updateWorkStatus(id: number, status: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/work-schedule/${id}/`;
    return this._HttpClient.patch(url, status);
  }

  // update work schedule
  updateWorkSchedule(workScheduleData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/work-schedule`;
    return this._HttpClient.put(url, workScheduleData);
  }
}
