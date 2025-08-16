import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
   private apiBaseUrl: string;  
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // get onboarding data
   getOnboarding(): Observable<any> {
      const url = `${this.apiBaseUrl}personnel/onboarding`;
      return this._HttpClient.get(url);
    }


  // create and update onboarding check
  createOnboarding(onboardingData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/onboarding`;
    return this._HttpClient.post(url, onboardingData);
  }

}
