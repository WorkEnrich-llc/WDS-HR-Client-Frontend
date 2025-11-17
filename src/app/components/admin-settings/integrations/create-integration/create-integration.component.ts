import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { SkelatonLoadingComponent } from '../../../shared/skelaton-loading/skelaton-loading.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { IntegrationsService } from '../../../../core/services/admin-settings/integrations/integrations.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-create-integration',
    imports: [CommonModule, PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, SkelatonLoadingComponent, FormsModule, ReactiveFormsModule],
    templateUrl: './create-integration.component.html',
    styleUrls: ['./create-integration.component.css']
})
export class CreateIntegrationComponent implements OnInit, OnDestroy {
    private integrationsService = inject(IntegrationsService);
    private router = inject(Router);
    private toasterService = inject(ToasterMessageService);
    private formBuilder = inject(FormBuilder);

    @ViewChild('serviceFilterBox') serviceFilterBox!: OverlayFilterBoxComponent;

    // Form
    integrationForm!: FormGroup;
    isSubmitting: boolean = false;

    // Tab management
    currentTab: string = 'main-info';

    // Today's date for display
    todayFormatted: string = '';

    // Access APIs tab data
    selectedServices: any[] = [];
    availableServices: any[] = [];
    filteredServices: any[] = [];
    searchTerm: string = '';
    selectedServicesSearchTerm: string = ''; // Search for selected services table
    selectedModule: string = 'All Modules';
    isLoadingServices: boolean = false;
    currentPage: number = 1;
    itemsPerPage: number = 10;
    totalServices: number = 0;

    // Table properties
    tableCurrentPage: number = 1;
    tableItemsPerPage: number = 10;
    tableTotalItems: number = 0;
    tableIsLoading: boolean = false;

    // Captured features keys for request
    featureKeys: string[] = [];

    // Flag to differentiate between create and update views in shared template
    isUpdate: boolean = false;
    isLoadingDetails: boolean = false;

    // Service selection validation
    showServiceError: boolean = false;

    // Subscriptions for cleanup
    private featuresSubscription?: Subscription;
    private createSubscription?: Subscription;

    // Breadcrumb data
    breadcrumb = [
        { label: 'Admin Settings', link: '/cloud' },
        { label: 'Integration', link: '/integrations' },
        { label: 'Create Integration' }
    ];

    ngOnInit(): void {
        this.initializeForm();
        this.setTodayFormatted();
    }

    ngOnDestroy(): void {
        this.unsubscribeAll();
    }

    /**
     * Unsubscribe from all active subscriptions
     */
    private unsubscribeAll(): void {
        if (this.featuresSubscription) {
            this.featuresSubscription.unsubscribe();
            this.featuresSubscription = undefined;
        }
        if (this.createSubscription) {
            this.createSubscription.unsubscribe();
            this.createSubscription = undefined;
        }
    }

    /**
     * Set today's date formatted
     */
    private setTodayFormatted(): void {
        const today = new Date();
        this.todayFormatted = today.toLocaleDateString('en-GB');
    }

    /**
     * Initialize the form
     */
    private initializeForm(): void {
        this.integrationForm = this.formBuilder.group({
            name: ['', [Validators.required]],
            startDate: ['', [Validators.required]],
            hasExpiryDate: [false],
            expiryDate: ['']
        });
    }

    /**
     * Get form controls for easy access
     */
    get f() {
        return this.integrationForm.controls;
    }

    /**
     * Set current tab
     */
    setCurrentTab(tab: string): void {
        this.currentTab = tab;
    }

    /**
     * Check if form is valid for next step
     */
    isFormValidForNext(): boolean {
        const nameControl = this.integrationForm.get('name');
        const startDateControl = this.integrationForm.get('startDate');
        const hasExpiryDate = this.integrationForm.get('hasExpiryDate')?.value;
        const expiryDateControl = this.integrationForm.get('expiryDate');

        // Name is required
        if (!nameControl?.value || nameControl?.errors) {
            return false;
        }

        // Start date is required
        if (!startDateControl?.value || startDateControl?.errors) {
            return false;
        }

        // If expiry date is checked, it must be valid
        if (hasExpiryDate && (!expiryDateControl?.value || expiryDateControl?.errors)) {
            return false;
        }

        return true;
    }

    /**
     * Go to next tab
     */
    goToNextTab(): void {
        // Mark name field as touched to show validation errors
        this.integrationForm.get('name')?.markAsTouched();
        this.integrationForm.get('startDate')?.markAsTouched();

        if (this.integrationForm.get('hasExpiryDate')?.value) {
            this.integrationForm.get('expiryDate')?.markAsTouched();
        }

        if (this.isFormValidForNext() && this.currentTab === 'main-info') {
            this.setCurrentTab('access-apis');
        }
    }

