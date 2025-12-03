import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CompanyDocumentsService } from '../../../../core/services/admin-settings/company-documents/company-documents.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-create-company-document',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PageHeaderComponent],
  templateUrl: './create-company-document.component.html',
  styleUrls: ['./create-company-document.component.css']
})
export class CreateCompanyDocumentComponent implements OnInit {
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private companyDocumentsService = inject(CompanyDocumentsService);
  private toasterService = inject(ToasterMessageService);

  // Form
  documentForm!: FormGroup;
  isSubmitting: boolean = false;
  formErrors: any = {};

  // File upload
  selectedFile: File | null = null;
  fileError: string | null = null;

  // Date formatting
  todayFormatted: string = new Date().toLocaleDateString('en-GB');

  // Breadcrumb
  breadcrumb = [
    { label: 'Admin Settings', link: '/cloud' },
    { label: 'Company Documents', link: '/company-documents' },
    { label: 'Create Document' }
  ];

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Custom validator to check if value is not empty after trimming and has no leading/trailing whitespace
   */
  private noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value && typeof control.value === 'string') {
      const trimmed = control.value.trim();
      if (trimmed.length === 0) {
        return { required: true };
      }
      // Check if the original value has leading or trailing whitespace
      if (control.value !== trimmed) {
        return { whitespace: true };
      }
    }
    return null;
  }

  /**
   * Initialize the form
   */
  initializeForm(): void {
    this.documentForm = this.formBuilder.group({
      file_name: ['', [Validators.required, Validators.minLength(2), this.noWhitespaceValidator.bind(this)]]
    });
  }

  /**
   * Open file picker
   */
  openFilePicker(event: Event): void {
    event.stopPropagation();
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    // If no file selected (user cancelled), do nothing
    if (!file) {
      // Reset the input value to ensure change event fires next time
      input.value = '';
      return;
    }

    // Clear any previous errors first
    this.fileError = null;

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      this.fileError = 'File size must be less than 10MB.';
      // Reset input
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  /**
   * Remove selected file
   */
  removeFile(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedFile = null;
    this.fileError = null;

    // Reset file input
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.documentForm.valid && this.selectedFile) {
      this.createDocument();
    }
  }

  /**
   * Handle discard action
   */
  onDiscard(): void {
    this.router.navigate(['/company-documents']);
  }

  /**
   * Create document
   */
  createDocument(): void {
    this.isSubmitting = true;

    const formData = new FormData();
    const fileNameValue = this.documentForm.get('file_name')?.value;
    formData.append('file_name', typeof fileNameValue === 'string' ? fileNameValue.trim() : fileNameValue);
    
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    // Clear previous errors
    this.formErrors = {};

    this.companyDocumentsService.createCompanyDocument(
      typeof fileNameValue === 'string' ? fileNameValue.trim() : fileNameValue,
      this.selectedFile!
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toasterService.showSuccess('Document created successfully');
        // Navigate to documents list
        this.router.navigate(['/company-documents']);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error creating document:', error);

        // Handle API validation errors
        if (error.error && error.error.error_handling) {
          this.handleApiErrors(error.error.error_handling);
        } else {
          const errorMessage = error?.error?.message || error?.error?.error || 'Failed to create document';
          this.toasterService.showError(errorMessage);
        }
      }
    });
  }

  /**
   * Handle API validation errors
   */
  private handleApiErrors(errors: any[]): void {
    this.formErrors = {};

    errors.forEach(error => {
      const field = error.field;
      const message = error.error;

      if (field === 'file_name' || field === 'file') {
        this.formErrors[field] = message;
      }
    });
  }

  /**
   * Get error message for a field
   */
  getFieldError(field: string): string {
    return this.formErrors[field] || '';
  }

  /**
   * Check if field has error
   */
  hasFieldError(field: string): boolean {
    return !!this.formErrors[field];
  }

  /**
   * Get file name for display
   */
  getFileName(): string {
    return this.selectedFile?.name || '';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes.toFixed(2)} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
}

