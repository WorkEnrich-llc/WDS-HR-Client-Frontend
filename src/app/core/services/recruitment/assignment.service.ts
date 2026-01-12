import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AssignmentService {
    private baseUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    getAssignmentData(accessToken: string): Observable<any> {
        const url = `${this.baseUrl}recruiter/assignment-data?access_token=${accessToken}`;
        return this.http.get(url);
    }
}
