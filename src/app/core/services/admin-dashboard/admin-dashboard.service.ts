import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {

  
  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }


  // view dashboard
viewDashboard(params: any = {}): Observable<any> {
  const url = `${this.apiBaseUrl}od/dashboard/`;
  return this._HttpClient.get(url, { params });
}

}
