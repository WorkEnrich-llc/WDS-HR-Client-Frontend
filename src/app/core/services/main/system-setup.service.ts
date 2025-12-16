import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export interface ISystemSetupStepMessage {
  en?: string;
  ar?: string;
}

export interface ISystemSetupStepItem {
  step: number;
  title: string;
  checked: boolean;
  message?: ISystemSetupStepMessage;
}

export interface ISystemSetupResponse {
  details?: string;
  data?: {
    list_items?: ISystemSetupStepItem[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class SystemSetupService {
  private _HttpClient = inject(HttpClient);
  private apiBaseUrl: string = environment.apiBaseUrl;
  private cached$?: Observable<ISystemSetupResponse>;

  getSystemSetup(): Observable<ISystemSetupResponse> {
    if (!this.cached$) {
      const url = `${this.apiBaseUrl}main/system-setup`;
      this.cached$ = this._HttpClient.get<ISystemSetupResponse>(url).pipe(
        shareReplay(1)
      );
    }
    return this.cached$;
  }
}

