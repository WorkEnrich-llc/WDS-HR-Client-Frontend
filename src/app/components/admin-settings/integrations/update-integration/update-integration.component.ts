import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { SkelatonLoadingComponent } from '../../../shared/skelaton-loading/skelaton-loading.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IntegrationsService } from 'app/core/services/admin-settings/integrations/integrations.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-update-integration',
    imports: [CommonModule, PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, SkelatonLoadingComponent, FormsModule, ReactiveFormsModule],
    templateUrl: '../create-integration/create-integration.component.html',
    styleUrls: ['../create-integration/create-integration.component.css']
})
export class UpdateIntegrationComponent implements OnInit, OnDestroy {
    private integrationsService = inject(IntegrationsService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private formBuilder = inject(FormBuilder);

    @ViewChild('serviceFilterBox') serviceFilterBox!: OverlayFilterBoxComponent;

    // Form
    integrationForm!: FormGroup;
    isSubmitting: boolean = false;
    isLoadingDetails: boolean = false;

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

    // Service selection validation
    showServiceError: boolean = false;

    // Subscriptions for cleanup
    private featuresSubscription?: Subscription;
    private updateSubscription?: Subscription;
    private detailsSubscription?: Subscription;

    // Breadcrumb data
    breadcrumb = [
        { label: 'Admin Settings', link: '/cloud' },
        { label: 'Integration', link: '/integrations' },
        { label: 'Update Integration' }
    ];

    private integrationId!: number;
    // Flag so shared template can show update-specific UI
    isUpdate: boolean = true;

    ngOnInit(): void {
        this.initializeForm();
        this.setTodayFormatted();
        this.integrationId = Number(this.route.snapshot.paramMap.get('id')) || 1;
        this.prefillFromDetails();
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
        if (this.updateSubscription) {
            this.updateSubscription.unsubscribe();
            this.updateSubscription = undefined;
        }
        if (this.detailsSubscription) {
            this.detailsSubscription.unsubscribe();
            this.detailsSubscription = undefined;
        }
    }

    private setTodayFormatted(): void {
        const today = new Date();
        this.todayFormatted = today.toLocaleDateString('en-GB');
    }

    private initializeForm(): void {
        this.integrationForm = this.formBuilder.group({
            name: ['', [Validators.required]],
            startDate: ['', [Validators.required]],
            hasExpiryDate: [false],
            expiryDate: ['']
        });
    }

    get f() {
        return this.integrationForm.controls;
    }

    setCurrentTab(tab: string): void {
        this.currentTab = tab;
    }

    isFormValidForNext(): boolean {
        const nameControl = this.integrationForm.get('name');
        const startDateControl = this.integrationForm.get('startDate');
        const hasExpiryDate = this.integrationForm.get('hasExpiryDate')?.value;
        const expiryDateControl = this.integrationForm.get('expiryDate');

        if (!nameControl?.value || nameControl?.errors) return false;
        if (!startDateControl?.value || startDateControl?.errors) return false;
        if (hasExpiryDate && (!expiryDateControl?.value || expiryDateControl?.errors)) return false;
        return true;
    }

    goToNextTab(): void {
        this.integrationForm.get('name')?.markAsTouched();
        this.integrationForm.get('startDate')?.markAsTouched();
        if (this.integrationForm.get('hasExpiryDate')?.value) {
            this.integrationForm.get('expiryDate')?.markAsTouched();
        }
        if (this.isFormValidForNext() && this.currentTab === 'main-info') {
            this.setCurrentTab('access-apis');
        }
    }

    goBackToMainInfo(): void {
        this.setCurrentTab('main-info');
    }

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
                    integration_id: this.integrationId,
                    name: formData.name,
                    features: this.featureKeys ?? [],
                    start_at: formData.startDate,
                    no_expire: noExpire
                }
            };

            if (!noExpire) {
                requestBody.request_data.expires_at = formData.expiryDate;
            }

            this.updateSubscription = this.integrationsService.updateIntegrationEntry(requestBody).subscribe({
                next: () => {
                    this.router.navigate(['/integrations']);
                },
                error: (error) => {
                    console.error('Error updating integration:', error);
                    this.isSubmitting = false;
                }
            });
        } else {
            this.integrationForm.markAllAsTouched();
        }
    }

    onCancel(): void {
        this.router.navigate(['/integrations']);
    }

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

    openServiceFilter(): void {
        this.serviceFilterBox.openOverlay();
        this.currentPage = 1; // Reset to first page
        this.loadIntegrationFeatures();
    }

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

    loadIntegrationFeatures(): void {
        // Unsubscribe from previous call if exists
        if (this.featuresSubscription) {
            this.featuresSubscription.unsubscribe();
        }

        this.isLoadingServices = true;
        this.featuresSubscription = this.integrationsService.getIntegrationFeatures().subscribe({
            next: (response) => {
                // Get features from object_info.features (simple array of strings)
                const features = (response?.data?.object_info?.features ?? []) as string[];

                // Map features to service objects for display
                this.availableServices = features.map((feature, index) => ({
                    id: index + 1,
                    service: this.formatFeatureName(feature),
                    featureKey: feature, // Keep original key for request
                    selected: false
                }));

                this.filteredServices = this.availableServices;
                this.totalServices = this.availableServices.length;
                // Do NOT override featureKeys here; keep from details
                this.isLoadingServices = false;
                this.applyPreselectedFeatures();
            },
            error: (error) => {
                console.error('Error loading integration features:', error);
                this.isLoadingServices = false;
            }
        });
    }

    /**
     * Format feature name to add spaces between camelCase words
     */
    private formatFeatureName(feature: string): string {
        // Convert camelCase to space-separated words
        // e.g., "JobTitles" -> "Job Titles"
        return feature.replace(/([A-Z])/g, ' $1').trim();
    }

    filterServices(): void {
        let filtered = this.availableServices;
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

    getUniqueModules(): string[] {
        // Module functionality removed
        return [];
    }

    toggleServiceSelection(service: any): void {
        service.selected = !service.selected;
    }

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

    getCurrentPageServices(): any[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredServices.slice(startIndex, startIndex + this.itemsPerPage);
    }

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

    removeService(service: any): void {
        const index = this.selectedServices.findIndex(s => s.id === service.id);
        if (index > -1) {
            this.selectedServices.splice(index, 1);
        }
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

    getPaginationInfo(): string {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalServices);
        return `Showing ${start}-${end} from ${this.totalServices}`;
    }

    /**
     * Go to previous page (overlay pagination controls)
     */
    goToPreviousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    /**
     * Go to next page (overlay pagination controls)
     */
    goToNextPage(): void {
        const maxPage = Math.ceil(this.totalServices / this.itemsPerPage);
        if (this.currentPage < maxPage) {
            this.currentPage++;
        }
    }

    isAllCurrentPageSelected(): boolean {
        const currentPageServices = this.getCurrentPageServices();
        return currentPageServices.length > 0 && currentPageServices.every(service => service.selected);
    }

    onTablePageChange(page: number): void {
        this.tableCurrentPage = page;
    }

    onTableItemsPerPageChange(itemsPerPage: number): void {
        this.tableItemsPerPage = itemsPerPage;
        this.tableCurrentPage = 1;
    }

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

    private prefillFromDetails(): void {
        // Unsubscribe from previous call if exists
        if (this.detailsSubscription) {
            this.detailsSubscription.unsubscribe();
        }

        this.isLoadingDetails = true;
        this.detailsSubscription = this.integrationsService.getIntegrationDetails(this.integrationId).subscribe({
            next: (response) => {
                const objectInfo = response?.data?.object_info;
                const subscription = response?.data?.subscription;
                const startsAt = objectInfo?.start_at || subscription?.created_at?.slice(0, 10) || '';
                const noExpire = objectInfo?.no_expire === true ? true : false;
                const expiresAt = objectInfo?.expires_at || '';

                this.integrationForm.patchValue({
                    name: objectInfo?.name || '',
                    startDate: startsAt,
                    hasExpiryDate: !noExpire,
                    expiryDate: !noExpire && expiresAt ? expiresAt : ''
                });

                // capture features keys from details - handle both possible structures
                let featuresList: string[] = [];
                if (Array.isArray(objectInfo?.features)) {
                    // If features is directly an array
                    featuresList = objectInfo.features;
                } else if (objectInfo?.features?.features && Array.isArray(objectInfo.features.features)) {
                    // If features is nested inside features object
                    featuresList = objectInfo.features.features;
                }
                this.featureKeys = featuresList;

                this.applyPreselectedFeatures();
                this.isLoadingDetails = false;
            },
            error: (err) => {
                console.error('Failed to load integration details', err);
                this.isLoadingDetails = false;
            }
        });
    }

    private applyPreselectedFeatures(): void {
        if (!this.featureKeys?.length) {
            this.selectedServices = [];
            this.updateTableData();
            return;
        }

        // Convert feature strings directly to service objects for display
        this.selectedServices = this.featureKeys.map((feature, index) => ({
            id: index + 1,
            service: this.formatFeatureName(feature),
            featureKey: feature,
            selected: true
        }));

        // Also mark them as selected in availableServices if they exist
        if (this.availableServices?.length) {
            const normalizedSet = new Set(this.featureKeys.map(f => (f || '').toString().toLowerCase().replace(/\s+/g, '')));
            this.availableServices.forEach(svc => {
                const normalized = (svc.featureKey || svc.service || '').toString().toLowerCase().replace(/\s+/g, '');
                if (normalizedSet.has(normalized)) {
                    svc.selected = true;
                }
            });
        }

        this.updateTableData();
    }
}


