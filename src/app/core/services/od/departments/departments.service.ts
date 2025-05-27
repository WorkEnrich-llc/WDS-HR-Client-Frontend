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

  // create a new department
  createDepartment(departmentData: any): Observable<any> {
    if (!this.authHelper.validateAuth()) {
      return throwError(() => new Error('Authentication failed'));
    }

    const token = this.authHelper.getToken()!;
    const subdomain = this.authHelper.getSubdomain()!;
    const url = `${this.apiBaseUrl}od/departments`;
    const headers = new HttpHeaders().set('Authorization', token).set('SUBDOMAIN', subdomain);
    return this._HttpClient.post(url, departmentData, { headers });
  }

  // update an existing department
  updateDepartment(departmentData: any): Observable<any> {
    if (!this.authHelper.validateAuth()) {
      return throwError(() => new Error('Authentication failed'));
    }

    const token = this.authHelper.getToken()!;
    const subdomain = this.authHelper.getSubdomain()!;
    const url = `${this.apiBaseUrl}od/departments`;
    const headers = new HttpHeaders().set('Authorization', token).set('SUBDOMAIN', subdomain);

    return this._HttpClient.put(url, departmentData, { headers });
  }


  // delete a department
  deleteDepartment(id: number): Observable<any> {
    if (!this.authHelper.validateAuth()) {
      return throwError(() => new Error('Authentication failed'));
    }

    const token = this.authHelper.getToken()!;
    const subdomain = this.authHelper.getSubdomain()!;
    const url = `${subdomain}/od/departments/${id}/`;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('SUBDOMAIN', subdomain);

    return this._HttpClient.delete(url, { headers });
  }


  // update department status
  updateDeptStatus(id: number, status: any): Observable<any> {
    if (!this.authHelper.validateAuth()) {
      return throwError(() => new Error('Authentication failed'));
    }

    const token = this.authHelper.getToken()!;
    const subdomain = this.authHelper.getSubdomain()!;
    const url = `${this.apiBaseUrl}od/departments/${id}/`;

   const headers = new HttpHeaders()
      .set('Authorization', token)
      .set('SUBDOMAIN', subdomain);

    return this._HttpClient.patch(url, status, { headers });
  }


  // get all departments
 getAllDepartment(pageNumber: number, perPage: number): Observable<any> {
  if (!this.authHelper.validateAuth()) {
    return throwError(() => new Error('Authentication failed'));
  }

  const token = this.authHelper.getToken()!;
  const subdomain = this.authHelper.getSubdomain()!;
  const url = `${this.apiBaseUrl}od/departments`;

  const headers = new HttpHeaders()
    .set('Authorization', token)
    .set('SUBDOMAIN', subdomain);

  const params = new HttpParams()
    .set('page', pageNumber)
    .set('per_page', perPage);

  return this._HttpClient.get(url, { headers, params });
}

  // show a specific department
  showDepartment(id: number): Observable<any> {
    if (!this.authHelper.validateAuth()) {
      return throwError(() => new Error('Authentication failed'));
    }

    const token = this.authHelper.getToken()!;
    const subdomain = this.authHelper.getSubdomain()!;
    const url = `${this.apiBaseUrl}od/departments/${id}`;

    const headers = new HttpHeaders()
      .set('Authorization', token)
      .set('SUBDOMAIN', subdomain);

    return this._HttpClient.get(url, { headers });
  }


}
