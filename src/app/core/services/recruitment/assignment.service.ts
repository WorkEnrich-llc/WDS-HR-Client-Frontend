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

    getAssignmentOverview(accessToken: string): Observable<any> {
        const url = `${this.baseUrl}recruiter/assignment-overview?access_token=${accessToken}`;
        return this.http.get(url);
    }

    startAssignment(accessToken: string): Observable<any> {
        const url = `${this.baseUrl}recruiter/start-assignment`;
        const body = {
            request_data: {
                access_token: accessToken
            }
        };
        return this.http.post(url, body);
    }

    submitAnswer(accessToken: string, questionId: number, selectedAnswerId?: number | null, textAnswer?: string | null): Observable<any> {
        const url = `${this.baseUrl}recruiter/assignment-submit-answer`;
        const body: any = {
            request_data: {
                access_token: accessToken,
                question_id: questionId
            }
        };

        if (selectedAnswerId !== null && selectedAnswerId !== undefined) {
            body.request_data.selected_answer_id = selectedAnswerId;
        }

        if (textAnswer !== null && textAnswer !== undefined && textAnswer.trim() !== '') {
            body.request_data.text_answer = textAnswer;
        }

        return this.http.post(url, body);
    }
}
