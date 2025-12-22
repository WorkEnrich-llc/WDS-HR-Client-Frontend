import { Component, inject, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { CompanyPolicyService } from '../../../../core/services/admin-settings/company-policy/company-policy.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-manage-company-policy',
  standalone: true,
  imports: [RouterModule, PageHeaderComponent, PopupComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './manage-company-policy.component.html',
  styleUrls: ['./manage-company-policy.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ManageCompanyPolicyComponent implements OnInit, OnDestroy {
  private companyPolicyService = inject(CompanyPolicyService);
  private toasterService = inject(ToasterMessageService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  policyForm!: FormGroup;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  errMsg: string = '';
  isModalOpen: boolean = false;
  isRemovePolicyModalOpen: boolean = false;
  policyIndexToRemove: number | null = null;
  originalPolicies: any[] = [];
  createdDate: string = '';
  updatedDate: string = '';

  breadcrumb = [
    { label: 'Admin Settings', link: '/cloud' },
    { label: 'Company Policy', link: '/company-policy' },
    { label: 'Edit Company Policy' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadPolicies();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Initialize the form with FormArray
   */
  initializeForm(): void {
    this.policyForm = this.fb.group({
      policies: this.fb.array([])
    });
  }

  /**
   * Get the policies FormArray
   */
  get policiesArray(): FormArray {
    return this.policyForm.get('policies') as FormArray;
  }

  /**
   * Create a policy form group
   */
  createPolicyFormGroup(policy?: any): FormGroup {
    return this.fb.group({
      id: [policy?.id || null],
      title: [policy?.title || '', [Validators.required]],
      body: [policy?.body || '', [Validators.required]],
      ranking: [policy?.ranking || null]
    });
  }

  /**
   * Load policies from API
   */
  loadPolicies(): void {
    this.isLoading = true;
    this.companyPolicyService.getCompanyPolicy().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.data && response.data.list_items) {
          const policies = response.data.list_items || [];
          this.originalPolicies = JSON.parse(JSON.stringify(policies));
          
          // Set dates from first policy if available
          if (policies.length > 0) {
            this.createdDate = this.formatDate(policies[0].created_at);
            this.updatedDate = this.formatDate(policies[0].updated_at);
          }

          // Clear existing form array
          while (this.policiesArray.length !== 0) {
            this.policiesArray.removeAt(0);
          }

          // Add policies to form array
          policies.forEach((policy: any) => {
            this.policiesArray.push(this.createPolicyFormGroup(policy));
          });

          // If no policies, add one empty section
          if (policies.length === 0) {
            this.addPolicySection();
          }
        } else {
          // If no policies, add one empty section
          this.addPolicySection();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching company policies:', error);
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to load company policies';
        this.toasterService.showError(errorMessage);
        // Add one empty section on error
        this.addPolicySection();
      }
    });
  }

  /**
   * Add a new policy section
   */
  addPolicySection(): void {
    this.policiesArray.push(this.createPolicyFormGroup());
  }

  /**
   * Open remove policy confirmation modal
   */
  openRemovePolicyModal(index: number): void {
    // Don't allow removing if only one policy remains
    if (this.policiesArray.length <= 1) {
      this.toasterService.showError('You must have at least one policy section.');
      return;
    }
    this.policyIndexToRemove = index;
    this.isRemovePolicyModalOpen = true;
  }

  /**
   * Close remove policy modal
   */
  closeRemovePolicyModal(): void {
    this.isRemovePolicyModalOpen = false;
    this.policyIndexToRemove = null;
  }

  /**
   * Get the title of the policy being removed
   */
  getPolicyTitleToRemove(): string {
    if (this.policyIndexToRemove === null) {
      return '';
    }
    const policyControl = this.policiesArray.at(this.policyIndexToRemove);
    const title = policyControl?.get('title')?.value || '';
    return title.trim() || 'this policy section';
  }

  /**
   * Get the remove policy confirmation message
   */
  getRemovePolicyMessage(): string {
    const title = this.getPolicyTitleToRemove();
    if (title && title !== 'this policy section') {
      return `Are you sure you want to remove "${title}"?`;
    }
    return 'Are you sure you want to remove this policy section?';
  }

  /**
   * Confirm and remove policy section
   */
  confirmRemovePolicy(): void {
    if (this.policyIndexToRemove !== null && this.policiesArray.length > 1) {
      this.policiesArray.removeAt(this.policyIndexToRemove);
      this.closeRemovePolicyModal();
    }
  }

  /**
   * Remove a policy section (kept for backward compatibility, but now opens modal)
   */
  removePolicySection(index: number): void {
    this.openRemovePolicyModal(index);
  }

  /**
   * Check if form has changed
   */
  get isChanged(): boolean {
    if (this.originalPolicies.length !== this.policiesArray.length) {
      return true;
    }

    for (let i = 0; i < this.policiesArray.length; i++) {
      const formPolicy = this.policiesArray.at(i).value;
      const originalPolicy = this.originalPolicies[i];

      if (!originalPolicy) {
        return true; // New policy added
      }

      if (
        formPolicy.title?.trim() !== originalPolicy.title ||
        formPolicy.body?.trim() !== originalPolicy.body
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Save changes
   */
  saveChanges(): void {
    if (!this.isChanged) {
      return;
    }

    // Validate all form controls
    this.policyForm.markAllAsTouched();
    if (this.policyForm.invalid) {
      this.errMsg = 'Please fill in all required fields.';
      this.toasterService.showError(this.errMsg);
      return;
    }

    this.isSubmitting = true;
    this.errMsg = '';

    // Get current form policies
    const currentPolicies = this.policiesArray.value;

    // Find deleted policies (policies that were in original but not in current form)
    const deletedPolicies = this.originalPolicies
      .filter(originalPolicy => {
        // Check if this original policy still exists in the form
        return !currentPolicies.some((currentPolicy: any) => currentPolicy.id === originalPolicy.id);
      })
      .map(policy => ({
        id: policy.id,
        record_type: 'delete',
        title: policy.title,
        body: policy.body,
        ranking: policy.ranking
      }));

    // Process current form policies (create/update)
    const policiesToSend = currentPolicies.map((policy: any, index: number) => {
      const hasId = policy.id !== null && policy.id !== undefined;
      const wasInOriginal = hasId && this.originalPolicies.some(orig => orig.id === policy.id);
      
      let recordType: string;
      if (!hasId) {
        recordType = 'create';
      } else if (wasInOriginal) {
        recordType = 'update';
      } else {
        recordType = 'update'; // Fallback for safety
      }

      return {
        id: policy.id || null,
        record_type: recordType,
        title: policy.title.trim(),
        body: policy.body.trim(),
        ranking: policy.ranking || (index + 1)
      };
    });

    // Combine all policies (create/update + delete)
    const allPolicies = [...policiesToSend, ...deletedPolicies];

    // Call API to save all policies
    this.companyPolicyService.updateCompanyPolicies(allPolicies).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.errMsg = '';
        this.toasterService.showSuccess('Company Policy updated successfully',"Updated Successfully");
        this.router.navigate(['/company-policy']);
      },
      error: (error) => {
        this.isSubmitting = false;
        const errorMessage = error?.error?.message || error?.error?.error || 'Failed to update company policies';
        this.errMsg = errorMessage;
        this.toasterService.showError(errorMessage);
      }
    });
  }

  /**
   * Open discard modal
   */
  openModal(): void {
    this.isModalOpen = true;
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
    this.router.navigate(['/company-policy']);
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
