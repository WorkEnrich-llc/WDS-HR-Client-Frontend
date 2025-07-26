import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';

@Component({
  selector: 'app-documents-tab',
  imports: [CommonModule, TableComponent],
  templateUrl: './documents-tab.component.html',
  styleUrl: './documents-tab.component.css'
})
export class DocumentsTabComponent {
  @Input() employee: Employee | null = null;
  @Input() documentsRequired: Array<{ name: string; key: string; uploaded: boolean; url?: string; id?: number }> = [];
  @Input() uploadProgress: { [key: string]: number } = {};
  
  @Output() fileSelected = new EventEmitter<Event>();
  @Output() uploadDocument = new EventEmitter<{ key: string; fileInput: HTMLInputElement }>();
  @Output() deleteDocument = new EventEmitter<string>();

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
}
