import { Injectable } from '@angular/core';
import { Messaging } from '@angular/fire/messaging';
import { getToken } from 'firebase/messaging';

@Injectable({
  providedIn: 'root'
})
export class FcmService {

  constructor(private messaging: Messaging) {
    this.initFCM();
  }

  private initFCM() {
    Notification.requestPermission()
      .then(() =>
        getToken(this.messaging, {
          vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
        })
      )
      .then(token => {
        console.log('FCM Token:', token);
      })
      .catch(err => {
        console.error('Error getting FCM token:', err);
      });
  }
}
