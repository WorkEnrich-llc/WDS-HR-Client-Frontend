import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { TableComponent } from '../../shared/table/table.component';
import { CompanyDocumentsService } from '../../../core/services/admin-settings/company-documents/company-documents.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-company-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, TableComponent],
  templateUrl: './company-documents.component.html',
  styleUrls: ['./company-documents.component.css']
})
export class CompanyDocumentsComponent implements OnInit, OnDestroy {
  private companyDocumentsService = inject(CompanyDocumentsService);
  private toasterService = inject(ToasterMessageService);

  // Data
  documents: any[] = [];
  totalItems: number = 0;
  isLoading: boolean = false;
  
  // Upload state tracking
  uploadingDocumentId: number | null = null;
  fileInputs: { [key: number]: HTMLInputElement } = {};

  // Breadcrumb
  breadcrumb = [
    { label: 'Admin Settings', link: '/cloud' },
    { label: 'Company Documents' }
  ];

  ngOnInit(): void {
    // Initialize component
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    // Cleanup file inputs
    Object.values(this.fileInputs).forEach(input => {
      if (input && input.parentNode) {
        input.parentNode.removeChild(input);
      }
    });
    this.fileInputs = {};
  }

  /**
   * Load documents from API
   */
  loadDocuments(): void {
    this.isLoading = true;
    this.companyDocumentsService.getCompanyDocuments().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.data && response.data.list_items) {
          this.documents = response.data.list_items || [];
          this.totalItems = response.data.total_items || 0;
        } else {
          this.documents = [];
          this.totalItems = 0;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching company documents:', error);
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to load company documents';
        this.toasterService.showError(errorMessage);
        this.documents = [];
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
   * Open document URL in new tab
   */
  openDocument(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  /**
   * Trigger file picker for a specific document
   */
  triggerFilePicker(documentId: number): void {
    let fileInput = this.fileInputs[documentId];
    
    if (!fileInput) {
      // Create file input if it doesn't exist
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', (event) => this.onFileSelected(documentId, event));
      document.body.appendChild(fileInput);
      this.fileInputs[documentId] = fileInput;
    }
    
    fileInput.click();
  }

  /**
   * Handle file selection
   */
  onFileSelected(documentId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name;
      this.uploadDocument(documentId, fileName, file);
    }
    // Reset input value to allow selecting the same file again
    input.value = '';
  }

  /**
   * Upload document
   */
  uploadDocument(documentId: number, fileName: string, file: File): void {
    this.uploadingDocumentId = documentId;
    
    this.companyDocumentsService.updateCompanyDocument(documentId, fileName, file).subscribe({
      next: (response) => {
        this.uploadingDocumentId = null;
        this.toasterService.showSuccess('Document uploaded successfully');
        // Reload documents to get updated data
        this.loadDocuments();
      },
      error: (error) => {
        this.uploadingDocumentId = null;
        console.error('Error uploading document:', error);
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to upload document';
        this.toasterService.showError(errorMessage);
      }
    });
  }

  /**
   * Check if document is currently uploading
   */
  isUploading(documentId: number): boolean {
    return this.uploadingDocumentId === documentId;
  }

}

