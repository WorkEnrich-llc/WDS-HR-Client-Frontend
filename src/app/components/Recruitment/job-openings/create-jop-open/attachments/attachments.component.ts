
import { Component, inject, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JobOpeningsService } from '../../../../../core/services/recruitment/job-openings/job-openings.service';
import { JobCreationDataService } from '../../../../../core/services/recruitment/job-openings/job-creation-data.service';
import { ToasterMessageService } from '../../../../../core/services/tostermessage/tostermessage.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-attachments',
  imports: [FormsModule],
  templateUrl: './attachments.component.html',
  styleUrls: ['./../../../../shared/table/table.component.css', './attachments.component.css']
})
export class AttachmentsComponent implements OnInit, OnDestroy {
  private jobOpeningsService = inject(JobOpeningsService);
  private jobCreationDataService = inject(JobCreationDataService);
  private toasterService = inject(ToasterMessageService);
  private router = inject(Router);
  private createUpdateSubscription?: Subscription;

  @Input() isUpdateMode = false;
  @Input() jobId: number | null = null;

  links: Array<{ value: string | null }> = [
    { value: null }
  ];
  Documents: Array<{ value: string | null }> = [
    { value: 'CV' }
  ];

  // Validation state
  validationErrors: {
    links: string[];
    documents: string[];
    mainInfo: string;
  } = {
      links: [],
      documents: [],
      mainInfo: ''
    };
  isFormTouched = false;
  isLoading = false;

  @Output() prevTab = new EventEmitter<void>();

  ngOnInit(): void {
    // Subscribe to service data to load existing attachments (for update mode)
    this.jobCreationDataService.jobData$.subscribe(data => {
      if (data.recruiter_dynamic_fields?.['Attachments']) {
        const attachments = data.recruiter_dynamic_fields['Attachments'];

        // Load links
        if (attachments.links && attachments.links.length > 0) {
          this.links = attachments.links.map((link: any) => ({ value: link.value }));
          // Initialize validation errors for loaded links
          this.validationErrors.links = new Array(this.links.length).fill('');
        }

        // Load files/documents
        if (attachments.files && attachments.files.length > 0) {
          this.Documents = attachments.files.map((file: any) => ({ value: file.value }));
          // Ensure CV is first if it exists, otherwise add it
          const cvIndex = this.Documents.findIndex((doc: any) => doc.value === 'CV');
          if (cvIndex === -1) {
            this.Documents.unshift({ value: 'CV' });
          } else if (cvIndex > 0) {
            // Move CV to first position
            const cv = this.Documents.splice(cvIndex, 1)[0];
            this.Documents.unshift(cv);
          }
          // Initialize validation errors for loaded documents
          this.validationErrors.documents = new Array(this.Documents.length).fill('');
        }
      }
    });

    // Initialize validation errors arrays (default values are already set in property initialization)
    this.validationErrors.links = new Array(this.links.length).fill('');
    this.validationErrors.documents = new Array(this.Documents.length).fill('');

    // Subscribe to trigger create/update from header button
    this.createUpdateSubscription = this.jobCreationDataService.triggerCreateUpdate$.subscribe(() => {
      this.createJobOpening();
    });
  }

  ngOnDestroy(): void {
    if (this.createUpdateSubscription) {
      this.createUpdateSubscription.unsubscribe();
    }
  }

  addLink() {
    this.links.push({ value: null });
    // Add empty error for new link
    this.validationErrors.links.push('');
  }

  removeLink(index: number) {
    if (this.links.length > 1) {
      this.links.splice(index, 1);
      this.validationErrors.links.splice(index, 1);
    }
  }
  addDocument() {
    this.Documents.push({ value: null });
    // Add empty error for new document
    this.validationErrors.documents.push('');
  }

  removeDocument(index: number) {
    // CV (first document) cannot be deleted
    if (index === 0 && this.Documents[0]?.value === 'CV') {
      return;
    }
    if (this.Documents.length > 1) {
      this.Documents.splice(index, 1);
      this.validationErrors.documents.splice(index, 1);
    }
  }

  /**
   * Check if a document can be removed (CV cannot be removed)
   */
  canRemoveDocument(index: number): boolean {
    // CV (first document) cannot be deleted
    if (index === 0 && this.Documents[0]?.value === 'CV') {
      return false;
    }
    return this.Documents.length > 1;
  }

