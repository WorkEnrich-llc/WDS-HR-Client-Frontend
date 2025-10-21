import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from './../../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class JobOpeningsService {

    private _HttpClient = inject(HttpClient);
    private apiBaseUrl: string = environment.apiBaseUrl;

    // get all job openings with pagination and filters
    getAllJobOpenings(
        pageNumber: number,
        perPage: number,
        filters?: {
            search?: string;
            status?: string;
            created_from?: string;
            created_to?: string;
        }
    ): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings`;

        let params = new HttpParams()
            .set('page', pageNumber)
            .set('per_page', perPage);

        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.status) params = params.set('status', filters.status);
            if (filters.created_from) params = params.set('created_from', filters.created_from);
            if (filters.created_to) params = params.set('created_to', filters.created_to);
        }

        return this._HttpClient.get(url, { params });
    }

    // show job opening details
    showJobOpening(id: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/${id}/`;
        return this._HttpClient.get(url);
    }

    // get job opening by id (alias for showJobOpening)
    getJobOpeningById(id: number): Observable<any> {
        return this.showJobOpening(id);
    }

    // create a new job opening
    createJobOpening(jobOpeningData: any): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings`;
        return this._HttpClient.post(url, jobOpeningData);
    }

    // update job opening
    updateJobOpening(id: number, jobOpeningData: any): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/${id}/`;
        return this._HttpClient.put(url, jobOpeningData);
    }

    // update job opening status
    updateJobOpeningStatus(id: number, status: any): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/${id}/`;
        return this._HttpClient.patch(url, status);
    }

    // delete job opening
    deleteJobOpening(id: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/${id}/`;
        return this._HttpClient.delete(url);
    }

    // get job applications with status filter
    getJobApplications(
        pageNumber: number,
        perPage: number,
        jobId: number,
        status?: number,
        search?: string
    ): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/applications`;

        let params = new HttpParams()
            .set('job_id', jobId.toString())
            .set('page', pageNumber.toString())
            .set('per_page', perPage.toString());

        // Add status if provided
        // 0: Applicant, 1: Candidate, 2: Interviewee, 5: Rejected, 6: Qualified
        if (status !== undefined && status !== null) {
            params = params.set('status', status.toString());
        }

        // Add search if provided
        if (search && search.trim()) {
            params = params.set('search', search.trim());
        }

        return this._HttpClient.get(url, { params });
    }

}

