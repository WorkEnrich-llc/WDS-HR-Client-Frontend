import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class PersonnelCalenderService {
  constructor(private http: HttpClient) {}

  getCalendar(year: number, month: number): Observable<any> {
    // month should be 1-based for API (January = 1)
    const url = `${environment.apiBaseUrl}personnel/calendar?year=${year}&month=${month}`;
    return this.http.get(url);
  }
}