  /**
   * Validate all fields
   */
  validateForm(): boolean {
    this.isFormTouched = true;
    let isValid = true;

    // Validate main information from previous tabs
    const currentData = this.jobCreationDataService.getCurrentData();
    if (!currentData.main_information?.job_title_id ||
      !currentData.main_information?.branch_id ||
      !currentData.main_information?.employment_type ||
      !currentData.main_information?.work_schedule_id) {
      this.validationErrors.mainInfo = 'Please complete all required fields in Main Information tab';
      isValid = false;
    } else {
      this.validationErrors.mainInfo = '';
    }

    // Validate links (if they have values, they should be valid URLs)
    // Ensure validation errors array is properly sized
    if (this.validationErrors.links.length !== this.links.length) {
      this.validationErrors.links = new Array(this.links.length).fill('');
    }

    this.links.forEach((link, index) => {
      if (link.value && typeof link.value === 'string' && link.value.trim()) {
        // Basic URL validation - try with http:// if no protocol
        let urlToValidate = link.value.trim();
        if (!urlToValidate.match(/^https?:\/\//i)) {
          urlToValidate = 'http://' + urlToValidate;
        }
        try {
          new URL(urlToValidate);
          this.validationErrors.links[index] = '';
        } catch {
          this.validationErrors.links[index] = 'Please enter a valid URL';
          isValid = false;
        }
      } else {
        this.validationErrors.links[index] = '';
      }
    });

    // Validate documents (if they have values, they should not be empty)
    // Ensure validation errors array is properly sized
    if (this.validationErrors.documents.length !== this.Documents.length) {
      this.validationErrors.documents = new Array(this.Documents.length).fill('');
    }

    this.Documents.forEach((doc, index) => {
      if (doc.value && typeof doc.value === 'string' && doc.value.trim() === '') {
        this.validationErrors.documents[index] = 'Document name cannot be empty';
        isValid = false;
      } else {
        this.validationErrors.documents[index] = '';
      }
    });

    return isValid;
  }

  createJobOpening(): void {
    // Prevent duplicate requests
    if (this.isLoading) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    // Set loading state
    this.isLoading = true;

    // Get the actual form data from the shared service
    const currentData = this.jobCreationDataService.getCurrentData();

    // Build the recruiter_dynamic_fields by merging existing fields with Attachments
    const recruiterDynamicFields: any = {};

    // Add Personal Details and Professional Details from required-details tab (if they exist)
    if (currentData.recruiter_dynamic_fields) {
      if (currentData.recruiter_dynamic_fields['Personal Details']) {
        recruiterDynamicFields['Personal Details'] = currentData.recruiter_dynamic_fields['Personal Details'];
      }
      if (currentData.recruiter_dynamic_fields['Professional Details']) {
        recruiterDynamicFields['Professional Details'] = currentData.recruiter_dynamic_fields['Professional Details'];
      }
    }

    // Ensure CV is always first in documents
    const documentsWithCV = [...this.Documents];
    const cvIndex = documentsWithCV.findIndex((doc: any) => doc.value === 'CV');
    if (cvIndex === -1) {
      documentsWithCV.unshift({ value: 'CV' });
    } else if (cvIndex > 0) {
      // Move CV to first position
      const cv = documentsWithCV.splice(cvIndex, 1)[0];
      documentsWithCV.unshift(cv);
    }

    // Add Attachments section
    recruiterDynamicFields['Attachments'] = {
      "links": this.links.map((link, index) => {
        // Use the link value as name if it exists, otherwise use default names
        const linkNames = ['Portfolio', 'Git', 'Previous'];
        return {
          "name": link.value || linkNames[index] || "Portfolio",
          "type": "text",
          "system": true,
          "value": link.value,
          "required": true
        };
      }),
      "files": documentsWithCV.map((doc, index) => ({
        "name": index === 0 ? "CV" : (doc.value || "Document"),
        "type": "text",
        "system": true,
        "value": doc.value,
        "required": index === 0 // Only CV is required
      }))
    };

    const jobData = {
      request_data: {
        main_information: currentData.main_information,
        recruiter_dynamic_fields: recruiterDynamicFields
      }
    };

    // Call create or update based on mode
    if (this.isUpdateMode && this.jobId) {
      this.jobOpeningsService.updateJobOpening(this.jobId, jobData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toasterService.showSuccess('Job opening updated successfully', 'Updated Successfully');
          this.router.navigate(['/job-openings/view-job-openings', this.jobId]);
        },
        error: (error) => {
          this.isLoading = false;
          // Error toast is automatically shown by the interceptor
          // This additional call is for custom error handling if needed
          const errorMessage = error.error?.details || error.message || 'Failed to update job opening';
          this.toasterService.showError(errorMessage, 'Error');
        }
      });
    } else {
      this.jobOpeningsService.createJobOpening(jobData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toasterService.showSuccess('Job opening created successfully!', 'Success');
          this.router.navigate(['/job-openings']);
        },
        error: (error) => {
          this.isLoading = false;
          // Error toast is automatically shown by the interceptor
          // This additional call is for custom error handling if needed
          const errorMessage = error.error?.details || error.message || 'Failed to create job opening';
          this.toasterService.showError(errorMessage, 'Error');
        }
      });
    }
  }

}