    /** Back to main-info from access-apis */
    goBackToMainInfo(): void {
        this.setCurrentTab('main-info');
    }

    /**
     * Handle form submission
     */
    onSubmit(): void {
        // Check if at least one service is selected
        if (this.selectedServices.length === 0) {
            this.showServiceError = true;
            // Scroll to the service section if we're not already there
            if (this.currentTab !== 'access-apis') {
                this.setCurrentTab('access-apis');
            }
            return;
        }

        if (this.integrationForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const formData = this.integrationForm.value;
            const noExpire = !formData.hasExpiryDate;

            const requestBody: any = {
                request_data: {
                    name: formData.name,
                    features: this.featureKeys ?? [],
                    start_at: formData.startDate,
                    no_expire: noExpire
                }
            };

            if (!noExpire) {
                requestBody.request_data.expires_at = formData.expiryDate;
            }

            this.createSubscription = this.integrationsService.createIntegration(requestBody).subscribe({
                next: () => {
                    this.toasterService.showSuccess('Integration created successfully.');
                    this.router.navigate(['/integrations']);
                },
                error: (error) => {
                    console.error('Error creating integration:', error);
                    this.toasterService.showError('Failed to create integration.');
                    this.isSubmitting = false;
                }
            });
        } else {
            this.integrationForm.markAllAsTouched();
        }
    }

    /**
     * Handle cancel action
     */
    onCancel(): void {
        this.router.navigate(['/integrations']);
    }

    /**
     * Handle expiry date checkbox change
     */
    onExpiryDateChange(): void {
        const hasExpiryDate = this.integrationForm.get('hasExpiryDate')?.value;
        const expiryDateControl = this.integrationForm.get('expiryDate');

        if (hasExpiryDate) {
            expiryDateControl?.setValidators([Validators.required]);
        } else {
            expiryDateControl?.clearValidators();
            expiryDateControl?.setValue('');
        }

        expiryDateControl?.updateValueAndValidity();
    }

    /**
     * Open service selection filter
     */
    openServiceFilter(): void {
        this.serviceFilterBox.openOverlay();
        this.currentPage = 1; // Reset to first page
        this.loadIntegrationFeatures();
    }

    /**
     * Close service selection filter
     */
    closeServiceFilter(): void {
        // Unsubscribe from features API call when closing modal
        if (this.featuresSubscription) {
            this.featuresSubscription.unsubscribe();
            this.featuresSubscription = undefined;
        }
        this.serviceFilterBox.closeOverlay();
        this.searchTerm = ''; // Reset modal search
        this.selectedModule = 'All Modules';
        this.currentPage = 1;
    }

    /**
     * Load integration features from API
     */
    loadIntegrationFeatures(): void {
        // Unsubscribe from previous call if exists
        if (this.featuresSubscription) {
            this.featuresSubscription.unsubscribe();
        }

        this.isLoadingServices = true;
        this.featuresSubscription = this.integrationsService.getIntegrationFeatures().subscribe({
            next: (response) => {
                // Get features from object_info.features
                const features = (response?.data?.object_info?.features ?? []) as any[];

                // Map features to service objects for display
                // Each feature has name property
                this.availableServices = features.map((feature, index) => ({
                    id: index + 1,
                    service: feature?.name || 'Unknown Feature',
                    featureKey: feature?.name || '', // Use name as key
                    selected: false
                }));

                this.filteredServices = this.availableServices;
                this.totalServices = this.availableServices.length;
                // capture features keys for request
                this.featureKeys = [];
                this.isLoadingServices = false;
            },
            error: (error) => {
                console.error('Error loading integration features:', error);
                this.isLoadingServices = false;
            }
        });
    }

    /**
     * Format feature name to add spaces between camelCase words
     * Note: This method is kept for backward compatibility but may not be needed
     * if the backend already provides formatted names
     */
    private formatFeatureName(feature: string): string {
        // Convert camelCase to space-separated words
        // e.g., "JobTitles" -> "Job Titles"
        return feature.replace(/([A-Z])/g, ' $1').trim();
    }

