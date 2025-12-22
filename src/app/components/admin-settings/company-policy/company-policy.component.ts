import { Component, inject, OnInit, OnDestroy } from '@angular/core';

import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CompanyPolicyService } from '../../../core/services/admin-settings/company-policy/company-policy.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-company-policy',
  standalone: true,
  imports: [RouterModule, PageHeaderComponent],
  templateUrl: './company-policy.component.html',
  styleUrls: ['./company-policy.component.css']
})
export class CompanyPolicyComponent implements OnInit, OnDestroy {
  private companyPolicyService = inject(CompanyPolicyService);
  private toasterService = inject(ToasterMessageService);

  // Data
  policies: any[] = [];
  totalItems: number = 0;
  isLoading: boolean = false;

  // Breadcrumb
  breadcrumb = [
    { label: 'Admin Settings', link: '/cloud' },
    { label: 'Company Policy' }
  ];

  ngOnInit(): void {
    // Initialize component
    this.loadPolicies();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions if any
  }

  /**
   * Load policies from API
   */
  loadPolicies(): void {
    this.isLoading = true;
    this.companyPolicyService.getCompanyPolicy().subscribe({
      next: (response) => {
        this.isLoading = false;
        // Handle response structure: response.data.list_items
        if (response && response.data && response.data.list_items) {
          this.policies = response.data.list_items || [];
          this.totalItems = response.data.total_items || 0;
        } else {
          this.policies = [];
          this.totalItems = 0;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching company policy:', error);
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to load company policy';
        this.toasterService.showError(errorMessage);
        this.policies = [];
        this.totalItems = 0;
      }
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  }
}
