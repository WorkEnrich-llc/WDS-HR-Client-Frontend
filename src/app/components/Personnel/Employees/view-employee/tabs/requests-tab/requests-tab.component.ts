import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

import { RouterLink } from '@angular/router';
import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';
import { ApprovalRequestsService } from '../../../../../../core/services/personnel/approval-requests/approval-requests.service';
import { ApprovalRequestItem } from '../../../../../../core/interfaces/approval-request';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-requests-tab',
  imports: [RouterLink, TableComponent, NgClass],
  templateUrl: './requests-tab.component.html',
  styleUrls: ['./requests-tab.component.css']
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
        return 'badge-newjoiner'; // Blue badge for pending (matches system pattern)
      case 'approved':
      case 'active':
      case 'accepted':
        return 'badge-success'; // Green badge for approved/accepted
      case 'rejected':
      case 'cancelled':
        return 'badge-danger'; // Red badge for rejected/cancelled
      case 'expired':
        return 'badge-gray'; // Gray badge for expired (using system gray colors)
      case 'disabled':
      case 'inactive':
        return 'badge-gray'; // Gray badge for inactive/disabled
      default:
        return 'badge-gray';
    }
  }

  getDateRange(request: ApprovalRequestItem): string {
    const from = request.dates?.from_date;
    const to = request.dates?.to_date;
    if (!from || !to) return '';

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });

    if (from === to) return formatDate(fromDate);
    return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
  }

  getCurrentStep(request: ApprovalRequestItem): string {
    // Use API field `current_step` when available, otherwise fallback to status
    const currentStep = (request as any).current_step;
    if (currentStep) return currentStep;
    const name = request.status?.name || '';
    if (name.toLowerCase() === 'pending') return 'Pending Approval';
    if (name.toLowerCase() === 'approved' || name.toLowerCase() === 'accepted') return 'Approved';
    if (name.toLowerCase() === 'rejected') return 'Rejected';
    return name;
  }
}
