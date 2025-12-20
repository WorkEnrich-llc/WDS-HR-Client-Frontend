import { Component, inject, OnInit, OnDestroy } from '@angular/core';

import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { PopupComponent } from '../../shared/popup/popup.component';
import { EmailSettingsService } from '../../../core/services/admin-settings/email-settings/email-settings.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-email-settings',
  standalone: true,
  imports: [RouterModule, PageHeaderComponent, PopupComponent],
  templateUrl: './email-settings.component.html',
  styleUrls: ['./email-settings.component.css']
})
export class EmailSettingsComponent implements OnInit, OnDestroy {
  private emailSettingsService = inject(EmailSettingsService);
  private toasterService = inject(ToasterMessageService);

  // Data
  isLoading: boolean = false;
  emailSettings: any = null;
  createdDate: string | undefined;
  updatedDate: string | undefined;

  // Modal states
  deactivateOpen: boolean = false;
  activateOpen: boolean = false;

  // Breadcrumb
  breadcrumb = [
    { label: 'Admin Settings', link: '/cloud' },
    { label: 'Email Settings' }
  ];

  ngOnInit(): void {
    // Load email settings on component start
    this.loadEmailSettings();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions if any
  }

  /**
   * Load email settings from API
   */
  loadEmailSettings(): void {
    this.isLoading = true;
    this.emailSettingsService.getEmailSettings().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.data && response.data.object_info) {
          this.emailSettings = response.data.object_info;
          this.createdDate = this.formatDate(this.emailSettings.created_at);
          this.updatedDate = this.formatDate(this.emailSettings.updated_at);
        } else {
          this.emailSettings = null;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching email settings:', error);
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to load email settings';
        this.toasterService.showError(errorMessage);
        this.emailSettings = null;
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

  /**
   * Open deactivate modal
   */
  openDeactivate(): void {
    this.deactivateOpen = true;
  }

  /**
   * Close deactivate modal
   */
  closeDeactivate(): void {
    this.deactivateOpen = false;
  }

  /**
   * Confirm deactivate
   */
  confirmDeactivate(): void {
    this.deactivateOpen = false;
    this.isLoading = true;

    const requestData = {
      request_data: {
        status: false
      }
    };

    this.emailSettingsService.updateEmailSettings(requestData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.data && response.data.object_info) {
          this.emailSettings = response.data.object_info;
          this.updatedDate = this.formatDate(this.emailSettings.updated_at);
          this.toasterService.showSuccess('Email settings deactivated successfully',"Updated Successfully");
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error deactivating email settings:', error);
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to deactivate email settings';
        this.toasterService.showError(errorMessage);
      }
    });
  }

  /**
   * Open activate modal
   */
  openActivate(): void {
    this.activateOpen = true;
  }

  /**
   * Close activate modal
   */
  closeActivate(): void {
    this.activateOpen = false;
  }

  /**
   * Confirm activate
   */
  confirmActivate(): void {
    this.activateOpen = false;
    this.isLoading = true;

    const requestData = {
      request_data: {
        status: true
      }
    };

    this.emailSettingsService.updateEmailSettings(requestData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.data && response.data.object_info) {
          this.emailSettings = response.data.object_info;
          this.updatedDate = this.formatDate(this.emailSettings.updated_at);
          this.toasterService.showSuccess('Email settings activated successfully' , "Updated Successfully");
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error activating email settings:', error);
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to activate email settings';
        this.toasterService.showError(errorMessage);
      }
    });
  }
}

