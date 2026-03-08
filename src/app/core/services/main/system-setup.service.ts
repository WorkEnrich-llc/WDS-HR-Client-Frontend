import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

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

  // Reactive system setup data
  private systemSetupSubject = new BehaviorSubject<ISystemSetupResponse | null>(null);
  public systemSetup$ = this.systemSetupSubject.asObservable();

  // Notification subject for module changes
  private moduleChangeSubject = new BehaviorSubject<string | null>(null);
  public moduleChange$ = this.moduleChangeSubject.asObservable();

  getSystemSetup(): Observable<ISystemSetupResponse> {
    if (this.cached$) {
      return this.cached$;
    }
    const url = `${this.apiBaseUrl}main/system-setup`;
    this.cached$ = this._HttpClient.get<ISystemSetupResponse>(url).pipe(
      tap(response => this.systemSetupSubject.next(response)),
      shareReplay(1)
    );
    return this.cached$;
  }

  /**
   * Refresh system setup data - call this when items are created in modules
   */
  refreshSystemSetup(): void {
    this.cached$ = undefined; // Clear cache
    this.getSystemSetup().subscribe();
  }

  /**
   * Notify that an item was created in a specific module
   * Call this from other services when items are created
   */
  notifyModuleItemCreated(moduleName: string): void {
    this.moduleChangeSubject.next(moduleName);
    // Auto-refresh system setup after a short delay to allow backend processing
    setTimeout(() => {
      this.refreshSystemSetup();
    }, 1000);
  }

  /**
   * Get current system setup data (if available)
   */
  getCurrentSystemSetup(): ISystemSetupResponse | null {
    return this.systemSetupSubject.value;
  }
}

