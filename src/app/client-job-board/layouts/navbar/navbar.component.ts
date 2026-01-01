import { Component, input } from '@angular/core';
import { Router } from '@angular/router';

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface LogoData {
  icon?: string;
  companyName?: string;
  tagline?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  // Signal inputs
  logo = input<LogoData>({});
  socialMediaLinks = input<SocialMediaLinks>({});
  websiteUrl = input<string | null>(null);
  showVisitWebsite = input<boolean>(true);

  constructor(private router: Router) { }

  navigateToCareers(): void {
    this.router.navigate(['/careers']);
  }

  hasSocialMedia(): boolean {
    const links = this.socialMediaLinks();
    return !!(links.facebook || links.instagram || links.twitter || links.linkedin);
  }
}

