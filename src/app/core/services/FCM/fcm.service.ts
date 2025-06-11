import { Injectable } from '@angular/core';
import { Messaging } from '@angular/fire/messaging';
import { getToken } from 'firebase/messaging';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private token: string = '';

  constructor(private messaging: Messaging) {}

  async getToken(): Promise<string> {
    if (this.token) return this.token;

    try {
      await Notification.requestPermission();
      const token = await getToken(this.messaging, {
        vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
      });

      this.token = token ?? '';
      // console.log('FCM Token:', this.token);
      return this.token;
    } catch (err) {
      console.error('Error getting FCM token:', err);
      return '';
    }
  }
}

