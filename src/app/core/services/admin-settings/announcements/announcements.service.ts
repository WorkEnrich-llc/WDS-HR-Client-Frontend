import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
    private http = inject(HttpClient);
    private apiBaseUrl = environment.apiBaseUrl;

    getAnnouncements(page: number = 1, perPage: number = 10, search: string = '', recipients: string = ''): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('per_page', perPage.toString());

        if (search) params = params.set('search', search);
        if (recipients) params = params.set('recipients', recipients);

        return this.http.get(`${this.apiBaseUrl}main/admin-settings/announce`, { params });
    }

    /**
     * Get announcement details by ID
     */
    getAnnouncementDetails(id: number): Observable<any> {
        return this.http.get(`${this.apiBaseUrl}main/admin-settings/announce/${id}/`);
    }

    /**
     * Create a new announcement
     */
    createAnnouncement(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiBaseUrl}main/admin-settings/announce`, formData);
    }
}


