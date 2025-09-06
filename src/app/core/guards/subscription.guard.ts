import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { map, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { SubscriptionService } from '../services/subscription/subscription.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
  constructor(private subService: SubscriptionService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const featureKey = route.data['feature'];
    const requiredAction = route.data['action'];

    return this.subService.subscription$.pipe(
      switchMap(sub => {
        if (sub) return of(sub);

        // لو مفيش اشتراك متخزن، هنعمله fetch من السيرفر
        return this.subService.getSubscription().pipe(
          tap(fetched => {
            if (fetched) this.subService.setSubscription(fetched);
          })
        );
      }),
      map(sub => {
        if (!sub) {
          return this.router.createUrlTree(['/not-authorized']);
        }

        const normalizedKey = featureKey.replace(/\s+/g, "_");
        const feature = Object.keys(sub)
          .map(k => [k.replace(/\s+/g, "_"), sub[k]] as [string, any])
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, any>)
          [normalizedKey];

        if (!feature) {
          return this.router.createUrlTree(['/not-authorized']);
        }

        if (requiredAction && !feature[requiredAction]) {
          return this.router.createUrlTree(['/not-authorized']);
        }

        return feature.info?.is_support === true
          ? true
          : this.router.createUrlTree(['/not-authorized']);
      })
    );
  }
}
