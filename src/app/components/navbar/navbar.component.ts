import { Component, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule,TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  selectedLanguage: string = 'en';
  constructor(private translate: TranslateService) {}

  ngOnInit() {
    this.selectedLanguage = localStorage.getItem('lang') || 'en';
  }

  changeLanguage(event: Event) {
    const lang = (event.target as HTMLSelectElement).value;
    this.selectedLanguage = lang;
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const linkElement = document.getElementById('lang-style') as HTMLLinkElement;
    if (linkElement) {
      linkElement.href = lang === 'ar' ? 'assets/rtl.css' : 'assets/ltr.css';
    }
  }
}
