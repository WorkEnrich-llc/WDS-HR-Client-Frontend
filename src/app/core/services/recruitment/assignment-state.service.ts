import { Injectable } from '@angular/core';
import { LogoData, SocialMediaLinks } from '../../../client-job-board/layouts/navbar/navbar.component';

export interface AssignmentOverviewData {
  company?: {
    theme?: string;
    logo_url?: string;
    name?: string;
    title?: string;
    social_links?: {
      facebook?: string;
      instagram?: string;
      x?: string;
      linkedin?: string;
      website?: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentStateService {
  private overviewData: AssignmentOverviewData | null = null;
  private accessToken: string | null = null;

  /**
   * Save assignment overview data
   */
  setOverviewData(accessToken: string, data: AssignmentOverviewData): void {
    this.accessToken = accessToken;
    this.overviewData = data;
  }

  /**
   * Get assignment overview data if it matches the current access token
   */
  getOverviewData(accessToken: string): AssignmentOverviewData | null {
    if (this.accessToken === accessToken && this.overviewData) {
      return this.overviewData;
    }
    return null;
  }

  /**
   * Clear stored overview data
   */
  clearOverviewData(): void {
    this.overviewData = null;
    this.accessToken = null;
  }

  /**
   * Check if overview data exists for the given access token
   */
  hasOverviewData(accessToken: string): boolean {
    return this.accessToken === accessToken && this.overviewData !== null;
  }
}
