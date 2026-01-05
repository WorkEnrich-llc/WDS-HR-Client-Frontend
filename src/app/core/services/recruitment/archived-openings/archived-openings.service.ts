import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ArchivedOpeningsService {
    private _HttpClient = inject(HttpClient);
    private apiBaseUrl = environment.apiBaseUrl;

    // Send job offer with full payload
    sendJobOfferFull(payload: any): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-offers`;
        const body = { request_data: payload };
        return this._HttpClient.post(url, body);
    }

    // Get all archived job openings with pagination and filters
    getAllArchivedOpenings(
        pageNumber: number,
        perPage: number,
        filters?: {
            search?: string;
            date_from?: string;
            date_to?: string;
        }
    ): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-archived`;

        let params = new HttpParams()
            .set('page', pageNumber)
            .set('per_page', perPage)

        if (filters) {
            if (filters.search) params = params.set('search', filters.search);
            if (filters.date_from) params = params.set('date_from', filters.date_from);
            if (filters.date_to) params = params.set('date_to', filters.date_to);
        }

        return this._HttpClient.get(url, { params });
    }

    // Get archived job opening by ID
    getArchivedOpeningById(id: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/${id}`;
        return this._HttpClient.get(url);
    }

    // Unarchive a job opening (change status from 3 to active)
    // Same endpoint and method as job openings status update
    unarchiveJobOpening(id: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/${id}/`;
        const requestBody = {
            request_data: {
                status: 1 // Change to Live status
            }
        };
        return this._HttpClient.patch(url, requestBody);
    }

    // Duplicate a job opening
    duplicateJobOpening(id: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/duplicate/${id}/`;
        return this._HttpClient.post(url, {});
    }

    // Get job applications for archived opening
    getJobApplications(
        page: number,
        perPage: number,
        jobId: number,
        status?: number,
        search?: string
    ): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/${jobId}/applicants`;

        let params = new HttpParams()
            .set('page', page)
            .set('per_page', perPage);

        if (status !== undefined) {
            params = params.set('status', status);
        }
        if (search) {
            params = params.set('search', search);
        }

        return this._HttpClient.get(url, { params });
    }

    // Get applicants by job ID (same as JobOpeningsService for consistency)
    getApplicantsByJobId(
        jobId: number,
        pageNumber?: number,
        perPage?: number,
        status?: number,
        search?: string,
        offerStatus?: number
    ): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/applicants`;

        let params = new HttpParams()
            .set('job_id', jobId.toString());

        // Add pagination if provided
        if (pageNumber !== undefined && pageNumber !== null) {
            params = params.set('page', pageNumber.toString());
        }

        if (perPage !== undefined && perPage !== null) {
            params = params.set('per_page', perPage.toString());
        }

        // Add status if provided
        if (status !== undefined && status !== null) {
            params = params.set('status', status.toString());
        }

        // Add offer_status if provided
        if (offerStatus !== undefined && offerStatus !== null) {
            params = params.set('offer_status', offerStatus.toString());
        }

        // Add search if provided
        if (search && search.trim()) {
            params = params.set('search', search.trim());
        }

        return this._HttpClient.get(url, { params });
    }
}
