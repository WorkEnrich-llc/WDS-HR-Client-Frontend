
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class JobOpeningsService {

    // send job offer with full payload
    sendJobOfferFull(payload: any): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-offers`;
        const body = { request_data: payload };
        return this._HttpClient.post(url, body);
    }

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
        // 1: Applicant, 2: Candidate, 3: Interviewee, 4: Job Offer Sent, 5: New Joiner, 6: Rejected, 7: Qualified
        if (status !== undefined && status !== null) {
            params = params.set('status', status.toString());
        }

        // Add search if provided
        if (search && search.trim()) {
            params = params.set('search', search.trim());
        }

        return this._HttpClient.get(url, { params });
    }

    // get applicants by job_id
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
        // 1: Applicant, 2: Candidate, 3: Interviewee, 4: Job Offer Sent, 5: New Joiner, 6: Rejected, 7: Qualified
        if (status !== undefined && status !== null) {
            params = params.set('status', status.toString());
        }

        // Add offer_status if provided
        // 1: Offer Accepted, 2: Offer Rejected
        if (offerStatus !== undefined && offerStatus !== null) {
            params = params.set('offer_status', offerStatus.toString());
        }

        // Add search if provided
        if (search && search.trim()) {
            params = params.set('search', search.trim());
        }

        return this._HttpClient.get(url, { params });
    }

    // get applicant details for a job opening
    getApplicantDetails(applicantId: number, jobId: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/applicants/${applicantId}/`;
        const params = new HttpParams().set('job_id', jobId.toString());
        return this._HttpClient.get(url, { params });
    }

    // get application details by application id
    getApplicationDetails(applicationId: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/applications/${applicationId}/`;
        return this._HttpClient.get(url);
    }

    // get feedbacks for application id with pagination
    getApplicationFeedbacks(applicationId: number, page: number = 1, perPage: number = 10): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/feedbacks`;
        const params = new HttpParams()
            .set('page', page.toString())
            .set('per_page', perPage.toString())
            .set('application_id', applicationId.toString());
        return this._HttpClient.get(url, { params });
    }

    // add feedback for application
    addApplicationFeedback(applicationId: number, rating: number, comment: string): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/feedbacks`;
        const body = {
            request_data: {
                application_id: applicationId,
                rating: rating,
                comment: comment
            }
        };
        return this._HttpClient.post(url, body);
    }

    // update application status
    updateApplicationStatus(applicationId: number, status: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/applications/${applicationId}/`;
        const body = { request_data: { status } };
        return this._HttpClient.patch(url, body);
    }

    // create interview for application
    createInterview(
        applicationId: number,
        payload: {
            title: string;
            interviewer: number;
            department: number | null;
            section: number | null;
            date: string; // YYYY-MM-DD
            time_from: string; // HH:mm
            time_to: string;   // HH:mm
            interview_type: number; // 1 offline, 2 online
            location: number | null;
        }
    ): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/interviews`;
        const body = {
            request_data: {
                application_id: applicationId,
                title: payload.title,
                interviewer: payload.interviewer,
                department: payload.department,
                section: payload.section,
                date: payload.date,
                time_from: payload.time_from,
                time_to: payload.time_to,
                interview_type: payload.interview_type,
                location: payload.location
            }
        };
        return this._HttpClient.post(url, body);
    }

    // create or reschedule interview for application
    upsertInterview(
        applicationId: number,
        payload: {
            title: string;
            interviewer: number;
            department: number | null;
            section: number | null;
            date: string; // YYYY-MM-DD
            time_from: string; // HH:mm
            time_to: string;   // HH:mm
            interview_type: number; // 1 offline, 2 online
            location: number;
        }
    ): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/interviews/${applicationId}/`;
        const body = { request_data: payload };
        return this._HttpClient.put(url, body);
    }

    // get interview details by application ID
    getInterviewDetails(applicationId: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/interviews/${applicationId}/`;
        return this._HttpClient.get(url);
    }

    // reschedule interview (update existing interview by interview ID)
    rescheduleInterview(
        interviewId: number,
        payload: {
            title: string;
            interviewer: number;
            department: number | null;
            section: number | null;
            date: string; // YYYY-MM-DD
            time_from: string; // HH:mm
            time_to: string;   // HH:mm
            interview_type: number; // 1 offline, 2 online
            location: number | null;
        }
    ): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/interviews/${interviewId}/`;
        const body = { request_data: payload };
        return this._HttpClient.put(url, body);
    }

    // send job offer
    sendJobOffer(applicationId: number, salary: number, join_date: string, offer_details: string): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-offers`;
        const body = { request_data: { application_id: applicationId, salary, join_date, offer_details } };
        return this._HttpClient.post(url, body);
    }

    // get job offer by application ID
    getJobOffer(applicationId: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-offers/${applicationId}/`;
        return this._HttpClient.get(url);
    }

    // update job offer by application ID
    updateJobOffer(applicationId: number, salary: number, join_date: string, offer_details: string, notice_period?: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-offers`;
        const request_data: any = { job_offer_id: applicationId, salary, join_date, offer_details };
        if (typeof notice_period === 'number') {
            request_data.notice_period = notice_period;
        }
        const body = { request_data };
        return this._HttpClient.put(url, body);
    }

    // accept job offer by ID with application_id param
    acceptJobOffer(jobOfferId: number, applicationId: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-offers/${jobOfferId}/`;
        const params = new HttpParams().set('application_id', applicationId.toString());
        const body = { request_data: { status: 1 } };
        return this._HttpClient.patch(url, body, { params });
    }

    // edit join date for job offer
    editJoinDate(jobOfferId: number, joinDate: string): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/job-offers/edit-join-date/${jobOfferId}/`;
        const body = { request_data: { join_date: joinDate } };
        return this._HttpClient.patch(url, body);
    }

    // reject application
    rejectApplication(applicationId: number, rejectionNotes: string, rejectionMailMessage: string): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/applications/reject/${applicationId}/`;
        const body = {
            request_data: {
                rejection_notes: rejectionNotes,
                rejection_mail_message: rejectionMailMessage
            }
        };
        return this._HttpClient.put(url, body);
    }

    // get employee create info by application id
    getEmployeeCreateInfo(applicationId: number): Observable<any> {
        const url = `${this.apiBaseUrl}recruiter/jobs-openings/applications/employee-create-info/${applicationId}/`;
        return this._HttpClient.get(url);
    }
}