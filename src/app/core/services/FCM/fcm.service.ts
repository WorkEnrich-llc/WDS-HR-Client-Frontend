import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Messaging } from '@angular/fire/messaging';
import { getMessaging, getToken } from 'firebase/messaging';
import { Observable, from } from 'rxjs';
import { environment } from './../../../../environments/environment';
import { switchMap } from 'rxjs/operators';
import { initializeApp } from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private token: string = '';
  private apiBaseUrl: string;
  private vapidKey: string = 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A';


  constructor(private messaging: Messaging, private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  async getToken(): Promise<string> {
    if (this.token) return this.token;

    try {
      const app = initializeApp(environment.firebaseConfig);
      const messaging = getMessaging(app);

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        console.warn('User denied notifications, skipping token generation.');
        return '';
      }

      const token = await getToken(messaging, {
        vapidKey: this.vapidKey,
      });

      this.token = token;
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return '';
    }
  }



  // fcm update
  fcmUpdate(formData: FormData): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/fcm-update`;
    return this._HttpClient.put(url, formData);
  }

  // fcm change status
  fcmChangeStatus(formData: FormData): Observable<any> {
    const url = `${this.apiBaseUrl}main/authentication/fcm-change-status`;
    return this._HttpClient.put(url, formData);
  }

  checkAndUpdateFcmStatus(): void {
    this.getToken().then(token => {
      if (!token) {
        console.warn('FCM token not available.');
        return;
      }

      const formData = new FormData();
      formData.append('fcm_token', token);

      this.fcmUpdate(formData).subscribe({
        next: (res) => {
          console.log('FCM token updated successfully:', res);

          const changeStatusData = new FormData();
          changeStatusData.append('status', '1');
          this.fcmChangeStatus(changeStatusData).subscribe({
            next: (statusRes) => {
              console.log('FCM status updated successfully:', statusRes);
            },
            error: (statusErr) => {
              console.error('Error updating FCM status:', statusErr);
            }
          });
        },
        error: (err) => {
          console.error('Error updating FCM token:', err);
        }
      });
    });
  }


  // async getToken(): Promise<string> {
  //   if (this.token) return this.token;

  //   try {
  //     const permission = Notification.permission;

  //     if (permission === 'granted') {
  //       const token = await getToken(this.messaging, {
  //         vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
  //       });
  //       this.token = token ?? '';
  //       return this.token;

  //     } else if (permission === 'default') {
  //       Notification.requestPermission().then(async (request) => {
  //         if (request === 'granted') {
  //           const token = await getToken(this.messaging, {
  //             vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
  //           });
  //           this.token = token ?? '';
  //         } else {
  //           this.token = '';
  //         }
  //       }).catch(() => {
  //         this.token = '';
  //       });

  //       return '';
  //     } else {
  //       return '';
  //     }

  //   } catch (err) {
  //     console.error('Error getting FCM token:', err);
  //     return '';
  //   }
  // }

  // fcmUpdate(formData: FormData) {
  //   return this.http.post(`${environment.apiBaseUrl}/fcm/update`, formData);
  // }
}
