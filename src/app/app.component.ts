import { RouterModule, RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports:[TranslateModule,RouterOutlet,RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
 


  // translate service 
  title = 'multi-lang-site';

  constructor(private translate: TranslateService) {
    const lang = localStorage.getItem('lang') || 'en';
    this.translate.setDefaultLang('en');
    this.translate.use(lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    this.updateStyles(lang);
  }

  updateStyles(lang: string) {
    const linkId = 'lang-style';
    let linkElement = document.getElementById(linkId) as HTMLLinkElement;

    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = linkId;
      linkElement.rel = 'stylesheet';
      document.head.appendChild(linkElement);
    }

    linkElement.href = lang === 'ar' ? 'assets/rtl.css' : 'assets/ltr.css';
  }
}
