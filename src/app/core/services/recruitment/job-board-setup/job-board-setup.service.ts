import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class JobBoardSetupService {

    private _HttpClient = inject(HttpClient);
    private apiBaseUrl: string = environment.apiBaseUrl;

    // get job board setup data
    getJobBoardSetup(): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-board-setup`;
        return this._HttpClient.get<any>(url);
    }

    // update job board setup
    updateJobBoardSetup(jobBoardSetupData: any): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-board-setup`;
        return this._HttpClient.post<any>(url, jobBoardSetupData);
    }

    // update company logo
    updateCompanyLogo(formData: FormData): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-board-setup/company-logo`;
        return this._HttpClient.post<any>(url, formData);
    }

    // connect to google calendar
    connectGoogleCalendar(): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/google-calendar/connect`;
        return this._HttpClient.post<any>(url, {});
    }

    // disconnect from google calendar
    disconnectGoogleCalendar(): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/google-calendar/disconnect`;
        return this._HttpClient.post<any>(url, {});
    }
}