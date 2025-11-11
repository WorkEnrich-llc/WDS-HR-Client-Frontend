import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.ts';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobsService {

  private apiBaseUrl: string;
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }



  // get all job titles
  getAllJobTitles(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
      management_level?: string;
      branch_id?: string;
      department?: string;
      section?: string;
      status?: string;
      request_in?: string;
      request_in_create?: string;
    }
  ): Observable<any> {
    const url = `${this.apiBaseUrl}od/job-titles`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.updated_from) params = params.set('updated_from', filters.updated_from);
      if (filters.updated_to) params = params.set('updated_to', filters.updated_to);
      if (filters.created_from) params = params.set('created_from', filters.created_from);
      if (filters.created_to) params = params.set('created_to', filters.created_to);
      if (filters.management_level) params = params.set('management_level', filters.management_level);
      if (filters.branch_id) params = params.set('branch_id', filters.branch_id);
      if (filters.department) params = params.set('department', filters.department);
      if (filters.section) params = params.set('section', filters.section);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.request_in) params = params.set('request_in', filters.request_in);
      if (filters.request_in_create) params = params.set('request_in_create', filters.request_in_create);
    }

    return this._HttpClient.get(url, { params });
  }

  // create job title
  createJobTitle(jobTilteData: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/job-titles`;
    return this._HttpClient.post(url, jobTilteData);
  }

  // view job title
  showJobTitle(id: number): Observable<any> {
    const url = `${this.apiBaseUrl}od/job-titles/${id}`;
    return this._HttpClient.get(url);
  }

  // update job title status
  updateJobStatus(id: number, status: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/job-titles/${id}/`;
    return this._HttpClient.patch(url, status);
  }

  // update job title
  updateJobTitle(jobTitleData: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/job-titles`;
    return this._HttpClient.put(url, jobTitleData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  // get job titles by department id
  getJobTitlesByDepartment(departmentId: number): Observable<any> {
    const url = `${this.apiBaseUrl}od/job-titles/${departmentId}`;
    return this._HttpClient.get(url);
  }

}
