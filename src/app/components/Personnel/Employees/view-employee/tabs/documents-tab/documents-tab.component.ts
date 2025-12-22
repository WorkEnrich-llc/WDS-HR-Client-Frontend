
import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HttpEventType } from '@angular/common/http';

import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { EmployeeService } from '../../../../../../core/services/personnel/employees/employee.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-documents-tab',
  imports: [TableComponent, PopupComponent, FormsModule],
  templateUrl: './documents-tab.component.html',
  styleUrl: './documents-tab.component.css'
})
export class DocumentsTabComponent implements OnInit, OnChanges {

  private employeeService = inject(EmployeeService);
  private changeDetector = inject(ChangeDetectorRef);
  private lastLoadedEmployeeId: number | null = null;

  @Input() employee: Employee | null = null;
  isLoading = false;
  documentsRequired: Array<{
    name: string;
    key: string;
    uploaded: boolean;
    url?: string;
    id?: number;
    uploadDate?: string;
    fileName?: string;
    size?: number;
    fileExt?: string;
    fileType?: string;
    isLoading?: boolean;
    isDeleteModalOpen?: boolean;
    isEditable?: boolean;
    mainId?: number;
    fileId?: number;
  }> = [];
  @Input() uploadProgress: { [key: string]: number } = {};

  @Output() fileSelected = new EventEmitter<Event>();
  @Output() uploadDocument = new EventEmitter<{ key: string; fileInput: HTMLInputElement }>();
  @Output() deleteDocument = new EventEmitter<string>();

  @Output() addDocumentClick = new EventEmitter<void>();
  onAddNewDocument(): void {
    this.addDocumentClick.emit();
  }

  // Table properties
  currentPage = 1;
  itemsPerPage = 10;

  @ViewChild('documentsTableHeader', { static: true }) documentsTableHeader!: TemplateRef<any>;
  @ViewChild('documentsTableRow', { static: true }) documentsTableRow!: TemplateRef<any>;
  @ViewChild('documentsTableEmpty', { static: true }) documentsTableEmpty!: TemplateRef<any>;
  selectedDocument: any | null = null;

  onFileSelected(event: Event): void {
    this.fileSelected.emit(event);

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.selectedDocument || !this.employee?.id) {
      // Reset selected document if no file selected
      if (!file) {
        this.selectedDocument = null;
      }
      return;
    }


    const document = this.selectedDocument;
    // Use fileId (sub.file_id) if exists, otherwise use mainId for new uploads
    const fileId = document.fileId || document.mainId;
    if (!fileId) {
      console.error('Cannot upload: file_id is missing');
      this.selectedDocument = null;
      return;
    }

    // Set local loading state
    document.isLoading = true;
    this.uploadProgress = { ...this.uploadProgress, [document.key]: 0 };
    this.changeDetector.markForCheck();

