import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CalendarService {
    constructor(private http: HttpClient) { }

    getCalendar(year: number, month: number): Observable<any> {
        const url = `${environment.apiBaseUrl}recruiter/calendar?year=${year}&month=${month}`;
        return this.http.get(url);
    }
}
