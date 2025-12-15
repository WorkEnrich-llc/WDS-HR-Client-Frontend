import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ObjectInfo } from '../models/company-settings.model';

/**
 * Service for managing SEO meta tags dynamically based on company settings
 * Improves search engine optimization and accessibility
 */
@Injectable({
  providedIn: 'root'
})
export class MetaTagsService {
  private defaultTitle = 'Careers - Job Opportunities';
  private defaultDescription = 'Explore exciting career opportunities and join our team.';

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) { }

  /**
   * Update meta tags based on company settings
   * @param companyInfo Company settings object from API
   * @param pageTitle Optional page-specific title (e.g., "Open Positions", "Job Details")
   * @param pageDescription Optional page-specific description
   */
  updateMetaTags(
    companyInfo: ObjectInfo | null,
    pageTitle?: string,
    pageDescription?: string
  ): void {
    if (!companyInfo) {
      this.setDefaultMetaTags();
      return;
    }

    // Build title: [Page Title] | [Company Name] - Careers
    const companyName = companyInfo.name || '';
    const fullTitle = pageTitle
      ? `${pageTitle} | ${companyName} - Careers`
      : companyName
        ? `${companyName} - Careers`
        : this.defaultTitle;

    // Build description: Use page description, fallback to company description, then default
    const description = pageDescription || companyInfo.description || this.defaultDescription;

    // Update page title
    this.titleService.setTitle(fullTitle);

    // Basic meta tags
    this.updateTag('description', description);
    this.updateTag('keywords', this.buildKeywords(companyInfo, pageTitle));

    // Open Graph tags for social media sharing
    this.updateOgTag('og:title', fullTitle);
    this.updateOgTag('og:description', description);
    this.updateOgTag('og:type', 'website');

    if (companyInfo.logo) {
      this.updateOgTag('og:image', companyInfo.logo);
    }

    if (companyInfo.social_links?.website) {
      this.updateOgTag('og:url', companyInfo.social_links.website);
    }

    // Twitter Card tags
    this.updateTag('twitter:card', 'summary_large_image');
    this.updateTag('twitter:title', fullTitle);
    this.updateTag('twitter:description', description);

    if (companyInfo.logo) {
      this.updateTag('twitter:image', companyInfo.logo);
    }

    // Additional SEO tags
    if (companyInfo.name) {
      this.updateTag('author', companyInfo.name);
    }

    // Canonical URL (if website is available)
    if (companyInfo.social_links?.website) {
      this.updateCanonicalUrl(companyInfo.social_links.website);
    }
  }

  /**
   * Update meta tags for job-specific pages
   * @param companyInfo Company settings
   * @param jobTitle Job title
   * @param jobDescription Job description (optional)
   * @param jobId Job ID for canonical URL
   */
  updateJobMetaTags(
    companyInfo: ObjectInfo | null,
    jobTitle: string,
    jobDescription?: string,
    jobId?: number
  ): void {
    if (!companyInfo) {
      this.setDefaultMetaTags();
      return;
    }

    const companyName = companyInfo.name || '';
    const fullTitle = `${jobTitle} | ${companyName} - Careers`;
    const description = jobDescription ||
      `Apply for ${jobTitle} at ${companyName}. ${companyInfo.description || this.defaultDescription}`;

    // Update page title
    this.titleService.setTitle(fullTitle);

    // Basic meta tags
    this.updateTag('description', description);
    this.updateTag('keywords', `${jobTitle}, ${companyName}, careers, jobs, employment`);

    // Open Graph tags
    this.updateOgTag('og:title', fullTitle);
    this.updateOgTag('og:description', description);
    this.updateOgTag('og:type', 'article');

    if (companyInfo.logo) {
      this.updateOgTag('og:image', companyInfo.logo);
    }

    // Job-specific Open Graph tags
    if (jobId) {
      const jobUrl = companyInfo.social_links?.website
        ? `${companyInfo.social_links.website}/careers/${jobId}`
        : window.location.href;
      this.updateOgTag('og:url', jobUrl);
    }

    // Twitter Card tags
    this.updateTag('twitter:card', 'summary_large_image');
    this.updateTag('twitter:title', fullTitle);
    this.updateTag('twitter:description', description);

    if (companyInfo.logo) {
      this.updateTag('twitter:image', companyInfo.logo);
    }

    // Article meta tags
    if (companyInfo.name) {
      this.updateTag('article:author', companyInfo.name);
    }
  }

  /**
   * Update meta tags for application form page
   * @param companyInfo Company settings
   * @param jobTitle Job title being applied for
   */
  updateApplyFormMetaTags(
    companyInfo: ObjectInfo | null,
    jobTitle: string
  ): void {
    if (!companyInfo) {
      this.setDefaultMetaTags();
      return;
    }

    const companyName = companyInfo.name || '';
    const fullTitle = `Apply for ${jobTitle} | ${companyName} - Careers`;
    const description = `Apply for ${jobTitle} at ${companyName}. Submit your application and join our team.`;

    this.titleService.setTitle(fullTitle);
    this.updateTag('description', description);
    this.updateTag('robots', 'noindex, nofollow'); // Application forms typically shouldn't be indexed
  }

  /**
   * Set default meta tags when company info is not available
   */
  private setDefaultMetaTags(): void {
    this.titleService.setTitle(this.defaultTitle);
    this.updateTag('description', this.defaultDescription);
  }

  /**
   * Update or create a meta tag
   */
  private updateTag(name: string, content: string): void {
    if (this.metaService.getTag(`name="${name}"`)) {
      this.metaService.updateTag({ name, content });
    } else {
      this.metaService.addTag({ name, content });
    }
  }

  /**
   * Update or create an Open Graph meta tag
   */
  private updateOgTag(property: string, content: string): void {
    if (this.metaService.getTag(`property="${property}"`)) {
      this.metaService.updateTag({ property, content });
    } else {
      this.metaService.addTag({ property, content });
    }
  }

  /**
   * Build keywords meta tag from company info and page context
   */
  private buildKeywords(companyInfo: ObjectInfo, pageTitle?: string): string {
    const keywords: string[] = [];

    if (companyInfo.name) {
      keywords.push(companyInfo.name);
    }

    if (pageTitle) {
      keywords.push(pageTitle);
    }

    keywords.push('careers', 'jobs', 'employment', 'opportunities');

    if (companyInfo.number_employees) {
      keywords.push('hiring', 'recruitment');
    }

    return keywords.join(', ');
  }

  /**
   * Update canonical URL link tag
   */
  private updateCanonicalUrl(url: string): void {
    // Remove existing canonical link if any
    const existingLink = document.querySelector('link[rel="canonical"]');
    if (existingLink) {
      existingLink.remove();
    }

    // Add new canonical link
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  /**
   * Remove robots noindex tag (useful when navigating from apply form to other pages)
   */
  removeNoIndexTag(): void {
    const robotsTag = this.metaService.getTag('name="robots"');
    if (robotsTag) {
      this.metaService.removeTag('name="robots"');
    }
  }
}
