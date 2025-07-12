import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthHelperService } from '../../authentication/auth-helper.service';
import { environment } from '../../../../../../environment';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

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

  // create workflow
  createWorkFlow(WorkFlowData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/workflow`;
    return this._HttpClient.post(url, WorkFlowData, { headers });
  }


  // get all workflow with pagination and filters
  getAllWorkFlow(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      employment_type?: string;
    }
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/workflow`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.employment_type) params = params.set('employment_type', filters.employment_type);
    }

    return this._HttpClient.get(url, { headers, params });
  }


  // show workflow by ID
  showWorkflow(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/workflow/${id}`;
    return this._HttpClient.get(url, { headers });
  }

  // update workflow status
  updateWorkflowStatus(id: number, status: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/workflow/${id}/`;
    return this._HttpClient.patch(url, status, { headers });
  }

  // update workflow
  updateWorkflow(workflowData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/workflow`;
    return this._HttpClient.put(url, workflowData, { headers });
  }


  
}
