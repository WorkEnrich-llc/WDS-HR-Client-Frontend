import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthHelperService } from '../../authentication/auth-helper.service';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentsService {

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

  // create department
  createDepartment(departmentData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/departments`;
    return this._HttpClient.post(url, departmentData, { headers });
  }

  // update department
  updateDepartment(departmentData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/departments`;
    return this._HttpClient.put(url, departmentData, { headers });
  }

  // delete department
  // deleteDepartment(id: number): Observable<any> {
  //   const headers = this.getAuthHeaders(true);
  //   if (!headers) return throwError(() => new Error('Authentication failed'));

  //   const url = `${this.apiBaseUrl}od/departments/${id}/`;
  //   return this._HttpClient.delete(url, { headers });
  // }

  // update department status
  updateDeptStatus(id: number, status: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/departments/${id}/`;
    return this._HttpClient.patch(url, status, { headers });
  }

  // get all departments with pagination and filters
  getAllDepartment(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
      status?: string;
    }
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/departments`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.updated_from) params = params.set('updated_from', filters.updated_from);
      if (filters.updated_to) params = params.set('updated_to', filters.updated_to);
      if (filters.created_from) params = params.set('created_from', filters.created_from);
      if (filters.created_to) params = params.set('created_to', filters.created_to);
      if (filters.status) params = params.set('status', filters.status);
    }

    return this._HttpClient.get(url, { headers, params });
  }

  // show department by ID
  showDepartment(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/departments/${id}`;
    return this._HttpClient.get(url, { headers });
  }

  
}
