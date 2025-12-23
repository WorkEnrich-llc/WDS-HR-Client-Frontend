
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SummaryReportService {
  private readonly endpoint = environment.apiBaseUrl + 'personnel/1_0_2/attendance/summary-report';

  constructor(private http: HttpClient) {}

  getSummaryReport(page: number, perPage: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    return this.http.get<any>(this.endpoint, { params });
  }
}