    // Upload the document
    this.employeeService.uploadEmployeeDocumentV102(fileId, file).subscribe({
      next: (uploadEvent) => {
        if (uploadEvent.type === HttpEventType.UploadProgress && uploadEvent.total) {
          const progress = Math.round((uploadEvent.loaded / uploadEvent.total) * 100);
          this.uploadProgress = { ...this.uploadProgress, [document.key]: progress };
          this.changeDetector.markForCheck();
        }

        if (uploadEvent.type === HttpEventType.Response) {
          document.isLoading = false;
          const { [document.key]: _, ...rest } = this.uploadProgress;
          this.uploadProgress = rest;
          this.selectedDocument = null;

          // Reload documents to reflect new state
          this.lastLoadedEmployeeId = null;
          this.loadDocuments();
        }
      },
      error: (error) => {
        console.error('Error uploading document:', error);
        document.isLoading = false;
        const { [document.key]: _, ...rest } = this.uploadProgress;
        this.uploadProgress = rest;
        this.selectedDocument = null;
        this.changeDetector.markForCheck();
      }
    });
  }

  onUpload(document: any, fileInput: HTMLInputElement): void {
    // Prevent upload if already uploading
    if (this.uploadProgress[document.key] !== undefined || document.isLoading) {
      return;
    }

    // Check if document has required file_id (mainId)
    if (!document.mainId) {
      console.error('Cannot upload: Document missing mainId (file_id)');
      return;
    }

    this.selectedDocument = document;
    fileInput.value = '';
    fileInput.click();
  }

  onDelete(key: string): void {
    // Find the document by key
    const document = this.documentsRequired.find(doc => doc.key === key);
    if (!document) {
      console.error('Document not found:', key);
      return;
    }

    // file_id should be the uploaded file ID (fileId), not the document type ID (mainId)
    const fileId = document.fileId;
    if (!fileId) {
      console.error('Cannot delete: file_id (fileId) is missing');
      this.closeDeleteModal(document);
      return;
    }

    // Set loading state
    document.isLoading = true;
    this.changeDetector.markForCheck();

    // Delete the document
    this.employeeService.deleteEmployeeDocumentV102(fileId).subscribe({
      next: () => {
        document.isLoading = false;
        this.closeDeleteModal(document);

        // Reload documents to reflect new state
        this.lastLoadedEmployeeId = null;
        this.loadDocuments();
      },
      error: (error) => {
        console.error('Error deleting document:', error);
        document.isLoading = false;
        this.changeDetector.markForCheck();
        // Keep modal open on error so user can retry
      }
    });
  }

  onViewDocument(url?: string): void {
    if (!url) return;
    setTimeout(() => {
      window.open(url, '_blank');
    }, 200);
  }

  getUploadedCount(): number {
    return this.documentsRequired.filter(doc => doc.uploaded).length;
  }

  getPendingCount(): number {
    return this.documentsRequired.filter(doc => !doc.uploaded).length;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
  }

  // Format upload date to display format
  getFormattedDate(dateString?: string): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Format file size to display format
  getFormattedSize(sizeKb?: number): string {
    if (!sizeKb) return '0 KB';

    if (sizeKb < 1024) {
      return `${sizeKb.toFixed(2)} KB`;
    } else {
      const sizeMb = sizeKb / 1024;
      return `${sizeMb.toFixed(2)} MB`;
    }
  }



  openDeleteModal(document: any) {
    this.documentsRequired.forEach(d => d.isDeleteModalOpen = false);
    document.isDeleteModalOpen = true;
  }

  closeDeleteModal(document: any) {
    document.isDeleteModalOpen = false;
  }

  ngOnInit(): void {
    if (this.employee?.id) {
      this.loadDocuments();
    } else {
      this.isLoading = false;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Load documents when employee input changes
    if (changes['employee']) {
      if (this.employee?.id) {
        // Only load if this is a different employee than the last one loaded
        if (this.lastLoadedEmployeeId !== this.employee.id) {
          this.loadDocuments();
        }
      } else {
        // Reset state if employee is cleared
        this.isLoading = false;
        this.documentsRequired = [];
        this.lastLoadedEmployeeId = null;
      }
    }
  }

  // Update a document using file_id from sub object
  updateDocument(document: any, updatePayload: any): void {
    if (!document?.fileId) {
      console.error('Cannot update: file_id (fileId) is missing');
      return;
    }
    this.employeeService.uploadEmployeeDocumentV102(document.fileId, updatePayload).subscribe({
      next: () => {
        this.loadDocuments();
      },
      error: (error: any) => {
        console.error('Error updating document:', error);
      }
    });
  }

  loadDocuments(): void {
    if (!this.employee?.id) return;

    // Skip if already loaded for this employee
    if (this.lastLoadedEmployeeId === this.employee.id) return;

    this.lastLoadedEmployeeId = this.employee.id;
    this.isLoading = true;

    this.employeeService.getEmployeeDocumentsPersonal(this.employee.id).subscribe({
      next: (response) => {
        // Transform API response to match component structure
        const listItems = response?.data?.list_items || [];
        this.documentsRequired = listItems.map((item: any) => {
          const main = item.main || {};
          const sub = item.sub || {};
          const inputOption = main.input_option || {};
          const documentUrl = sub.document_url || {};
          const info = documentUrl.info || {};

          // Check if document is uploaded (has file_id)
          const isUploaded = !!sub.file_id;

          // Get document URL (prefer generate_signed_url, fallback to image_url)
          const url = documentUrl.generate_signed_url?.trim() || documentUrl.image_url?.trim() || undefined;

          return {
            name: inputOption.label || 'Untitled Document',
            key: `doc_${main.id}`,
            uploaded: isUploaded,
            url: url,
            id: sub.file_id,
            mainId: main.id,
            fileId: sub.file_id,
            uploadDate: sub.created_at || sub.updated_at,
            fileName: info.file_name || undefined,
            size: info.file_size_kb || undefined,
            fileExt: info.file_ext || undefined,
            fileType: info.file_type || undefined,
            isLoading: false,
            isDeleteModalOpen: false,
            isEditable: false
          };
        });

        this.isLoading = false;
        // Trigger change detection
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.isLoading = false;
        // Reset flag on error to allow retry
        if (this.lastLoadedEmployeeId === this.employee?.id) {
          this.lastLoadedEmployeeId = null;
        }
      }
    });
  }

}
