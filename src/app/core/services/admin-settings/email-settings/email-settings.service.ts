import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailSettingsService {
    private http = inject(HttpClient);
    private apiBaseUrl = environment.apiBaseUrl;

    /**
     * Get email settings
     */
    getEmailSettings(): Observable<any> {
        return this.http.get(`${this.apiBaseUrl}main/admin-settings/email-settings`);
    }

    /**
     * Update email settings
     */
    updateEmailSettings(formData: any): Observable<any> {
        return this.http.put(`${this.apiBaseUrl}main/admin-settings/email-settings`, formData);
    }
}



