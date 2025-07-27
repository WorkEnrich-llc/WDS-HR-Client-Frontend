import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private online$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    // Listen to online/offline events
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(this.online$);
  }

  /**
   * Check if the browser is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Observable that emits the current online status
   */
  getOnlineStatus(): Observable<boolean> {
    return this.online$.asObservable();
  }

  /**
   * Check network connectivity by attempting to fetch a small resource
   */
  async checkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