    /**
     * Filter services based on search term
     */
    filterServices(): void {
        let filtered = this.availableServices;

        // Filter by search term
        if (this.searchTerm.trim()) {
            filtered = filtered.filter(service =>
                service.service.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }

        this.filteredServices = filtered;
        this.totalServices = filtered.length;

        // Reset to page 1 when filtering
        this.currentPage = 1;

        // Ensure current page doesn't exceed available pages
        const maxPage = Math.ceil(this.totalServices / this.itemsPerPage);
        if (this.currentPage > maxPage && maxPage > 0) {
            this.currentPage = maxPage;
        }
    }

    /**
     * Get unique modules for filter dropdown
     */
    getUniqueModules(): string[] {
        const modules = [...new Set(this.availableServices.map(service => service.module))];
        return ['All Modules', ...modules];
    }

    /**
     * Toggle service selection
     */
    toggleServiceSelection(service: any): void {
        service.selected = !service.selected;
    }

    /**
     * Select all services on current page
     */
    selectAllServices(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageServices = this.filteredServices.slice(startIndex, endIndex);

        const allSelected = currentPageServices.every(service => service.selected);
        const targetState = !allSelected;
        currentPageServices.forEach(service => {
            service.selected = targetState;
        });
    }

    /**
     * Get services for current page
     */
    getCurrentPageServices(): any[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredServices.slice(startIndex, startIndex + this.itemsPerPage);
    }

    /**
     * Confirm service selection
     */
    confirmServiceSelection(): void {
        this.selectedServices = this.availableServices.filter(service => service.selected);
        // Update featureKeys based on selected services (use original featureKey)
        this.featureKeys = this.selectedServices.map(s => s.featureKey || s.service?.replace(/\s+/g, '') || '').filter(f => f);
        // Clear error if services are selected
        if (this.selectedServices.length > 0) {
            this.showServiceError = false;
        }
        this.updateTableData();
        this.closeServiceFilter();
    }

    /**
     * Remove selected service
     */
    removeService(service: any): void {
        const index = this.selectedServices.findIndex(s => s.id === service.id);
        if (index > -1) {
            this.selectedServices.splice(index, 1);
        }
        // Also remove from available services
        const availableIndex = this.availableServices.findIndex(s => s.id === service.id);
        if (availableIndex > -1) {
            this.availableServices[availableIndex].selected = false;
        }
        // Update featureKeys to stay in sync
        this.featureKeys = this.selectedServices.map(s => s.featureKey || s.service?.replace(/\s+/g, '') || '').filter(f => f);
        // Show error if no services remain
        if (this.selectedServices.length === 0) {
            this.showServiceError = true;
        }
        this.updateTableData();
    }

    /**
     * Get pagination info
     */
    getPaginationInfo(): string {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalServices);
        return `Showing ${start}-${end} from ${this.totalServices}`;
    }

    /**
     * Check if all services on current page are selected
     */
    isAllCurrentPageSelected(): boolean {
        const currentPageServices = this.getCurrentPageServices();
        return currentPageServices.length > 0 && currentPageServices.every(service => service.selected);
    }

    /**
     * Go to previous page
     */
    goToPreviousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    /**
     * Go to next page
     */
    goToNextPage(): void {
        const maxPage = Math.ceil(this.totalServices / this.itemsPerPage);
        if (this.currentPage < maxPage) {
            this.currentPage++;
        }
    }

    /**
     * Handle table page change
     */
    onTablePageChange(page: number): void {
        this.tableCurrentPage = page;
    }

    /**
     * Handle table items per page change
     */
    onTableItemsPerPageChange(itemsPerPage: number): void {
        this.tableItemsPerPage = itemsPerPage;
        this.tableCurrentPage = 1;
    }

    /**
     * Update table data when selected services change
     */
    updateTableData(): void {
        this.tableTotalItems = this.getFilteredSelectedServices().length;
        this.tableIsLoading = false;
    }

    /**
     * Filter selected services based on search term
     */
    filterSelectedServices(): void {
        this.tableCurrentPage = 1; // Reset to first page when searching
        this.updateTableData();
    }

    /**
     * Get filtered selected services based on search term
     */
    getFilteredSelectedServices(): any[] {
        if (!this.selectedServicesSearchTerm.trim()) {
            return this.selectedServices;
        }
        return this.selectedServices.filter(service =>
            service.service.toLowerCase().includes(this.selectedServicesSearchTerm.toLowerCase())
        );
    }

    /**
     * Get selected services for current page (with search filter applied)
     */
    getSelectedServicesPage(): any[] {
        const filtered = this.getFilteredSelectedServices();
        const start = (this.tableCurrentPage - 1) * this.tableItemsPerPage;
        return filtered.slice(start, start + this.tableItemsPerPage);
    }

    /**
     * Check if pagination should be shown (10 or more services)
     */
    shouldShowPagination(): boolean {
        return this.getFilteredSelectedServices().length >= 10;
    }

    /**
     * Check if modal pagination should be shown (10 or more available services)
     */
    shouldShowModalPagination(): boolean {
        return this.totalServices > 10;
    }
}
