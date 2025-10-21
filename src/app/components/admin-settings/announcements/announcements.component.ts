import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { TableComponent } from '../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AnnouncementsService } from '../../../core/services/admin-settings/announcements/announcements.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.css']
})
export class AnnouncementsComponent implements OnInit {
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

  fetchAnnouncements(page: number = this.currentPage): void {
    this.isLoading = true;
    const recipients = this.filterForm.get('recipients')?.value || '';
    this.announcementsService.getAnnouncements(page, this.itemsPerPage, this.searchTerm, recipients)
      .subscribe({
        next: (res) => {
          const data = res?.data;
          this.currentPage = Number(data?.page || 1);
          this.totalItems = Number(data?.total_items || 0);
          this.totalPages = Number(data?.total_pages || 0);
          this.announcements = (data?.list_items || []).map((item: any) => ({
            id: item.id,
            recipientName: (item.recipients && item.recipients[0]?.recipient_name) || '-',
            recipientType: (item.recipients && item.recipients[0]?.recipient_type) || '-',
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
}
