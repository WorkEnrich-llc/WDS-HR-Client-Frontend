import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentsService {

  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // create department
  createDepartment(departmentData: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/departments`;
    return this._HttpClient.post(url, departmentData);
  }

  // update department
  updateDepartment(departmentData: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/departments`;
    return this._HttpClient.put(url, departmentData);
  }

  // update department status
  updateDeptStatus(id: number, status: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/departments/${id}/`;
    return this._HttpClient.patch(url, status);
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
      branch_id?: number;
    }
  ): Observable<any> {
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
      if (filters.branch_id != null) params = params.set('branch_id', filters.branch_id.toString());
    }

    return this._HttpClient.get(url, { params });
  }

  // show department by ID
  showDepartment(id: number): Observable<any> {
    const url = `${this.apiBaseUrl}od/departments/${id}`;
    return this._HttpClient.get(url);
  }
}
