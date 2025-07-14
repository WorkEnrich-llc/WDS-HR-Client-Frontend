import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BranchesService {

  private apiBaseUrl: string;
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // create a new branch
  createBranch(branchData: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/branches`;
    return this._HttpClient.post(url, branchData);
  }

  // get all branches with pagination and filters
  getAllBranches(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
      min_employees?: string;
      max_employees?: string;
      branch?: string;
      status?: string;
    }
  ): Observable<any> {
    const url = `${this.apiBaseUrl}od/branches`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);
    // console.log('Filters:', filters);
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.updated_from) params = params.set('updated_from', filters.updated_from);
      if (filters.updated_to) params = params.set('updated_to', filters.updated_to);
      if (filters.created_from) params = params.set('created_from', filters.created_from);
      if (filters.created_to) params = params.set('created_to', filters.created_to);
      if (filters.min_employees) params = params.set('min_employees', filters.min_employees);
      if (filters.max_employees) params = params.set('max_employees', filters.max_employees);
      if (filters.branch) params = params.set('branch', filters.branch);
      if (filters.status) params = params.set('status', filters.status);
    }

    return this._HttpClient.get(url, { params });
  }

  // show branch details
  showBranch(id: number): Observable<any> {
    const url = `${this.apiBaseUrl}od/branches/${id}`;
    return this._HttpClient.get(url);
  }
  
  // update branch status
  updateBranchStatus(id: number, status: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/branches/${id}/`;
    return this._HttpClient.patch(url, status);
  }

  // update branch
  updateBranch(branchData: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/branches`;
    return this._HttpClient.put(url, branchData);
  }

  
}
