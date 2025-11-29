import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { EmailSettingsService } from '../../../../core/services/admin-settings/email-settings/email-settings.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-manage-email-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, PopupComponent, ReactiveFormsModule],
  templateUrl: './manage-email-settings.component.html',
  styleUrls: ['./manage-email-settings.component.css']
})
export class ManageEmailSettingsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private emailSettingsService = inject(EmailSettingsService);
  private toasterService = inject(ToasterMessageService);

  emailSettingsForm!: FormGroup;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  isPasswordVisible: boolean = false;
  isModalOpen: boolean = false;
  originalData: any = null;
  createdDate: string = '';
  updatedDate: string = '';

  // Breadcrumb
  breadcrumb = [
    { label: 'Admin Settings', link: '/cloud' },
    { label: 'Email Settings', link: '/email-settings' },
    { label: 'Manage Email Settings' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmailSettings();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions if any
  }

  /**
   * Initialize the form
   */
  initializeForm(): void {
    this.emailSettingsForm = this.fb.group({
      host_user: ['', [Validators.required, Validators.email]],
      host_password: ['', [Validators.required]],
      host: ['', [Validators.required]],
      port: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      use: [1, [Validators.required]], // 1 for TLS, 2 for SSL
      from_email: ['', [Validators.email]]
    });
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
          const data = response.data.object_info;
          this.originalData = JSON.parse(JSON.stringify(data));
          
          // Set dates
          this.createdDate = this.formatDate(data.created_at);
          this.updatedDate = this.formatDate(data.updated_at);

          // Pre-fill form
          this.emailSettingsForm.patchValue({
            host_user: data.host_user || '',
            host_password: data.host_password || '',
            host: data.host || '',
            port: data.port || '',
            use: data.use?.id || data.use || 1,
            from_email: data.from_email || ''
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching email settings:', error);
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to load email settings';
        this.toasterService.showError(errorMessage);
      }
    });
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  /**
   * Check if form has changed
   */
  get isChanged(): boolean {
    if (!this.originalData) {
      return this.emailSettingsForm.dirty;
    }

    const formValue = this.emailSettingsForm.value;
    return (
      formValue.host_user !== (this.originalData.host_user || '') ||
      formValue.host_password !== (this.originalData.host_password || '') ||
      formValue.host !== (this.originalData.host || '') ||
      formValue.port !== (this.originalData.port || '') ||
      formValue.use !== (this.originalData.use?.id || this.originalData.use || 1) ||
      formValue.from_email !== (this.originalData.from_email || '')
    );
  }

  /**
   * Save changes
   */
  saveChanges(): void {
    if (!this.isChanged) {
      return;
    }

    // Validate form
    this.emailSettingsForm.markAllAsTouched();
    if (this.emailSettingsForm.invalid) {
      this.toasterService.showError('Please fill in all required fields correctly.');
      return;
    }

    this.isSubmitting = true;

    const formValue = this.emailSettingsForm.value;
    const requestData = {
      request_data: {
        host: formValue.host,
        port: Number(formValue.port),
        use: Number(formValue.use),
        host_user: formValue.host_user,
        host_password: formValue.host_password,
        ...(formValue.from_email && { from_email: formValue.from_email })
      }
    };

    this.emailSettingsService.updateEmailSettings(requestData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toasterService.showSuccess('Email settings updated successfully',"Updated Successfully");
        this.router.navigate(['/email-settings']);
      },
      error: (error) => {
        this.isSubmitting = false;
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to update email settings';
        this.toasterService.showError(errorMessage);
      }
    });
  }

  /**
   * Open discard modal
   */
  openModal(): void {
    if (this.isChanged) {
      this.isModalOpen = true;
    } else {
      this.router.navigate(['/email-settings']);
    }
  }

  /**
   * Close discard modal
   */
  closeModal(): void {
    this.isModalOpen = false;
  }

  /**
   * Confirm discard action
   */
  confirmAction(): void {
    this.isModalOpen = false;
    this.router.navigate(['/email-settings']);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  }
}



