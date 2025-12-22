import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { BehaviorSubject, map, Observable, of } from "rxjs";
import { AuthHelperService } from "../authentication/auth-helper.service";
import { BaseHttpService } from "../http/base-http.service";

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private apiBaseUrl: string;

  constructor(
    private _HttpClient: BaseHttpService, // Use BaseHttpService to automatically include withCredentials
    private _AuthHelper: AuthHelperService
  ) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  private _sub$ = new BehaviorSubject<any>(null);
  subscription$ = this._sub$.asObservable();

  setSubscription(sub: any) {
    if (sub?.features) {
      sub.features.forEach((feature: any) => {
        if (feature.sub_list) {
          feature.sub_list.forEach((s: any) => {
            const key = s.sub?.name || s.sub?.id;
            if (key) {
              const createAction = (s.allowed_actions || []).find((a: any) => a.name === 'create');

              const info = {
                is_support: s.is_support,
                usage_active: createAction?.usage?.active ?? 0,
                usage_inactive: createAction?.usage?.inactive ?? 0,
                count: createAction?.count ?? 0,
                error: s.error,
              };

              const actions: Record<string, boolean> = {};
              (s.allowed_actions || []).forEach((a: any) => {
                actions[a.name] = !!a.status;
              });

              sub[key] = {
                info,
                ...actions
              };
            }
          });
        }
      });
    }

    this._sub$.next(sub);
  }

  get subscription() {
    return this._sub$.value;
  }

  allFeatures$ = this.subscription$.pipe(
    map(sub => {
      if (!sub) return {};
      return Object.keys(sub)
        .filter(k => sub[k]?.info)
        .reduce((acc, k) => {
          const key = k.replace(/\s+/g, "_");
          acc[key] = sub[k].info.is_support;
          return acc;
        }, {} as Record<string, boolean>);
    })
  );

 getSubscription(): Observable<any> {
  const url = `${this.apiBaseUrl}main/authentication/subscription-status`;

  // BaseHttpService automatically includes withCredentials: true
  return this._HttpClient.get<any>(url).pipe(
    map(res => {
      const features = res?.data?.features ?? null;
      return features ? { features } : null;
    })
  );
}


  // getSubscription(): Observable<any> {
  //   const tokenWithQuotes = localStorage.getItem('token');
  //   const tokenValue = tokenWithQuotes ? tokenWithQuotes.replace(/^"|"$/g, '') : null;

  //   if (!tokenValue) {
  //     console.warn('User not logged in — skipping getSubscription request.');
  //     return of(null);
  //   }

  //   const url = `${this.apiBaseUrl}main/authentication/subscription-status`;

  //   const headers = new HttpHeaders({
  //     'ver': '1.0.1',
  //     'plat': 'DASHBOARD',
  //     'Authorization': `Token ${tokenValue}`
  //   });

  //   return this._HttpClient.get<any>(url, { headers }).pipe(
  //     map(res => {
  //       const features = res?.data?.features ?? null;
  //       return features ? { features } : null;
  //     })
  //   );
  // }
}
