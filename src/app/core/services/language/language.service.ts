import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translate = inject(TranslateService);
  
  private currentLanguageSubject = new BehaviorSubject<string>(this.getLanguage());
  /** Observable of language changes */
  language$ = this.currentLanguageSubject.asObservable();

  setLanguage(lang: string) {
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.currentLanguageSubject.next(lang);
  }

  getLanguage(): string {
    return localStorage.getItem('lang') || 'en';
  }
}
