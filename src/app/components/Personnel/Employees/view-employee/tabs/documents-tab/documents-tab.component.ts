import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';

import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-documents-tab',
  imports: [TableComponent, PopupComponent, FormsModule],
  templateUrl: './documents-tab.component.html',
  styleUrl: './documents-tab.component.css'
})
export class DocumentsTabComponent {


  @Input() employee: Employee | null = null;
  @Input() documentsRequired: Array<{
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

  onFileSelected(event: Event): void {
    this.fileSelected.emit(event);
  }

  onUpload(key: string, fileInput: HTMLInputElement): void {
    this.uploadDocument.emit({ key, fileInput });
  }

  onDelete(key: string): void {
    this.deleteDocument.emit(key);
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


}
