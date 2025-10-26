import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { TableComponent } from '../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AnnouncementsService } from '../../../core/services/admin-settings/announcements/announcements.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.css']
})
export class AnnouncementsComponent implements OnInit, OnDestroy {
  private announcementsService = inject(AnnouncementsService);
  private formBuilder = inject(FormBuilder);

  @ViewChild(OverlayFilterBoxComponent) filterBox!: OverlayFilterBoxComponent;

  // Data
  announcements: any[] = [];
  totalItems: number = 0;
  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalPages: number = 0;
  isLoading: boolean = false;

  // Search and filter
  searchTerm: string = '';
  filterForm!: FormGroup;

  // Subscriptions for cleanup
  private announcementsSubscription?: Subscription;

  // Breadcrumb
  breadcrumb = [
    { label: 'Admin Settings', link: '/cloud' },
    { label: 'Announcements' }
  ];

  ngOnInit(): void {
    this.filterForm = this.formBuilder.group({
      recipients: ['']
    });
    this.fetchAnnouncements();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  private unsubscribeAll(): void {
    if (this.announcementsSubscription) {
      this.announcementsSubscription.unsubscribe();
      this.announcementsSubscription = undefined;
    }
  }

  fetchAnnouncements(page: number = this.currentPage): void {
    // Unsubscribe from previous call if exists
    if (this.announcementsSubscription) {
      this.announcementsSubscription.unsubscribe();
    }

    this.isLoading = true;
    const recipients = this.filterForm.get('recipients')?.value || '';
    this.announcementsSubscription = this.announcementsService.getAnnouncements(page, this.itemsPerPage, this.searchTerm, recipients)
      .subscribe({
        next: (res) => {
          const data = res?.data;
          this.currentPage = Number(data?.page || 1);
          this.totalItems = Number(data?.total_items || 0);
          this.totalPages = Number(data?.total_pages || 0);
          this.announcements = (data?.list_items || []).map((item: any) => ({
            id: item.id,
            recipients: item.recipients || [],
            title: item.title,
            createdAt: this.formatDate(item.created_at)
          }));
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }

  /**
   * Format recipients for display
   */
  formatRecipients(recipients: any[]): string {
    if (!recipients || recipients.length === 0) return '-';

    return recipients.map(recipient => {
      const type = recipient.recipient_type || 'Unknown';
      const name = recipient.recipient_name || 'Unknown';
      return `${type}: ${name}`;
    }).join(', ');
  }

  /**
   * Get recipient type for display
   */
  getRecipientType(recipients: any[]): string {
    if (!recipients || recipients.length === 0) return '-';

    const types = [...new Set(recipients.map(r => r.recipient_type).filter(Boolean))];
    return types.join(', ');
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.fetchAnnouncements();
  }

  onItemsPerPageChange(n: number): void {
    this.itemsPerPage = n;
    this.currentPage = 1;
    this.fetchAnnouncements();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchAnnouncements(page);
  }

  filter(): void {
    this.currentPage = 1;
    this.filterBox.closeOverlay();
    this.fetchAnnouncements();
  }

  resetFilterForm(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.fetchAnnouncements();
  }

  /**
   * Navigate to view announcement
   */
  viewAnnouncement(id: number): void {
    // This will be handled by routerLink in the template
  }
}
