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
   * Get subdomain from URL or localStorage (company_info)
   * Priority: 1. URL hostname, 2. localStorage, 3. URL query params (for localhost)
   */
  private getSubdomain(): string {
    // First, try to extract subdomain from the current URL
    const hostname = window.location.hostname;

    // Extract subdomain from hostname (e.g., "dev-client.teamtalent.org" -> "dev-client")
    // Returns the complete subdomain prefix before the main domain
    const extractSubdomainFromHostname = (host: string): string | null => {
      // Skip localhost and IP addresses
      if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        return null;
      }

      // Split by dots
      const parts = host.split('.');

      // For domains like "dev-client.teamtalent.org" or "client.teamtalent.org"
      // We want to extract the complete subdomain prefix
      // If we have at least 3 parts, the first part(s) before the main domain is the subdomain
      if (parts.length >= 3) {
        // Get all parts except the last 2 (main domain + TLD)
        // For "dev-client.teamtalent.org" -> ["dev-client"]
        const subdomainParts = parts.slice(0, -2);

        if (subdomainParts.length > 0) {
          // Join all subdomain parts to get the complete subdomain
          // For "dev-client.teamtalent.org" -> "dev-client"
          return subdomainParts.join('.');
        }
      } else if (parts.length === 2) {
        // For cases like "client.local" or similar
        return parts[0];
      }

      return null;
    };

    // Try to get subdomain from URL first
    const subdomainFromUrl = extractSubdomainFromHostname(hostname);
    if (subdomainFromUrl) {
      return subdomainFromUrl;
    }

    // Fallback to localStorage (for logged-in users)
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

    // For localhost development, check URL query params
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalhost) {
      // Option 1: Get from URL query parameter (e.g., ?subdomain=test)
      const urlParams = new URLSearchParams(window.location.search);
      const subdomainFromUrlParam = urlParams.get('subdomain');
      if (subdomainFromUrlParam) {
        return subdomainFromUrlParam;
      }

      // Option 2: Get from localStorage if set manually for testing
      const testSubdomain = localStorage.getItem('test_subdomain');
      if (testSubdomain) {
        return testSubdomain;
      }
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
