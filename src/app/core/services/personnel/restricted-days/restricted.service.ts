import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthHelperService } from '../../authentication/auth-helper.service';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RestrictedService {

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



  // create restricted days
  createRestrictedDay(restrictedDatData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/restricted`;
    return this._HttpClient.post(url, restrictedDatData, { headers });
  }


  // get all restricted days with pagination and filters
  getAllRestrictedDays(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      restriction_type?: string;
    }
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/restricted`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.restriction_type) params = params.set('restriction_type', filters.restriction_type);
    }

    return this._HttpClient.get(url, { headers, params });
  }


  // show restricted day by ID
  showRestrictedDay(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/restricted/${id}`;
    return this._HttpClient.get(url, { headers });
  }

  // update restricted day status
  updateRestrictedDayStatus(id: number, status: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/restricted/${id}/`;
    return this._HttpClient.patch(url, status, { headers });
  }


  // update restricted day
  updateRestrictedDay(restrictedDayData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => new Error('Authentication failed'));

    const url = `${this.apiBaseUrl}personnel/restricted`;
    return this._HttpClient.put(url, restrictedDayData, { headers });
  }

}
