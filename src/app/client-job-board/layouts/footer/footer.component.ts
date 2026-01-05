import { Component, input } from '@angular/core';

import { LogoData } from '../navbar/navbar.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  logo = input<LogoData>({});

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getCopyrightText(): string {
    const companyName = this.logo().companyName;
    if (companyName) {
      return `© ${this.getCurrentYear()} ${companyName}. All rights reserved.`;
    }
    return '';
  }
}

