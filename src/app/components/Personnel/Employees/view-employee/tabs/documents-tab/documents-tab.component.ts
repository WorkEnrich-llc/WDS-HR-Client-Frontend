import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';

@Component({
  selector: 'app-documents-tab',
  imports: [CommonModule],
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
}
