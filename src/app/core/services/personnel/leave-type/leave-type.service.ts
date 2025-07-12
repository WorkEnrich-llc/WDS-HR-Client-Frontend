import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthHelperService } from '../../authentication/auth-helper.service';
import { environment } from '../../../../../../environment';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeaveTypeService {

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



  // create Leavetype
  createLeavetype(leaveTypeData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/leave-type`;
    return this._HttpClient.post(url, leaveTypeData, { headers });
  }


  // update department
  updateLeaveType(leaveTypeData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/leave-type`;
    return this._HttpClient.put(url, leaveTypeData, { headers });
  }


  // update leavetype status
  updateLeaveStatus(id: number, status: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/leave-type/${id}/`;
    return this._HttpClient.patch(url, status, { headers });
  }


  // get all leave types with pagination and filters
  getAllLeavetypes(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      employment_type?: string;
    }
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/leave-type`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.employment_type) params = params.set('employment_type', filters.employment_type);
    }

    return this._HttpClient.get(url, { headers, params });
  }



  // show Leave type by ID
  showLeaveType(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/leave-type/${id}`;
    return this._HttpClient.get(url, { headers });
  }
}
