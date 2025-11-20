import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompanyPolicyService {
    private http = inject(HttpClient);
    private apiBaseUrl = environment.apiBaseUrl;

    /**
     * Get company policies list
     */
    getCompanyPolicy(): Observable<any> {
        return this.http.get(`${this.apiBaseUrl}main/admin-settings/company-policy`);
    }

    /**
     * Get company policy by ID
     */
    getCompanyPolicyById(id: number): Observable<any> {
        return this.http.get(`${this.apiBaseUrl}main/admin-settings/company-policy/${id}/`);
    }

    /**
     * Update company policies (bulk update with create/update/delete)
     */
    updateCompanyPolicies(requestData: any): Observable<any> {
        const payload = {
            request_data: {
                list_items: requestData
            }
        };
        return this.http.put(`${this.apiBaseUrl}main/admin-settings/company-policy`, payload);
    }
}

