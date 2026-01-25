/**
 * Normalize phone numbers by removing spaces
 */

import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientJobBoardService } from '../../services/client-job-board.service';
import { MetaTagsService } from '../../services/meta-tags.service';
import { JobItem, JobFields, JobField } from '../../models/job-listing.model';
import { CloseDropdownDirective } from '../../../core/directives/close-dropdown.directive';
import { PopupComponent } from '../../../components/shared/popup/popup.component';
import { ToasterMessageService } from '../../../core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-apply-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink, CloseDropdownDirective, PopupComponent],
  templateUrl: './apply-form.component.html',
  styleUrl: './apply-form.component.css'
})
export class ApplyFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private jobBoardService = inject(ClientJobBoardService);
  private metaTagsService = inject(MetaTagsService);
  private fb = inject(FormBuilder);
  private toasterMessageService = inject(ToasterMessageService);

  jobId: string | null = null;
  job: JobItem | null = null;
  jobFields: JobFields | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  // Form state
  applicationForm!: FormGroup;
  resumeFile: File | null = null;
  isUploadingCV: boolean = false;
  uploadedAttachments: { name: string; file: File }[] = [];

  isSubmitting: boolean = false;
  cvUploadedFileName: string | null = null;
  // Store evaluation_id from upload-file response
  uploadedEvaluationId: number | null = null;

  // Dynamic dropdown states - stored by field name
  dropdownStates: { [key: string]: boolean } = {};

  // Accessibility: Screen reader announcements
  screenReaderAnnouncement: string = '';
  formErrorsAnnouncement: string = '';

  // Discard confirmation modal state
  isDiscardModalOpen: boolean = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.jobId = id;
        this.loadJobDetails(parseInt(id, 10));
      } else {
        this.errorMessage = 'Job ID not found in URL';
      }
    });
  }

  private loadJobDetails(jobId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.jobBoardService.getJobDetails(jobId).subscribe({
      next: (response) => {
        this.isLoading = false;
        const jobData = response.data?.object_info;

        if (jobData) {
          this.job = jobData;
          this.jobFields = jobData.job_fields || jobData.recruiter_dynamic_fields || null;
          const jobTitle = this.getName(jobData.job_title);
          document.title = `Apply for ${jobTitle} - Careers`;
          // Initialize form after job details are loaded
          this.initForm();
        } else {
          this.errorMessage = 'Job not found';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'We encountered an issue while fetching job details. Please try again in a moment.';
        console.error('Error loading job details:', error);
      }
    });
  }

  /**
   * Initialize form dynamically based on job_fields
   */
  private initForm(): void {
    const formControls: { [key: string]: any } = {};

    if (!this.jobFields) {
      // Fallback to empty form if no job_fields
      this.applicationForm = this.fb.group({});
      return;
    }

    // Process Personal Details
    if (this.jobFields['Personal Details']) {
      const personalDetails = this.jobFields['Personal Details'];

      // Basic Info
      if (personalDetails['Basic Info']) {
        personalDetails['Basic Info'].forEach(field => {
          formControls[this.getFieldKey(field.name)] = [
            field.value || '',
            this.getFieldValidators(field)
          ];
        });
      }

      // Education Details
      if (personalDetails['Education Details']) {
        personalDetails['Education Details'].forEach(field => {
          formControls[this.getFieldKey(field.name)] = [
            field.value || '',
            this.getFieldValidators(field)
          ];
        });
      }

      // Address Information
      if (personalDetails['Address Information']) {
        personalDetails['Address Information'].forEach(field => {
          formControls[this.getFieldKey(field.name)] = [
            field.value || '',
            this.getFieldValidators(field)
          ];
        });
      }
    }

    // Process Professional Details
    if (this.jobFields['Professional Details']) {
      const professionalDetails = this.jobFields['Professional Details'];

      // Salary Information
      if (professionalDetails['Salary Information']) {
        professionalDetails['Salary Information'].forEach(field => {
          formControls[this.getFieldKey(field.name)] = [
            field.value || '',
            this.getFieldValidators(field)
          ];
        });
      }

      // Current Job Information
      if (professionalDetails['Current Job Information']) {
        professionalDetails['Current Job Information'].forEach(field => {
          formControls[this.getFieldKey(field.name)] = [
            field.value || '',
            this.getFieldValidators(field)
          ];
        });
      }
    }

    // Process Attachments - Links
    if (this.jobFields.Attachments?.links) {
      this.jobFields.Attachments.links.forEach(field => {
        formControls[this.getFieldKey(field.name)] = [
          field.value || '',
          this.getFieldValidators(field, true) // Links need URL validation
        ];
      });
    }

    this.applicationForm = this.fb.group(formControls);
  }

  /**
   * Convert field name to form control key (lowercase, spaces to camelCase)
   */
  private getFieldKey(fieldName: string): string {
    return fieldName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Get validators for a field based on its type and required flag
   */
  private getFieldValidators(field: JobField, isUrl: boolean = false): any[] {
    const validators: any[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    // Don't apply type-based validators to dropdown fields
    // Dropdown fields handle their own validation through option selection
    if (this.isDropdownField(field)) {
      return validators;
    }

    if (isUrl || field.type === 'url') {
      validators.push(ApplyFormComponent.urlValidator);
    } else if (field.type === 'email') {
      validators.push(Validators.email);
    } else if (field.type === 'number') {
      validators.push(Validators.pattern(/^\d+$/));
    }

    return validators;
  }

  /**
   * Check if a job is considered "new" based on creation date
   */
  isJobNew(createdAt: string): boolean {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference <= 7;
  }

  /**
   * Helper function to extract name from object or string
   */
  private getName(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.name) return value.name;
    return '';
  }

  /**
   * Get experience text from job level
   */
  getExperienceText(jobLevel: string | undefined): string {
    if (!jobLevel) return 'Experience Required';
    const levelMap: { [key: string]: string } = {
      'Entry Level': '0-2 Years of Experience',
      'Mid Level': '3-5 Years of Experience',
      'Senior Level': '6-10 Years of Experience',
      'Expert': '10+ Years of Experience',
      'Consultant': '5+ Years of Experience'
    };
    return levelMap[jobLevel] || 'Experience Required';
  }

  /**
   * Getter methods for template to extract name values
   */
  getJobTitle(job: JobItem | null): string {
    if (!job) return '';
    return this.getName(job.job_title);
  }

  getJobBranch(job: JobItem | null): string {
    if (!job) return '';
    return this.getName(job.branch);
  }

  getEmploymentType(job: JobItem | null): string {
    if (!job) return '';
    return this.getName(job.employment_type);
  }

  getWorkSchedule(job: JobItem | null): string {
    if (!job) return '';
    return this.getName(job.work_schedule);
  }

  getJobLevel(job: JobItem | null): string {
    if (!job) return '';
    // Use job_level first, fallback to work_mode (same logic as open-positions and job-details components)
    return job.job_level || this.getName(job.work_mode) || '';
  }

  /**
   * Update meta tags for apply form page
   */
  private updateMetaTags(jobTitle: string): void {
    // Load company settings to get company info for meta tags
    this.jobBoardService.getCompanySettings().subscribe({
      next: (response) => {
        const companyInfo = response.data?.object_info;
        this.metaTagsService.updateApplyFormMetaTags(companyInfo || null, jobTitle);
      },
      error: (error) => {
        // If company settings fail, still update with basic info
        this.metaTagsService.updateApplyFormMetaTags(null, jobTitle);
      }
    });
  }

  /**
   * Handle resume file upload
   */
  onResumeUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Validate file type and size
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be smaller than 5 MB');
        return;
      }

      // Upload file to API
      if (this.jobId) {
        this.isUploadingCV = true;
        // Disable all form controls
        this.applicationForm.disable();

        const formData = new FormData();
        formData.append('job_id', this.jobId.toString());
        formData.append('is_cv', 'true');
        formData.append('file', file);

        this.jobBoardService.uploadFile(formData).subscribe({
          next: (response) => {
            this.isUploadingCV = false;
            this.resumeFile = file;
            // Re-enable all form controls
            this.applicationForm.enable();

            // Store the uploaded CV filename
            // The filename might be in different response structures
            if (response?.data?.file_name) {
              this.cvUploadedFileName = response.data.file_name;
            } else if (response?.data?.filename) {
              this.cvUploadedFileName = response.data.filename;
            } else if (response?.file_name) {
              this.cvUploadedFileName = response.file_name;
            } else if (this.resumeFile) {
              // Fallback to original filename if server doesn't return one
              this.cvUploadedFileName = this.resumeFile.name;
            }

            // Store evaluation_id if present
            if (response?.data?.evaluation_id) {
              this.uploadedEvaluationId = response.data.evaluation_id;
            }

            // Populate form with data from CV parsing
            if (response?.data?.application_content) {
              this.populateFormFromCV(response.data.application_content);
            }

            this.announceToScreenReader('CV uploaded successfully');
          },
          error: (error) => {
            this.isUploadingCV = false;
            // Re-enable all form controls
            this.applicationForm.enable();
            console.error('Error uploading CV:', error);
            alert('Failed to upload CV. Please try again.');
          }
        });
      } else {
        // If no job ID, just set the file locally
        this.resumeFile = file;
      }
    }
  }

  /**
   * Handle attachment upload
   */
  onAttachmentUpload(event: Event, attachmentName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadedAttachments.push({ name: attachmentName, file });
    }
  }

  /**
   * Download attachment
   */
  downloadAttachment(index: number): void {
    const attachment = this.uploadedAttachments[index];
    if (attachment && attachment.file) {
      const url = URL.createObjectURL(attachment.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Remove uploaded attachment
   */
  removeAttachment(index: number): void {
    this.uploadedAttachments.splice(index, 1);
  }

  /**
   * Handle discard application - opens confirmation modal
   */
  onDiscard(): void {
    this.isDiscardModalOpen = true;
  }

  /**
   * Close discard confirmation modal
   */
  closeDiscardModal(): void {
    this.isDiscardModalOpen = false;
  }

  /**
   * Confirm discard and navigate to careers
   */
  confirmDiscard(): void {
    this.applicationForm.reset();
    this.resumeFile = null;
    this.uploadedAttachments = [];
    this.cvUploadedFileName = null;
    this.isDiscardModalOpen = false;
    this.router.navigate(['/careers']);
  }

  /**
   * Get graduation years (last 50 years)
   */
  getGraduationYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = 0; i < 50; i++) {
      years.push(currentYear - i);
    }
    return years;
  }

  /**
   * Gender options
   */
  genderOptions = ['Male', 'Female', 'Other'];

  /**
   * Toggle dropdown
   */
  /**
   * Toggle dropdown state dynamically
   */
  toggleDropdown(fieldKey: string, event?: Event): void {
    if (this.isUploadingCV) {
      return;
    }

    if (event) {
      event.stopPropagation();
    }

    // Close all other dropdowns
    this.closeAllDropdowns();

    // Toggle the selected dropdown
    this.dropdownStates[fieldKey] = !this.dropdownStates[fieldKey];
  }

  /**
   * Get dropdown state for a field
   */
  isDropdownOpen(fieldKey: string): boolean {
    return this.dropdownStates[fieldKey] || false;
  }

  /**
   * Select option from dropdown
   */
  selectOption(fieldKey: string, value: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const control = this.applicationForm.get(fieldKey);
    if (control) {
      control.setValue(value);
      control.markAsTouched();
    }

    // Close dropdown after selection
    this.closeAllDropdowns();
  }

  /**
   * Close all dropdowns
   */
  closeAllDropdowns(): void {
    Object.keys(this.dropdownStates).forEach(key => {
      this.dropdownStates[key] = false;
    });
  }

  /**
   * Get display value for dropdown
   */
  getDisplayValue(fieldKey: string, fieldName?: string): string {
    const value = this.applicationForm.get(fieldKey)?.value || '';
    if (!value && fieldName) {
      return `Select ${fieldName.toLowerCase()}`;
    }
    return value;
  }

  /**
   * Handle keyboard navigation for dropdowns
   */
  onDropdownKeyDown(event: KeyboardEvent, fieldKey: string): void {
    const isOpen = this.getDropdownState(fieldKey);
    const options = this.getDropdownOptions(fieldKey);
    const currentValue = this.applicationForm.get(fieldKey)?.value || '';

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          this.toggleDropdown(fieldKey, event);
        } else {
          // Select first option or current value
          const firstOption = options[0] || '';
          this.selectOption(fieldKey, firstOption, event);
        }
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          this.closeAllDropdowns();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          this.toggleDropdown(fieldKey, event);
        } else {
          this.navigateDropdown(fieldKey, 'down', options, currentValue);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          this.navigateDropdown(fieldKey, 'up', options, currentValue);
        }
        break;
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          const firstOption = options[0] || '';
          this.selectOption(fieldKey, firstOption, event);
        }
        break;
      case 'End':
        if (isOpen) {
          event.preventDefault();
          const lastOption = options[options.length - 1] || '';
          this.selectOption(fieldKey, lastOption, event);
        }
        break;
    }
  }

  /**
   * Handle keyboard navigation for dropdown items
   */
  onDropdownItemKeyDown(event: KeyboardEvent, fieldKey: string, value: string): void {
    const options = this.getDropdownOptions(fieldKey);
    const currentIndex = options.indexOf(value);

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectOption(fieldKey, value, event);
        break;
      case 'Escape':
        event.preventDefault();
        this.closeAllDropdowns();
        break;
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        this.focusDropdownItem(fieldKey, options[nextIndex]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        this.focusDropdownItem(fieldKey, options[prevIndex]);
        break;
      case 'Home':
        event.preventDefault();
        this.focusDropdownItem(fieldKey, options[0]);
        break;
      case 'End':
        event.preventDefault();
        this.focusDropdownItem(fieldKey, options[options.length - 1]);
        break;
    }
  }

  /**
   * Get field key from field name (public method for template)
   */
  getFieldKeyFromName(fieldName: string): string {
    return this.getFieldKey(fieldName);
  }

  /**
   * Populate form fields from CV parsing response
   * The application_content structure matches job_fields structure
   */
  populateFormFromCV(applicationContent: { [key: string]: any }): void {
    if (!applicationContent || !this.applicationForm) {
      return;
    }

    // Handle Personal Details section
    if (applicationContent['Personal Details']) {
      const personalDetails = applicationContent['Personal Details'];

      // Basic Info
      if (personalDetails['Basic Info'] && Array.isArray(personalDetails['Basic Info'])) {
        personalDetails['Basic Info'].forEach((field: JobField) => {
          this.populateFieldFromCV(field);
        });
      }

      // Education Details
      if (personalDetails['Education Details'] && Array.isArray(personalDetails['Education Details'])) {
        personalDetails['Education Details'].forEach((field: JobField) => {
          this.populateFieldFromCV(field);
        });
      }

      // Address Information
      if (personalDetails['Address Information'] && Array.isArray(personalDetails['Address Information'])) {
        personalDetails['Address Information'].forEach((field: JobField) => {
          this.populateFieldFromCV(field);
        });
      }
    }

    // Handle Professional Details section
    if (applicationContent['Professional Details']) {
      const professionalDetails = applicationContent['Professional Details'];

      // Salary Information
      if (professionalDetails['Salary Information'] && Array.isArray(professionalDetails['Salary Information'])) {
        professionalDetails['Salary Information'].forEach((field: JobField) => {
          this.populateFieldFromCV(field);
        });
      }

      // Current Job Information
      if (professionalDetails['Current Job Information'] && Array.isArray(professionalDetails['Current Job Information'])) {
        professionalDetails['Current Job Information'].forEach((field: JobField) => {
          this.populateFieldFromCV(field);
        });
      }
    }

    // Handle Attachments links
    if (applicationContent['Attachments']?.links && Array.isArray(applicationContent['Attachments'].links)) {
      applicationContent['Attachments'].links.forEach((field: JobField) => {
        this.populateFieldFromCV(field);
      });
    }
  }

  /**
   * Populate a single field from CV parsing response
   */
  private populateFieldFromCV(field: JobField): void {
    if (!field || !field.name) {
      return;
    }

    // Skip empty strings and null values (but allow 0 and false)
    if (field.value === '' || field.value === null || field.value === undefined) {
      return;
    }

    // Convert the field name to form control key format
    const fieldKey = this.getFieldKey(field.name);
    const control = this.applicationForm.get(fieldKey);

    if (control) {
      // Convert number values to strings for form controls
      // Handle the value which could be string, number, or null
      let formValue: string;
      if (typeof field.value === 'number') {
        formValue = field.value.toString();
      } else {
        formValue = field.value as string;
      }

      control.setValue(formValue);
      control.markAsTouched();
    } else {
      console.warn(`Form control not found for field: ${field.name} (${fieldKey})`);
    }
  }

  /**
   * Get field by key
   */
  getFieldByKey(fieldKey: string): JobField | null {
    if (!this.jobFields) return null;

    // Search through all sections
    const searchInSection = (section: any): JobField | null => {
      if (!section) return null;
      if (Array.isArray(section)) {
        return section.find((f: JobField) => this.getFieldKey(f.name) === fieldKey) || null;
      }
      for (const subsection of Object.values(section)) {
        if (Array.isArray(subsection)) {
          const field = subsection.find((f: JobField) => this.getFieldKey(f.name) === fieldKey);
          if (field) return field;
        }
      }
      return null;
    };

    if (this.jobFields['Personal Details']) {
      const field = searchInSection(this.jobFields['Personal Details']);
      if (field) return field;
    }
    if (this.jobFields['Professional Details']) {
      const field = searchInSection(this.jobFields['Professional Details']);
      if (field) return field;
    }
    if (this.jobFields.Attachments?.links) {
      const field = this.jobFields.Attachments.links.find(f => this.getFieldKey(f.name) === fieldKey);
      if (field) return field;
    }

    return null;
  }

  /**
   * Get all fields from a section
   */
  getSectionFields(sectionName: string, subsectionName?: string): JobField[] {
    if (!this.jobFields) return [];

    const section = this.jobFields[sectionName];
    if (!section) return [];

    if (subsectionName && typeof section === 'object' && !Array.isArray(section)) {
      return section[subsectionName] || [];
    }

    if (Array.isArray(section)) {
      return section;
    }

    return [];
  }

  /**
   * Get display value for a field
   */
  getFieldDisplayValue(fieldKey: string): string {
    const control = this.applicationForm.get(fieldKey);
    return control?.value || '';
  }

  /**
   * Check if field is a dropdown (only specific field names that should be dropdowns)
   */
  isDropdownField(field: JobField): boolean {
    // Only these specific fields should be dropdowns
    const dropdownFields = ['Gender', 'Graduation Year'];
    return dropdownFields.includes(field.name);
  }

  /**
   * Get input type for a field
   */
  getInputTypeForField(field: JobField): string {
    // Use the type from the response directly, but ensure it's a valid HTML input type
    const validInputTypes = ['text', 'email', 'tel', 'number', 'url', 'date', 'datetime-local', 'month', 'time', 'week', 'password', 'search'];

    // If the field type is a valid HTML input type, use it directly
    if (validInputTypes.includes(field.type?.toLowerCase())) {
      return field.type.toLowerCase();
    }

    // Map common type names to HTML input types
    switch (field.type?.toLowerCase()) {
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  }

  /**
   * Get autocomplete attribute for a field
   */
  getAutocompleteForField(field: JobField): string {
    const name = field.name.toLowerCase();
    if (name.includes('name')) return 'name';
    if (name.includes('email')) return 'email';
    if (name.includes('phone')) return 'tel';
    if (name.includes('country')) return 'country-name';
    if (name.includes('city')) return 'address-level2';
    if (name.includes('state') || name.includes('province')) return 'address-level1';
    if (name.includes('company')) return 'organization';
    if (name.includes('title')) return 'organization-title';
    if (name.includes('url') || name.includes('link')) return 'url';
    if (name.includes('birth') || name.includes('age')) return 'bday';
    return '';
  }

  /**
   * Get inputmode for a field
   */
  getInputModeForField(field: JobField): string {
    switch (field.type) {
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      case 'number':
        return 'numeric';
      case 'url':
        return 'url';
      default:
        return 'text';
    }
  }

  /**
   * Get error message for a field
   */
  getFieldErrorMessage(fieldKey: string, field: JobField): string {
    const control = this.applicationForm.get(fieldKey);
    if (!control || !control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return `${field.name} is required`;
    }
    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control.hasError('invalidUrl')) {
      return `Please enter a valid ${field.name} URL (must start with http:// or https://)`;
    }
    if (control.hasError('pattern')) {
      return `Please enter a valid ${field.name}`;
    }

    return `${field.name} is invalid`;
  }

  /**
   * Get all personal details subsections
   */
  getPersonalDetailsSubsections(): { name: string; fields: JobField[] }[] {
    if (!this.jobFields?.['Personal Details']) return [];

    const personalDetails = this.jobFields['Personal Details'];
    const subsections: { name: string; fields: JobField[] }[] = [];

    if (personalDetails['Basic Info']) {
      subsections.push({ name: 'Basic Info', fields: personalDetails['Basic Info'] });
    }
    if (personalDetails['Education Details']) {
      subsections.push({ name: 'Education Details', fields: personalDetails['Education Details'] });
    }
    if (personalDetails['Address Information']) {
      subsections.push({ name: 'Address Information', fields: personalDetails['Address Information'] });
    }

    return subsections;
  }

  /**
   * Get all professional details subsections
   */
  getProfessionalDetailsSubsections(): { name: string; fields: JobField[] }[] {
    if (!this.jobFields?.['Professional Details']) return [];

    const professionalDetails = this.jobFields['Professional Details'];
    const subsections: { name: string; fields: JobField[] }[] = [];

    if (professionalDetails['Salary Information']) {
      subsections.push({ name: 'Salary Information', fields: professionalDetails['Salary Information'] });
    }
    if (professionalDetails['Current Job Information']) {
      subsections.push({ name: 'Current Job Information', fields: professionalDetails['Current Job Information'] });
    }

    return subsections;
  }

  /**
   * Get attachment files
   */
  getAttachmentFiles(): JobField[] {
    return this.jobFields?.Attachments?.files || [];
  }

  /**
   * Get attachment links
   */
  getAttachmentLinks(): JobField[] {
    return this.jobFields?.Attachments?.links || [];
  }

  /**
   * Check if field should be full width (typically first field in a section)
   */
  shouldFieldBeFullWidth(field: JobField, index: number, fields: JobField[]): boolean {
    // Make first field full width, or fields with long names
    return index === 0 || field.name.length > 20;
  }

  /**
   * Generate dynamic placeholder for a field
   */
  getPlaceholderForField(field: JobField): string {
    return `Enter your ${field.name.toLowerCase()}`;
  }

  /**
   * Group fields into rows (2 fields per row, or full width for first field)
   */
  groupFieldsIntoRows(fields: JobField[]): JobField[][] {
    const rows: JobField[][] = [];
    let currentRow: JobField[] = [];

    fields.forEach((field, index) => {
      // First field or fields with long names go full width
      if (index === 0 || field.name.length > 20) {
        if (currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [];
        }
        rows.push([field]); // Full width row
      } else {
        currentRow.push(field);
        if (currentRow.length === 2) {
          rows.push(currentRow);
          currentRow = [];
        }
      }
    });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }

  /**
   * Get dropdown state
   */
  private getDropdownState(fieldKey: string): boolean {
    return this.dropdownStates[fieldKey] || false;
  }

  /**
   * Get dropdown options for a field
   */
  getDropdownOptions(fieldKey: string): string[] {
    // Handle special cases
    if (fieldKey === 'gender') {
      return this.genderOptions;
    }
    if (fieldKey === 'graduationyear') {
      return this.getGraduationYears().map(year => year.toString());
    }
    // For other fields, return empty array (can be extended later)
    return [];
  }

  /**
   * Navigate dropdown with arrow keys
   */
  private navigateDropdown(fieldKey: string, direction: 'up' | 'down', options: string[], currentValue: string): void {
    const currentIndex = options.indexOf(currentValue);
    let newIndex: number;

    if (direction === 'down') {
      newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    }

    const newValue = options[newIndex];
    if (newValue) {
      this.selectOption(fieldKey, newValue);
      this.focusDropdownItem(fieldKey, newValue);
    }
  }

  /**
   * Focus a specific dropdown item
   */
  private focusDropdownItem(fieldKey: string, value: string): void {
    // This will be handled by the template using focus management
    setTimeout(() => {
      const element = document.querySelector(`[data-dropdown="${fieldKey}"][data-value="${value}"]`) as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 0);
  }

  /**
   * Get ARIA invalid state for form control
   */
  getAriaInvalid(controlName: string): boolean {
    const control = this.applicationForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Get ARIA required state for form control
   */
  getAriaRequired(controlName: string): boolean {
    const control = this.applicationForm.get(controlName);
    return !!(control && control.hasError('required'));
  }

  /**
   * Get error message ID for aria-describedby
   */
  getErrorId(controlName: string): string {
    return `${controlName}-error`;
  }

  /**
   * Get help text ID for aria-describedby
   */
  getHelpId(controlName: string): string {
    return `${controlName}-help`;
  }

  /**
   * URL validator function
   */
  static urlValidator(control: any) {
    if (!control.value || control.value.trim() === '') {
      return null; // Optional field, empty is valid
    }

    try {
      const url = new URL(control.value);
      // Check if it's http or https
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return null; // Valid URL
      }
      return { invalidUrl: true };
    } catch {
      return { invalidUrl: true };
    }
  }

  /**
   * Get email validation error message
   */
  getEmailErrorMessage(): string {
    const emailControl = this.applicationForm.get('email');
    if (!emailControl || !emailControl.touched || emailControl.valid) {
      return '';
    }

    if (emailControl.hasError('required')) {
      return 'Email is required';
    }

    if (emailControl.hasError('email')) {
      return 'Please enter a valid email address';
    }

    return 'Valid email is required';
  }

  /**
   * Get URL validation error message
   */
  getUrlErrorMessage(controlName: 'github' | 'portfolio' | 'linkedin'): string {
    const urlControl = this.applicationForm.get(controlName);
    if (!urlControl || !urlControl.touched || urlControl.valid) {
      return '';
    }

    if (urlControl.hasError('invalidUrl')) {
      const fieldName = controlName === 'github' ? 'GitHub' : controlName === 'portfolio' ? 'Portfolio' : 'LinkedIn';
      return `Please enter a valid ${fieldName} URL (must start with http:// or https://)`;
    }

    return '';
  }

  /**
   * Get form validation summary for screen readers
   */
  getFormValidationSummary(): string {
    if (!this.applicationForm.touched) {
      return '';
    }

    const errors: string[] = [];
    Object.keys(this.applicationForm.controls).forEach(key => {
      const control = this.applicationForm.get(key);
      if (control && control.invalid && control.touched) {
        if (key === 'email') {
          // Use dynamic email error message
          const emailError = this.getEmailErrorMessage();
          if (emailError) {
            errors.push(emailError);
          }
        } else {
          const label = this.getFieldLabel(key);
          errors.push(`${label} is required`);
        }
      }
    });

    if (errors.length > 0) {
      return `Form has ${errors.length} error${errors.length > 1 ? 's' : ''}: ${errors.join(', ')}`;
    }

    return '';
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full name',
      email: 'Email',
      phoneNumber: 'Phone number',
      gender: 'Gender',
      age: 'Age',
      university: 'University',
      department: 'Department',
      major: 'Major',
      graduationYear: 'Graduation year',
      country: 'Country',
      city: 'City',
      stateProvince: 'State or Province'
    };
    return labels[controlName] || controlName;
  }

  /**
   * Announce to screen readers
   */
  announceToScreenReader(message: string): void {
    this.screenReaderAnnouncement = message;
    setTimeout(() => {
      this.screenReaderAnnouncement = '';
    }, 1000);
  }

  /**
   * Convert dropdown value to number (for Gender field)
   */
  private convertDropdownValueToNumber(fieldName: string, value: string): number | string {
    if (fieldName === 'Gender') {
      const genderMap: { [key: string]: number } = {
        'Male': 1,
        'Female': 2,
        'Other': 3
      };
      return genderMap[value] || value;
    }
    return value;
  }

  /**
   * Convert form value to API format based on field type
   */
  private convertFormValueToAPIFormat(field: JobField, value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Convert dropdown values
    if (this.isDropdownField(field)) {
      return this.convertDropdownValueToNumber(field.name, value);
    }

    // Normalize phone numbers (remove spaces)
    if (field.type === 'phone' || /phone/i.test(field.name)) {
      return this.normalizePhoneNumber(value);
    }

    // Convert number fields
    if (field.type === 'number') {
      const numValue = Number(value);
      return isNaN(numValue) ? value : numValue;
    }

    return value;
  }

  /**
   * Build application_content structure from form values
   */
  private buildApplicationContent(): any {
    if (!this.jobFields || !this.applicationForm) {
      return {};
    }

    const applicationContent: any = {};

    // Process Personal Details
    if (this.jobFields['Personal Details']) {
      const personalDetails: any = {};
      const pd = this.jobFields['Personal Details'];

      if (pd['Basic Info']) {
        personalDetails['Basic Info'] = pd['Basic Info'].map(field => {
          const fieldKey = this.getFieldKey(field.name);
          const value = this.applicationForm.get(fieldKey)?.value;
          return {
            ...field,
            value: this.convertFormValueToAPIFormat(field, value)
          };
        });
      }

      if (pd['Education Details']) {
        personalDetails['Education Details'] = pd['Education Details'].map(field => {
          const fieldKey = this.getFieldKey(field.name);
          const value = this.applicationForm.get(fieldKey)?.value;
          return {
            ...field,
            value: this.convertFormValueToAPIFormat(field, value)
          };
        });
      }

      if (pd['Address Information']) {
        personalDetails['Address Information'] = pd['Address Information'].map(field => {
          const fieldKey = this.getFieldKey(field.name);
          const value = this.applicationForm.get(fieldKey)?.value;
          return {
            ...field,
            value: this.convertFormValueToAPIFormat(field, value)
          };
        });
      }

      if (Object.keys(personalDetails).length > 0) {
        applicationContent['Personal Details'] = personalDetails;
      }
    }

    // Process Professional Details
    if (this.jobFields['Professional Details']) {
      const professionalDetails: any = {};
      const pd = this.jobFields['Professional Details'];

      if (pd['Salary Information']) {
        professionalDetails['Salary Information'] = pd['Salary Information'].map(field => {
          const fieldKey = this.getFieldKey(field.name);
          const value = this.applicationForm.get(fieldKey)?.value;
          return {
            ...field,
            value: this.convertFormValueToAPIFormat(field, value)
          };
        });
      }

      if (pd['Current Job Information']) {
        professionalDetails['Current Job Information'] = pd['Current Job Information'].map(field => {
          const fieldKey = this.getFieldKey(field.name);
          const value = this.applicationForm.get(fieldKey)?.value;
          return {
            ...field,
            value: this.convertFormValueToAPIFormat(field, value)
          };
        });
      }

      if (Object.keys(professionalDetails).length > 0) {
        applicationContent['Professional Details'] = professionalDetails;
      }
    }

    // Process Attachments
    const attachments: any = {};

    // CV file
    if (this.cvUploadedFileName) {
      const cvField = this.jobFields.Attachments?.files?.find(f => f.name === 'CV');
      if (cvField) {
        attachments.files = [{
          ...cvField,
          value: this.cvUploadedFileName
        }];
      }
    }

    // Other attachment files
    if (this.jobFields.Attachments?.files) {
      const otherFiles = this.jobFields.Attachments.files.filter(f => f.name !== 'CV');
      if (otherFiles.length > 0) {
        if (!attachments.files) attachments.files = [];
        otherFiles.forEach(field => {
          const uploadedFile = this.uploadedAttachments.find(a => a.name === field.name);
          // Use the file name - if files need to be uploaded first, this will need enhancement
          attachments.files.push({
            ...field,
            value: uploadedFile ? uploadedFile.file.name : null
          });
        });
      }
    }

    // Links
    if (this.jobFields.Attachments?.links) {
      attachments.links = this.jobFields.Attachments.links.map(field => {
        const fieldKey = this.getFieldKey(field.name);
        const value = this.applicationForm.get(fieldKey)?.value;
        return {
          ...field,
          value: this.convertFormValueToAPIFormat(field, value)
        };
      });
    }

    if (Object.keys(attachments).length > 0) {
      applicationContent['Attachments'] = attachments;
    }

    return applicationContent;
  }

  /**
   * Build request data for submission
   */
  private buildRequestData(): any {
    const applicationContent = this.buildApplicationContent();

    return {
      request_data: {
        job_id: this.jobId ? parseInt(this.jobId, 10) : null,
        evaluation_id: this.uploadedEvaluationId ?? 1, // Use uploaded evaluation_id if available
        application_content: applicationContent
      }
    };
  }

  /**
   * Clear the form and reset all form-related state
   */
  private clearForm(): void {
    // Reset form
    this.applicationForm.reset();

    // Clear file uploads
    this.resumeFile = null;
    this.cvUploadedFileName = null;
    this.uploadedAttachments = [];
    this.uploadedEvaluationId = null;

    // Reset error messages
    this.errorMessage = '';
    this.formErrorsAnnouncement = '';
    this.screenReaderAnnouncement = '';
  }

  /**
   * Handle form submission with accessibility
   */
  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.applicationForm.controls).forEach(key => {
      this.applicationForm.get(key)?.markAsTouched();
    });

    // Check if form is valid and resume is uploaded
    if (this.applicationForm.valid && this.resumeFile) {
      // Ensure CV filename is available (use original filename as fallback)
      if (!this.cvUploadedFileName && this.resumeFile) {
        this.cvUploadedFileName = this.resumeFile.name;
      }

      if (!this.cvUploadedFileName) {
        this.formErrorsAnnouncement = 'CV filename is missing. Please upload your resume again.';
        this.announceToScreenReader(this.formErrorsAnnouncement);
        return;
      }

      this.isSubmitting = true;
      this.applicationForm.disable();

      const requestData = this.buildRequestData();

      this.jobBoardService.submitApplication(requestData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.applicationForm.enable();
          this.announceToScreenReader('Application submitted successfully');

          // Clear the form and uploaded files (interceptor will show success message)
          this.clearForm();
          // TODO: Navigate to success page or show success modal
          // this.router.navigate(['/careers/application-success']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.applicationForm.enable();
          console.error('Error submitting application:', error);

          const errorMessage = error.error?.message;
          this.formErrorsAnnouncement = errorMessage;
          this.announceToScreenReader(errorMessage);
          // Interceptor will handle showing the error message, so don't show it twice
        }
      });
    } else {
      // Build comprehensive error message
      let errorMessage = this.getFormValidationSummary();

      if (!this.resumeFile) {
        const resumeError = 'Please upload your resume';
        errorMessage = errorMessage
          ? `${errorMessage}. ${resumeError}`
          : resumeError;
      }

      this.formErrorsAnnouncement = errorMessage || 'Please fill in all required fields and upload your resume';
      this.announceToScreenReader(this.formErrorsAnnouncement);

      // Focus and scroll to first invalid field
      const firstInvalidField = Object.keys(this.applicationForm.controls).find(key => {
        const control = this.applicationForm.get(key);
        return control && control.invalid && control.touched;
      });

      if (firstInvalidField) {
        setTimeout(() => {
          const element = document.getElementById(firstInvalidField);
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else if (!this.resumeFile) {
        // If no form field errors but resume is missing, scroll to resume section
        setTimeout(() => {
          const resumeSection = document.getElementById('resume-upload');
          if (resumeSection) {
            resumeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }

  private normalizePhoneNumber(phone: string): string {
    return typeof phone === 'string' ? phone.replace(/\s+/g, '') : phone;
  }
}
