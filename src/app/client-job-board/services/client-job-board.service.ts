import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanySettingsResponse } from '../models/company-settings.model';
import { JobListingResponse, JobDetailsResponse } from '../models/job-listing.model';

@Injectable({
  providedIn: 'root'
})
export class ClientJobBoardService {
  private apiBaseUrl: string;

  constructor(private http: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  /**
   * Get subdomain from localStorage (company_info)
   * Falls back to a default value for localhost development
   */
  private getSubdomain(): string {
    try {
      const companyInfoStr = localStorage.getItem('company_info');
      if (companyInfoStr) {
        const companyInfo = JSON.parse(companyInfoStr);
        if (companyInfo?.sub_domain) {
          return companyInfo.sub_domain;
        }
      }
    } catch (error) {
      console.error('Error parsing company_info from localStorage:', error);
    }

    // For localhost development, you can set a default subdomain
    // or get it from URL query params, localStorage, or environment
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      // Option 1: Get from URL query parameter (e.g., ?subdomain=test)
      const urlParams = new URLSearchParams(window.location.search);
      const subdomainFromUrl = urlParams.get('subdomain');
      if (subdomainFromUrl) {
        return subdomainFromUrl;
      }

      // Option 2: Get from localStorage if set manually for testing
      const testSubdomain = localStorage.getItem('test_subdomain');
      if (testSubdomain) {
        return testSubdomain;
      }

      // Option 3: Use a default subdomain for localhost (you can change this)
      // return 'default';
    }

    // If no subdomain found, return empty string (API might handle this)
    return '';
  }

  /**
   * Build headers with SUBDOMAIN header
   */
  private buildHeaders(): HttpHeaders {
    const subdomain = this.getSubdomain();
    let headers = new HttpHeaders();

    if (subdomain) {
      headers = headers.set('SUBDOMAIN', subdomain);
    }

    return headers;
  }

  /**
   * Get job listings with pagination
   * @param page Page number (default: 1)
   * @param perPage Items per page (default: 10)
   */
  getJobListings(page: number = 1, perPage: number = 10): Observable<JobListingResponse> {
    const headers = this.buildHeaders();
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    const url = `${this.apiBaseUrl}job-landing/jobs`;

    return this.http.get<JobListingResponse>(url, {
      headers,
      params,
      withCredentials: true
    });
  }

  /**
   * Get company settings for the job board
   */
  getCompanySettings(): Observable<CompanySettingsResponse> {
    const headers = this.buildHeaders();
    const url = `${this.apiBaseUrl}job-landing/company-settings`;

    return this.http.get<CompanySettingsResponse>(url, {
      headers,
      withCredentials: true
    });
  }

  /**
   * Get single job details by ID
   * @param jobId The ID of the job to fetch
   */
  getJobDetails(jobId: number): Observable<JobDetailsResponse> {
    const headers = this.buildHeaders();
    const url = `${this.apiBaseUrl}job-landing/jobs/${jobId}/`;

    return this.http.get<JobDetailsResponse>(url, {
      headers,
      withCredentials: true
    });
  }

  /**
   * Upload file (CV or attachment)
   * @param formData FormData containing job_id, is_cv, and file
   */
  uploadFile(formData: FormData): Observable<any> {
    const headers = this.buildHeaders();
    const url = `${this.apiBaseUrl}job-landing/upload-file`;

    return this.http.post(url, formData, {
      headers,
      withCredentials: true
    });
  }

  /**
   * Submit job application
   * @param requestData The application data in the required format
   */
  submitApplication(requestData: any): Observable<any> {
    const headers = this.buildHeaders();
    const url = `${this.apiBaseUrl}job-landing/apply`;

    return this.http.post(url, requestData, {
      headers,
      withCredentials: true
    });
  }
}
