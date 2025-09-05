import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SubscriptionService } from '../services/subscription/subscription.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
  constructor(private subService: SubscriptionService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
  const featureKey = route.data['feature'];
  const requiredAction = route.data['action'];

  return this.subService.subscription$.pipe(
    map(sub => {
      if (!sub) return false;

      const normalizedKey = featureKey.replace(/\s+/g, "_");
      const feature = Object.keys(sub)
        .map(k => [k.replace(/\s+/g, "_"), sub[k]] as [string, any])
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, any>)
        [normalizedKey];

      if (!feature) {
        this.router.navigate(['/not-authorized']);
        return false;
      }

      if (requiredAction && !feature[requiredAction]) {
        this.router.navigate(['/not-authorized']);
        return false;
      }

      if (feature.info?.is_support) return true;

      this.router.navigate(['/not-authorized']);
      return false;
    })
  );
}

}
