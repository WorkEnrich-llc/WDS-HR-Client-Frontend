import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
    private http = inject(HttpClient);
    private apiBaseUrl = environment.apiBaseUrl;

    /**
     * Get notifications
     */
    getNotifications(): Observable<any> {
        return this.http.get(`${this.apiBaseUrl}main/admin-settings/notification`);
    }
}
