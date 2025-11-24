import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class IntegrationsService {
    private _HttpClient = inject(HttpClient);
    private apiBaseUrl = environment.apiBaseUrl;

    /**
     * Get all integrations with pagination, search, and filters
     */
    getAllIntegrations(page: number = 1, itemsPerPage: number = 10, searchTerm: string = '', filters: any = {}): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('per_page', itemsPerPage.toString());

        if (searchTerm) {
            params = params.set('search', searchTerm);
        }

        // Add filters if they exist
        if (filters.created_from) {
            params = params.set('created_from', filters.created_from);
        }
        if (filters.created_to) {
            params = params.set('created_to', filters.created_to);
        }
        if (filters.expiry_from) {
            params = params.set('expiry_from', filters.expiry_from);
        }
        if (filters.expiry_to) {
            params = params.set('expiry_to', filters.expiry_to);
        }
        if (filters.status) {
            params = params.set('status', filters.status);
        }

        return this._HttpClient.get(`${this.apiBaseUrl}main/admin-settings/integration`, { params });
    }

    /**
     * Create a new integration
     */
    createIntegration(data: any): Observable<any> {
        return this._HttpClient.post(`${this.apiBaseUrl}main/admin-settings/integration`, data);
    }

    /**
     * Update an integration
     */
    updateIntegration(id: number, data: any): Observable<any> {
        return this._HttpClient.put(`${this.apiBaseUrl}main/admin-settings/integration/${id}`, data);
    }

    /**
     * Get integration details by id
     */
    getIntegrationDetails(id: number): Observable<any> {
        return this._HttpClient.get(`${this.apiBaseUrl}main/admin-settings/integration/${id}/`);
    }

    /**
     * Update integration (body contains integration_id)
     */
    updateIntegrationEntry(data: any): Observable<any> {
        return this._HttpClient.put(`${this.apiBaseUrl}main/admin-settings/integration`, data);
    }

    /**
     * Delete an integration
     */
    deleteIntegration(id: number): Observable<any> {
        return this._HttpClient.delete(`${this.apiBaseUrl}main/admin-settings/integration/${id}`);
    }

    /**
     * Update integration status (activate/deactivate)
     * @param id - Integration ID
     * @param status - true for Active, false for Revoked
     */
    updateIntegrationStatus(id: number, status: boolean): Observable<any> {
        const body = {
            request_data: {
                status: status
            }
        };
        return this._HttpClient.patch(`${this.apiBaseUrl}main/admin-settings/integration/${id}/`, body);
    }

    /**
     * Get integration features for service selection
     */
    getIntegrationFeatures(): Observable<any> {
        return this._HttpClient.get(`${this.apiBaseUrl}main/admin-settings/integration-features`);
    }

    /**
     * Get announcements list
     */
    getAnnouncements(page: number = 1, perPage: number = 10, search: string = '', recipients: string = ''): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('per_page', perPage.toString());

        if (search) params = params.set('search', search);
        if (recipients) params = params.set('recipients', recipients);

        return this._HttpClient.get(`${this.apiBaseUrl}main/admin-settings/announce`, { params });
    }
}

