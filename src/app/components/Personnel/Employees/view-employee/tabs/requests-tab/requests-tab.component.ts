import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';
import { ApprovalRequestsService } from '../../../../../../core/services/personnel/approval-requests/approval-requests.service';
import { ApprovalRequestItem } from '../../../../../../core/interfaces/approval-request';

@Component({
  selector: 'app-requests-tab',
  imports: [CommonModule, RouterLink, TableComponent],
  templateUrl: './requests-tab.component.html',
  styleUrl: './requests-tab.component.css'
})
export class RequestsTabComponent implements OnInit, OnChanges {
  @Input() employee: Employee | null = null;
  @Input() isEmployeeActive: boolean = false;

  requests: ApprovalRequestItem[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loading: boolean = false;

  constructor(private approvalRequestsService: ApprovalRequestsService) { }

  ngOnInit(): void {
    if (this.employee?.id) {
      this.loadEmployeeRequests();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee?.id) {
      this.currentPage = 1; // Reset to first page when employee changes
    }
  }

  loadEmployeeRequests(): void {
    if (!this.employee?.id) return;

    this.loading = true;
    this.approvalRequestsService.getEmployeeRequests(
      this.employee.id,
      this.currentPage,
      this.itemsPerPage
    ).subscribe({
      next: (response) => {
        this.requests = response.data.list_items;
        this.totalItems = response.data.total_items;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading employee requests:', error);
        this.loading = false;
        // Keep empty array to show no data message
        this.requests = [];
        this.totalItems = 0;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEmployeeRequests();
  }

  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.loadEmployeeRequests();
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'approved':
      case 'active':
        return 'badge-success';
      case 'rejected':
      case 'disabled':
        return 'badge-danger';
      case 'expired':
      case 'inactive':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  }

  getDateRange(request: ApprovalRequestItem): string {
    const fromDate = new Date(request.dates.from_date);
    const toDate = new Date(request.dates.to_date);

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });

    if (request.dates.from_date === request.dates.to_date) {
      return formatDate(fromDate);
    } else {
      return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
    }
  }

  getCurrentStep(request: ApprovalRequestItem): string {
    // Since current step is not provided in the API response,
    // we'll show a placeholder or status-based message
    if (request.status.name.toLowerCase() === 'pending') {
      return 'Pending Approval';
    } else if (request.status.name.toLowerCase() === 'approved') {
      return 'Approved';
    } else if (request.status.name.toLowerCase() === 'rejected') {
      return 'Rejected';
    } else {
      return request.status.name;
    }
  }
}
