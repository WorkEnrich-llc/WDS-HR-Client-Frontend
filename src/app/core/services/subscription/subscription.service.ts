import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private _sub$ = new BehaviorSubject<any>(null);
  subscription$ = this._sub$.asObservable();

  setSubscription(sub: any) {
    this._sub$.next(sub);
  }

  get subscription() {
    return this._sub$.value;
  }
}

