import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthHelperService } from '../../authentication/auth-helper.service';
import { environment } from '../../../../../environments/environment';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BranchesService {

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



  // create a new branch
  createBranch(branchData: any): Observable<any> {
    if (!this.authHelper.validateAuth()) {
      return throwError(() => new Error('Authentication failed'));
    }

    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/branches`;
    return this._HttpClient.post(url, branchData, { headers });
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
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/branches`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

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

    return this._HttpClient.get(url, { headers, params });
  }

  // show branch details
  showBranch(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/branches/${id}`;
    return this._HttpClient.get(url, { headers });
  }
  
  // update branch status
  updateBranchStatus(id: number, status: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/branches/${id}/`;
    return this._HttpClient.patch(url, status, { headers });
  }

  // update branch
  updateBranch(branchData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/branches`;
    return this._HttpClient.put(url, branchData, { headers });
  }

  
}
