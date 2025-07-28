import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';

interface EmployeeRequest {
  id: number;
  requestedAt: string;
  currentStep: string;
  leaveType: string;
  dateRange: string;
  status: 'Pending' | 'Active' | 'Disabled' | 'Inactive';
}

@Component({
  selector: 'app-requests-tab',
  imports: [CommonModule, RouterLink, TableComponent],
  templateUrl: './requests-tab.component.html',
  styleUrl: './requests-tab.component.css'
})
export class RequestsTabComponent implements OnInit {
  @Input() employee: Employee | null = null;
  @Input() isEmployeeActive: boolean = false;

  requests: EmployeeRequest[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loading: boolean = false;

  ngOnInit(): void {
    this.loadDummyRequests();
  }

  loadDummyRequests(): void {
    // Dummy data for the requests table - matching the screenshot data
    this.requests = [
      {
        id: 1,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Pending'
      },
      {
        id: 2,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Active'
      },
      {
        id: 3,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Disabled'
      },
      {
        id: 4,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Inactive'
      },
      {
        id: 5,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Pending'
      },
      {
        id: 6,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Pending'
      },
      {
        id: 7,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Pending'
      },
      {
        id: 8,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Pending'
      },
      {
        id: 9,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Pending'
      },
      {
        id: 10,
        requestedAt: '2025-01-12T00:00:00Z',
        currentStep: 'Direct Manager\'s Approval',
        leaveType: 'Sick Leave',
        dateRange: '12/1/2025',
        status: 'Pending'
      }
    ];
    
    this.totalItems = this.requests.length;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // In a real application, you would load data for the new page here
  }

  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    // In a real application, you would reload data with new page size here
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
      case 'active':
        return 'badge-success';
      case 'disabled':
        return 'badge-danger';
      case 'inactive':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  }
}
