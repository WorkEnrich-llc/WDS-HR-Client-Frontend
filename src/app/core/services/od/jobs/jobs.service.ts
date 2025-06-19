import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthHelperService } from '../../authentication/auth-helper.service';
import { environment } from '../../../../../environments/environment';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobsService {

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
      department?: string;
      section?: string;
      status?: string;
      request_in?: string;
    }
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

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
      if (filters.department) params = params.set('department', filters.department);
      if (filters.section) params = params.set('section', filters.section);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.request_in) params = params.set('request_in', filters.request_in);
    }

    return this._HttpClient.get(url, { headers, params });
  }

  // create job title
  createJobTitle(jobTilteData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}od/job-titles`;
    return this._HttpClient.post(url, jobTilteData, { headers });
  }
   

}
