import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { SubscriptionService } from '../services/subscription/subscription.service';

export const subscriptionInterceptor: HttpInterceptorFn = (req, next) => {
  const subService = inject(SubscriptionService);

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.body) {
        const body: any = event.body;
        const sub = body && body.data ? body.data.subscription ?? null : null;
        if (sub) {
          subService.setSubscription(sub);
        }
      }
    })
  );
};
