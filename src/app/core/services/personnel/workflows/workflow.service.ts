import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // create workflow
  createWorkFlow(workFlowData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/workflow`;
    return this._HttpClient.post(url, workFlowData);
  }

  // get all workflow with pagination and filters
  getAllWorkFlow(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      department?: string;
    }
  ): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/workflow`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.department) params = params.set('department', filters.department);
    }

    return this._HttpClient.get(url, { params });
  }

  // show workflow by ID
  showWorkflow(id: number): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/workflow/${id}`;
    return this._HttpClient.get(url);
  }

  // update workflow status
  updateWorkflowStatus(id: number, status: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/workflow/${id}/`;
    return this._HttpClient.patch(url, status);
  }

  // update workflow
  updateWorkflow(workflowData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/workflow`;
    return this._HttpClient.put(url, workflowData);
  }
}
