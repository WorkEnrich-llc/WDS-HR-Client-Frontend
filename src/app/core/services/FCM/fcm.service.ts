import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Messaging } from '@angular/fire/messaging';
import { getToken } from 'firebase/messaging';
import { Observable, throwError } from 'rxjs';
import { AuthHelperService } from '../authentication/auth-helper.service';
import { environment } from '../../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private token: string = '';
  private apiBaseUrl: string;
  constructor(private messaging: Messaging, private _HttpClient: HttpClient, private authHelper: AuthHelperService) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }
  // getAuthHeaders
  private getAuthHeaders(includeBearer: boolean = false): HttpHeaders | null {
    if (!this.authHelper.validateAuth()) {
      return null;
    }

    const token = this.authHelper.getToken()!;
    const sessionToken = this.authHelper.getSessionToken()!;
    const subdomain = this.authHelper.getSubdomain()!;

    let headers = new HttpHeaders()
      .set('Authorization', token)
      .set('SUBDOMAIN', subdomain)
      .set('SESSIONTOKEN', sessionToken);

    return headers;
  }

  async getToken(): Promise<string> {
    if (this.token) return this.token;
    try {
      const permission = Notification.permission;

      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
        });
        this.token = token ?? '';
        // console.log('FCM Token:', this.token);
        return this.token;

      } else if (permission === 'default') {
        Notification.requestPermission().then(async (request) => {
          if (request === 'granted') {
            const token = await getToken(this.messaging, {
              vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
            });
            this.token = token ?? '';
          } else {
            this.token = '';
          }
        }).catch(() => {
          this.token = '';
        });

        return '';

      } else {
        // permission === 'denied'
        return '';
      }

    } catch (err) {
      console.error('Error getting FCM token:', err);
      return '';
    }
  }


  // fcm update
  fcmUpdate(formData: FormData): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/fcm-update`;
      return this._HttpClient.put(url, formData);
    } else {
      throw new Error('API URL not found');
    }
  }


  // fcm change status
  fcmChangeStatus(formData: FormData): Observable<any> {
    if (this.apiBaseUrl) {
      const url = `${this.apiBaseUrl}main/authentication/fcm-change-status`;

      const headers = this.getAuthHeaders();
      if (!headers) return throwError(() => new Error('Authentication failed'));
     
      // headers.keys().forEach(key => {
      //   console.log(`${key}: ${headers.get(key)}`);
      // });

      return this._HttpClient.put(url, formData, { headers });
    } else {
      throw new Error('API URL not found');
    }
  }



}
