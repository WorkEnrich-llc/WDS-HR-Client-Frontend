import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { JobBoardSetupService } from '../../../../core/services/recruitment/job-board-setup/job-board-setup.service';
import { ToastrService } from 'ngx-toastr';

interface SocialMediaLink {
    name: string;
    url: string;
}

@Component({
    selector: 'app-view-job-board-setup',
    standalone: true,
    imports: [PageHeaderComponent, RouterLink,],
    providers: [DatePipe],
    templateUrl: './view-job-board-setup.component.html',
    styleUrl: './view-job-board-setup.component.css'
})
export class ViewJobBoardSetupComponent implements OnInit {
    private datePipe = inject(DatePipe);
    private jobBoardSetupService = inject(JobBoardSetupService);
    private toastr = inject(ToastrService);

    isLoading: boolean = false;
    errorMessage: string = '';

    // Job board setup data
    description: string = '';
    socialMediaLinks: SocialMediaLink[] = [];
    jobsLandingPageUrl: string = '';
    createdAt: string = '';
    updatedAt: string = '';

    // UI state
    isDescriptionExpanded: boolean = false;
    private readonly DESCRIPTION_PREVIEW_LENGTH = 300; // Characters to show in preview

    ngOnInit(): void {
        // Load job board setup data
        this.loadJobBoardSetup();
        // Set the jobs landing page URL
        this.setJobsLandingPageUrl();
    }

    private setJobsLandingPageUrl(): void {
        // Get the base URL and append the /careers path
        const baseUrl = window.location.origin;
        this.jobsLandingPageUrl = `${baseUrl}/careers`;
    }

    loadJobBoardSetup(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.jobBoardSetupService.getJobBoardSetup().subscribe({
            next: (response: any) => {
                // Extract data from response.data.object_info
                const data = response.data?.object_info || response.data || response;

                // Extract description
                this.description = data.description || '';

                // Extract social media links
                this.socialMediaLinks = this.extractSocialMediaLinks(data);

                // Extract dates
                if (data.created_at) {
                    this.createdAt = this.formatDate(data.created_at);
                }
                if (data.updated_at) {
                    this.updatedAt = this.formatDate(data.updated_at);
                }

                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error loading job board setup:', error);
                this.errorMessage = error.error?.details || error.message || 'Failed to load job board setup';
                this.toastr.error(this.errorMessage, 'Error');
                this.isLoading = false;
            }
        });
    }

    extractSocialMediaLinks(data: any): SocialMediaLink[] {
        const links: SocialMediaLink[] = [];

        // Check for social_links object (from API response)
        if (data.social_links && typeof data.social_links === 'object') {
            // Extract links from social_links object
            const platforms = ['website', 'linkedin', 'facebook', 'instagram', 'x', 'twitter'];
            platforms.forEach(platform => {
                if (data.social_links[platform]) {
                    links.push({
                        name: this.formatPlatformName(platform),
                        url: data.social_links[platform]
                    });
                }
            });
        }
        // Check for social_media_links array or object (fallback)
        else if (data.social_media_links && Array.isArray(data.social_media_links)) {
            return data.social_media_links.map((link: any) => ({
                name: link.name || link.platform || '',
                url: link.url || link.value || ''
            }));
        } else if (data.social_media_links && typeof data.social_media_links === 'object') {
            // If it's an object, extract individual links
            const platforms = ['website', 'linkedin', 'facebook', 'instagram', 'twitter', 'x'];
            platforms.forEach(platform => {
                if (data.social_media_links[platform]) {
                    links.push({
                        name: this.formatPlatformName(platform),
                        url: data.social_media_links[platform]
                    });
                }
            });
        } else {
            // Fallback: check for individual fields
            if (data.website) links.push({ name: 'Website', url: data.website });
            if (data.linkedin) links.push({ name: 'LinkedIn', url: data.linkedin });
            if (data.facebook) links.push({ name: 'Facebook', url: data.facebook });
            if (data.instagram) links.push({ name: 'Instagram', url: data.instagram });
            if (data.twitter || data.x) links.push({ name: 'X (Twitter)', url: data.twitter || data.x });
        }

        return links;
    }

    formatPlatformName(platform: string): string {
        const names: { [key: string]: string } = {
            'website': 'Website',
            'linkedin': 'LinkedIn',
            'facebook': 'Facebook',
            'instagram': 'Instagram',
            'twitter': 'X (Twitter)',
            'x': 'X (Twitter)'
        };
        return names[platform.toLowerCase()] || platform;
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
    }

    toggleDescription(): void {
        this.isDescriptionExpanded = !this.isDescriptionExpanded;
    }

    get shouldShowSeeMore(): boolean {
        return !!(this.description && this.description.length > this.DESCRIPTION_PREVIEW_LENGTH);
    }

    openExternalLink(url: string): void {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }
}

