import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Reject an interview invitation
   * @param token The interview token (s parameter from URL)
   * @param reason The rejection reason/note
   * @returns Observable response
   */
  rejectInterview(token: string, reason: string): Observable<any> {
    const payload = {
      request_data: {
        s: token,
        note: reason
      }
    };

    return this.http.post(`${this.apiBaseUrl}recruiter/interviews/reject`, payload);
  }

  /**
   * Accept an interview invitation
   * @param token The interview token (s parameter from URL)
   * @returns Observable response
   */
  acceptInterview(token: string): Observable<any> {
    const payload = {
      request_data: {
        s: token
      }
    };

    return this.http.post(`${this.apiBaseUrl}recruiter/interviews/accept`, payload);
  }

  /**
   * Reject an offer
   * @param token The offer token (s parameter from URL)
   * @param reason The rejection reason/note
   * @returns Observable response
   */
  rejectOffer(token: string, reason: string): Observable<any> {
    const payload = {
      request_data: {
        s: token,
        note: reason
      }
    };

    return this.http.post(`${this.apiBaseUrl}recruiter/offers/reject`, payload);
  }

  /**
   * Accept an offer
   * @param token The offer token (s parameter from URL)
   * @returns Observable response
   */
  acceptOffer(token: string): Observable<any> {
    const payload = {
      request_data: {
        s: token
      }
    };

    return this.http.post(`${this.apiBaseUrl}recruiter/offers/accept`, payload);
  }

  acceptJobOffer(token: string) {
    const payload = {
      request_data: {
        s: token
      }
    };
    return this.http.post(`${this.apiBaseUrl}recruiter/job-offers/accept`, payload);
  }

  rejectJobOffer(token: string, reason: string) {
    const payload = {
      request_data: {
        s: token,
        note: reason
      }
    };
    return this.http.post(`${this.apiBaseUrl}recruiter/job-offers/reject`, payload);
  }

  /**
   * Submit interview feedback
   * @param token The interview token (s parameter from URL)
   * @param rating The rating (0-10)
   * @param comment The feedback comment
   * @returns Observable response
   */
  submitInterviewFeedback(token: string, rating: number, comment: string): Observable<any> {
    const payload = {
      request_data: {
        token: token,
        rating: rating,
        comment: comment
      }
    };

    return this.http.post(`${this.apiBaseUrl}recruiter/feedbacks/interviewer-feedback`, payload);
  }
}