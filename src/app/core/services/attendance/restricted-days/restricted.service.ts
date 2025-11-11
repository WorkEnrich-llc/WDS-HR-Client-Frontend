import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.ts';

@Injectable({
  providedIn: 'root'
})
export class RestrictedService {

  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // create restricted day
  createRestrictedDay(restrictedDatData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/restricted`;
    return this._HttpClient.post(url, restrictedDatData);
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
    const url = `${this.apiBaseUrl}personnel/restricted`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.restriction_type) params = params.set('restriction_type', filters.restriction_type);
    }

    return this._HttpClient.get(url, { params });
  }

  // show restricted day by ID
  showRestrictedDay(id: number): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/restricted/${id}`;
    return this._HttpClient.get(url);
  }

  // update restricted day status
  updateRestrictedDayStatus(id: number, status: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/restricted/${id}/`;
    return this._HttpClient.patch(url, status);
  }

  // update restricted day
  updateRestrictedDay(restrictedDayData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/restricted`;
    return this._HttpClient.put(url, restrictedDayData);
  }
}
