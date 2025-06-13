import { Injectable } from '@angular/core';
import { Messaging } from '@angular/fire/messaging';
import { getToken } from 'firebase/messaging';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private token: string = '';

  constructor(private messaging: Messaging) { }

  async getToken(): Promise<string> {
    if (this.token) return this.token;

    try {
      const permission = Notification.permission;

      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
        });
        this.token = token ?? '';
        return this.token;

      } else if (permission === 'default') {
        const request = await Notification.requestPermission();
        if (request === 'granted') {
          const token = await getToken(this.messaging, {
            vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
          });
          this.token = token ?? '';
          return this.token;
        } else {
          console.warn('FCM permission was denied or dismissed by user.');
          return '';
        }

      } else {
        // console.warn('FCM permission was blocked by user.');
        alert('Push notifications have been blocked by your browser. Please enable notifications in your browser settings.');
        return '';
      }

    } catch (err) {
      console.error('Error getting FCM token:', err);
      return '';
    }
  }
}
