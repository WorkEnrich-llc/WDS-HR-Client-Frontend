import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeaveTypeService {

  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // create Leave Type
  createLeavetype(leaveTypeData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/leave-type`;
    return this._HttpClient.post(url, leaveTypeData);
  }

  // update Leave Type
  updateLeaveType(leaveTypeData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/leave-type`;
    return this._HttpClient.put(url, leaveTypeData);
  }

  // update Leave Type status
  updateLeaveStatus(id: number, status: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/leave-type/${id}/`;
    return this._HttpClient.patch(url, status);
  }

  // get all Leave Types with pagination and filters
 getAllLeavetypes(
  pageNumber: number,
  perPage: number,
  filters?: {
    search?: string;
    employment_type?: string;
    status?: string;   
  }
): Observable<any> {
  const url = `${this.apiBaseUrl}personnel/leave-type`;

  let params = new HttpParams()
    .set('page', pageNumber)
    .set('per_page', perPage);

  if (filters) {
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.employment_type) {
      params = params.set('employment_type', filters.employment_type);
    }
    if (filters.status) {  
      params = params.set('status', filters.status);
    }
  }

  return this._HttpClient.get(url, { params });
}


  // show Leave Type by ID
  showLeaveType(id: number): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/leave-type/${id}`;
    return this._HttpClient.get(url);
  }
}
