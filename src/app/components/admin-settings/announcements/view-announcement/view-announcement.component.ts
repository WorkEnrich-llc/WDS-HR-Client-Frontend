import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { AnnouncementsService } from '../../../../core/services/admin-settings/announcements/announcements.service';

@Component({
    selector: 'app-view-announcement',
    standalone: true,
    imports: [CommonModule, PageHeaderComponent],
    templateUrl: './view-announcement.component.html',
    styleUrls: ['./view-announcement.component.css']
})
export class ViewAnnouncementComponent implements OnInit {
    private announcementsService = inject(AnnouncementsService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    // Data
    announcementDetails: any = null;
    isLoading: boolean = true;
    announcementId: number = 0;

    // Body truncation
    showFullBody: boolean = false;
    readonly WORD_LIMIT = 100;

    // Breadcrumb
    breadcrumb = [
        { label: 'Admin Settings', link: '/cloud' },
        { label: 'Announcements', link: '/announcements' },
        { label: 'View Announcement' }
    ];

    ngOnInit(): void {
        this.announcementId = Number(this.route.snapshot.paramMap.get('id')) || 0;
        if (this.announcementId) {
            this.loadAnnouncementDetails();
        } else {
            this.router.navigate(['/announcements']);
        }
    }

    /**
     * Load announcement details by ID
     */
    loadAnnouncementDetails(): void {
        this.isLoading = true;
        this.announcementsService.getAnnouncementDetails(this.announcementId).subscribe({
            next: (response) => {
                this.announcementDetails = response?.data?.object_info;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading announcement details:', error);
                this.isLoading = false;
                // Navigate back to announcements list on error
                this.router.navigate(['/announcements']);
            }
        });
    }

    /**
     * Format date for display
     */
    formatDate(dateString: string): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    }

    /**
     * Navigate back to announcements list
     */
    goBack(): void {
        this.router.navigate(['/announcements']);
    }

    /**
     * Toggle full body visibility
     */
    toggleBodyVisibility(): void {
        this.showFullBody = !this.showFullBody;
    }

    /**
     * Get the displayed body text (truncated or full)
     */
    getDisplayedBody(): string {
        if (!this.announcementDetails?.body) {
            return '';
        }
        const words = this.announcementDetails.body.split(/\s+/);
        if (words.length > this.WORD_LIMIT && !this.showFullBody) {
            return words.slice(0, this.WORD_LIMIT).join(' ') + '....';
        }
        return this.announcementDetails.body;
    }

    /**
     * Check if the body text is truncated
     */
    isBodyTruncated(): boolean {
        if (!this.announcementDetails?.body) {
            return false;
        }
        return this.announcementDetails.body.split(/\s+/).length > this.WORD_LIMIT;
    }

    /**
     * Get recipients text formatted with commas
     */
    getRecipientsText(): string {
        if (!this.announcementDetails?.recipients || this.announcementDetails.recipients.length === 0) {
            return 'No recipients';
        }
        return this.announcementDetails.recipients
            .map((recipient: any) => recipient.recipient_name)
            .join(', ');
    }
}
