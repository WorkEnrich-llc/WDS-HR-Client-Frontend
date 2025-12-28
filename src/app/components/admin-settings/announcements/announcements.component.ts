import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { TableComponent } from '../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AnnouncementsService } from '../../../core/services/admin-settings/announcements/announcements.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [RouterModule, PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule],
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
  private searchSubject = new Subject<string>();

  // Subscriptions for cleanup
  private announcementsSubscription?: Subscription;
  private searchSubscription?: Subscription;

  // Breadcrumb
  breadcrumb = [
    { label: 'Admin Settings', link: '/cloud' },
    { label: 'Announcements' }
  ];

  // private readonly recipientTypeMap: Record<string, number> = {
  //   Department: 1,
  //   Section: 2,
  //   Employee: 3,
  //   Branch: 4,
  //   Company: 5
  // };

  ngOnInit(): void {
    this.filterForm = this.formBuilder.group({
      recipient_type: ['']
    });
    
    // Setup debounced search with automatic request cancellation
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        return this.fetchAnnouncementsObservable();
      })
    ).subscribe();
    
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
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
      this.searchSubscription = undefined;
    }
  }

  fetchAnnouncements(page: number = this.currentPage): void {
    // Unsubscribe from previous call if exists
    if (this.announcementsSubscription) {
      this.announcementsSubscription.unsubscribe();
    }

    this.announcementsSubscription = this.fetchAnnouncementsObservable(page).subscribe();
  }

  /**
   * Returns an observable for fetching announcements (used by switchMap to enable cancellation)
   */
  private fetchAnnouncementsObservable(page: number = this.currentPage) {
    this.isLoading = true;
    const recipientTypeValue = this.filterForm.get('recipient_type')?.value;
    const recipient_type = recipientTypeValue ? Number(recipientTypeValue) : '';

    return this.announcementsService.getAnnouncements(
      page,
      this.itemsPerPage,
      this.searchTerm.trim(),
      recipient_type
    ).pipe(
      tap(res => {
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
      }),
      catchError(() => {
        this.isLoading = false;
        return of(null);
      })
    );
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
    this.searchSubject.next(this.searchTerm);
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
