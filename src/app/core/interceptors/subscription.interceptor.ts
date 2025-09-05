import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { SubscriptionService } from '../services/subscription/subscription.service';

export const subscriptionInterceptor: HttpInterceptorFn = (req, next) => {
  const subService = inject(SubscriptionService);

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.body) {
        try {
          const body: any = event.body;
          const sub = body?.data?.subscription ?? null;

          if (sub && typeof sub === 'object') {
            subService.setSubscription(sub);
          } else if (body?.data?.features && Array.isArray(body.data.features)) {
            subService.setSubscription({ features: body.data.features });
          }
        } catch (e) {
          console.error('Error parsing subscription response:', e);
        }
      }
    })
  );
};
