import { Component, inject, OnInit } from '@angular/core';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { CompanyDocumentsService } from '../../../../core/services/admin-settings/company-documents/company-documents.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-view-company-document',
  standalone: true,
  imports: [RouterModule, PageHeaderComponent, PopupComponent],
  templateUrl: './view-company-document.component.html',
  styleUrls: ['./view-company-document.component.css']
})
export class ViewCompanyDocumentComponent implements OnInit {
  private companyDocumentsService = inject(CompanyDocumentsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toasterService = inject(ToasterMessageService);

  // Data
  documentDetails: any = null;
  isLoading: boolean = true;
  documentId: number = 0;
  createdDate: string | undefined;
  updatedDate: string | undefined;
  
  // Delete modal state
  isDeleteModalOpen: boolean = false;
  isDeleting: boolean = false;

  // Breadcrumb
  breadcrumb = [
    { label: 'Admin Settings', link: '/cloud' },
    { label: 'Company Documents', link: '/company-documents' },
    { label: 'View Document' }
  ];

  ngOnInit(): void {
    this.documentId = Number(this.route.snapshot.paramMap.get('id')) || 0;
    if (this.documentId) {
      this.loadDocumentDetails();
    } else {
      this.router.navigate(['/company-documents']);
    }
  }

  /**
   * Load document details by ID
   */
  loadDocumentDetails(): void {
    this.isLoading = true;
    this.companyDocumentsService.getCompanyDocumentById(this.documentId).subscribe({
      next: (response) => {
        this.documentDetails = response?.data?.object_info || response?.data;
        if (this.documentDetails) {
          this.createdDate = this.formatDate(this.documentDetails.created_at);
          this.updatedDate = this.formatDate(this.documentDetails.updated_at);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading document details:', error);
        this.isLoading = false;
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to load document details';
        this.toasterService.showError(errorMessage);
        // Navigate back to documents list on error
        this.router.navigate(['/company-documents']);
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
   * Format file size for display
   */
  formatFileSize(sizeKb: number | null | undefined): string {
    if (!sizeKb) return 'N/A';
    if (sizeKb < 1024) {
      return `${sizeKb.toFixed(2)} KB`;
    } else {
      return `${(sizeKb / 1024).toFixed(2)} MB`;
    }
  }

  /**
   * Navigate back to documents list
   */
  goBack(): void {
    this.router.navigate(['/company-documents']);
  }

  /**
   * Open document URL in new tab
   */
  openDocument(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  /**
   * Open delete confirmation modal
   */
  openDeleteModal(): void {
    this.isDeleteModalOpen = true;
  }

  /**
   * Close delete confirmation modal
   */
  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
  }

  /**
   * Confirm and delete document
   */
  confirmDelete(): void {
    if (!this.documentId) {
      return;
    }

    this.isDeleting = true;
    
    this.companyDocumentsService.deleteCompanyDocument(this.documentId).subscribe({
      next: (response) => {
        this.isDeleting = false;
        this.toasterService.showSuccess('Document deleted successfully');
        this.closeDeleteModal();
        // Navigate back to documents list after successful deletion
        this.router.navigate(['/company-documents']);
      },
      error: (error) => {
        this.isDeleting = false;
        console.error('Error deleting document:', error);
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to delete document';
        this.toasterService.showError(errorMessage);
      }
    });
  }
}

