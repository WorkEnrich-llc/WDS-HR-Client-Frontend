import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { SkelatonLoadingComponent } from '../../../shared/skelaton-loading/skelaton-loading.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from '../../../shared/table/table.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { IntegrationsService } from '../../../../core/services/admin-settings/integrations/integrations.service';
import { IntegrationFeaturesFacadeService, FeatureItem } from '../../../../core/services/admin-settings/integrations/integration-features.facade.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-create-integration',
    imports: [CommonModule, PageHeaderComponent, SkelatonLoadingComponent, OverlayFilterBoxComponent, TableComponent, FormsModule, ReactiveFormsModule],
    templateUrl: './create-integration.component.html',
    styleUrls: ['./create-integration.component.css']
})
export class CreateIntegrationComponent implements OnInit, OnDestroy {
    private integrationsService = inject(IntegrationsService);
    private router = inject(Router);
    private toasterService = inject(ToasterMessageService);
    private formBuilder = inject(FormBuilder);
    private featuresFacade = inject(IntegrationFeaturesFacadeService);

    @ViewChild('serviceFilterBox') serviceFilterBox!: OverlayFilterBoxComponent;

    // Form
    integrationForm!: FormGroup;
    isSubmitting: boolean = false;

    // Tab management
    currentTab: string = 'main-info';

    // Today's date for display
    todayFormatted: string = '';

    // Flag to differentiate between create and update views in shared template
    isUpdate: boolean = false;
    isLoadingDetails: boolean = false;

    // Feature selection (first table)
    availableFeatures: any[] = [];
    currentViewingFeature: any = null; // Feature currently being viewed/edited in overlay
    lastViewedFeature: any = null; // Track last viewed feature for better UX when reopening
    isLoadingFeatures: boolean = false;
    featureSearchTerm: string = '';

    // Items table (second table) - for currently viewing feature
    featureItems: FeatureItem[] = [];
    selectedItems: FeatureItem[] = [];
    isLoadingItems: boolean = false;
    itemsSearchTerm: string = '';
    itemsCurrentPage: number = 1;
    itemsPerPage: number = 10;
    itemsTotalItems: number = 0;

    // Sections special case - departments and sections
    departments: FeatureItem[] = [];
    selectedDepartment: FeatureItem | null = null;
    sections: FeatureItem[] = [];
    selectedSections: FeatureItem[] = [];
    isLoadingDepartments: boolean = false;
    isLoadingSections: boolean = false;
    departmentsSearchTerm: string = '';
    sectionsSearchTerm: string = '';

    // Multiple selected services (for summary table)
    selectedServices: Array<{
        feature: any;
        items?: FeatureItem[];
        sections?: FeatureItem[];
        department?: FeatureItem;
        isAllSelected?: boolean;
    }> = [];

    // Service selection validation
    showServiceError: boolean = false;

    // Subscriptions for cleanup
    private featuresSubscription?: Subscription;
    private itemsSubscription?: Subscription;
    private createSubscription?: Subscription;
    private departmentsSubscription?: Subscription;
    private sectionsSubscription?: Subscription;

    // Breadcrumb data
    breadcrumb = [
        { label: 'Admin Settings', link: '/cloud' },
        { label: 'Integration', link: '/integrations' },
        { label: 'Create Integration' }
    ];

    ngOnInit(): void {
        this.initializeForm();
        this.setTodayFormatted();
        this.loadIntegrationFeatures();
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
        if (this.itemsSubscription) {
            this.itemsSubscription.unsubscribe();
            this.itemsSubscription = undefined;
        }
        if (this.createSubscription) {
            this.createSubscription.unsubscribe();
            this.createSubscription = undefined;
        }
        if (this.departmentsSubscription) {
            this.departmentsSubscription.unsubscribe();
            this.departmentsSubscription = undefined;
        }
        if (this.sectionsSubscription) {
            this.sectionsSubscription.unsubscribe();
            this.sectionsSubscription = undefined;
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
     * Open service filter overlay
     */
    openServiceFilter(): void {
        // Reset search terms
        this.featureSearchTerm = '';
        this.itemsSearchTerm = '';
        this.departmentsSearchTerm = '';
        this.sectionsSearchTerm = '';
        
        this.serviceFilterBox.openOverlay();
        this.loadIntegrationFeatures();
        
        // Smart UX: Auto-restore view if there are existing selections
        if (this.selectedServices.length > 0) {
            // Try to restore the last viewed feature, or default to first selected service
            const featureToRestore = this.lastViewedFeature || 
                this.availableFeatures.find(f => this.isFeatureInSelectedServices(f.name)) ||
                (this.selectedServices.length > 0 ? this.selectedServices[0].feature : null);
            
            if (featureToRestore) {
                // Small delay to ensure overlay is fully open and features are loaded
                setTimeout(() => {
                    this.selectFeature(featureToRestore);
                }, 100);
            }
        } else {
            // No selections yet, clear viewing state
            this.currentViewingFeature = null;
            this.selectedItems = [];
            this.selectedSections = [];
            this.selectedDepartment = null;
            this.featureItems = [];
            this.departments = [];
            this.sections = [];
        }
    }

    /**
     * Close service filter overlay
     */
    closeServiceFilter(): void {
        // Save any pending selections before closing
        if (this.currentViewingFeature) {
            this.saveCurrentSelections();
        }
        this.serviceFilterBox.closeOverlay();
        // Reset search terms when closing
        this.featureSearchTerm = '';
        this.itemsSearchTerm = '';
        this.departmentsSearchTerm = '';
        this.sectionsSearchTerm = '';
    }

    /**
     * Confirm service selection and close overlay
     */
    confirmServiceSelection(): void {
        // Save current selections before closing
        if (this.currentViewingFeature) {
            this.saveCurrentSelections();
        }
        // Clear error if we have any selected services
        if (this.selectedServices.length > 0) {
            this.showServiceError = false;
        }
        this.serviceFilterBox.closeOverlay();
    }

    /**
     * Load integration features from API
     */
    loadIntegrationFeatures(): void {
        if (this.featuresSubscription) {
            this.featuresSubscription.unsubscribe();
        }

        this.isLoadingFeatures = true;
        this.featuresSubscription = this.integrationsService.getIntegrationFeatures().subscribe({
            next: (response) => {
                // Get features from object_info.features
                const features = (response?.data?.object_info?.features ?? []) as any[];

                // Map features to display objects
                this.availableFeatures = features.map((feature) => ({
                    name: feature?.name || 'Unknown Feature',
                    is_all: feature?.is_all || false,
                    values: feature?.values || []
                }));

                this.isLoadingFeatures = false;
            },
            error: (error) => {
                console.error('Error loading integration features:', error);
                this.isLoadingFeatures = false;
            }
        });
    }

    /**
     * Filter features based on search term
     */
    filterFeatures(): void {
        // Features are already loaded, just filter the display
    }

    /**
     * Get filtered features
     */
    getFilteredFeatures(): any[] {
        if (!this.featureSearchTerm.trim()) {
            return this.availableFeatures;
        }
        return this.availableFeatures.filter(feature =>
            feature.name.toLowerCase().includes(this.featureSearchTerm.toLowerCase())
        );
    }

    /**
     * Get departments list (helper for type safety)
     */
    getDepartmentsList(): FeatureItem[] {
        return this.departments;
    }

    /**
     * Check if department is selected
     */
    isDepartmentSelected(dept: FeatureItem): boolean {
        return this.selectedDepartment?.id === dept.id;
    }

    /**
     * Select a feature to view/edit
     */
    selectFeature(feature: any): void {
        // Set as current viewing feature and remember it
        this.currentViewingFeature = feature;
        this.lastViewedFeature = feature;
        
        // Clear current viewing state (will be restored if exists)
        this.selectedItems = [];
        this.featureItems = [];
        this.selectedDepartment = null;
        this.sections = [];
        this.selectedSections = [];

        // Check if this feature already has selections saved
        const existingService = this.selectedServices.find(s => s.feature.name === feature.name);
        if (existingService) {
            // Restore existing selections
            if (feature.name === 'Sections') {
                this.selectedDepartment = existingService.department || null;
                this.selectedSections = [...(existingService.sections || [])];
                if (this.selectedDepartment) {
                    // Load sections for the department
                    this.loadSectionsForDepartment(this.selectedDepartment.id);
                } else {
                    // Load departments list
                    this.loadDepartmentsForSections();
                }
            } else {
                // Restore selected items first (before loading, so they're ready)
                const existingItems = existingService.items || [];
                this.selectedItems = [...existingItems];
                // Load all items for this feature (will sync state after load)
                this.loadFeatureItems(feature.name);
            }
        } else {
            // No existing selections, load items for the selected feature
            if (feature.name === 'Sections') {
                this.loadDepartmentsForSections();
            } else {
                this.loadFeatureItems(feature.name);
            }
        }
    }

    /**
     * Check if a feature is already in selectedServices
     */
    isFeatureInSelectedServices(featureName: string): boolean {
        return this.selectedServices.some(s => s.feature.name === featureName);
    }

    /**
     * Get count of selected items for a feature
     */
    getFeatureSelectionCount(featureName: string): number {
        const service = this.selectedServices.find(s => s.feature.name === featureName);
        if (!service) return 0;
        
        if (featureName === 'Sections') {
            return (service.sections || []).length;
        } else {
            return (service.items || []).length;
        }
    }

    /**
     * Save current selections to selectedServices (called in real-time)
     */
    saveCurrentSelections(): void {
        if (!this.currentViewingFeature) return;

        const featureName = this.currentViewingFeature.name;
        const existingIndex = this.selectedServices.findIndex(s => s.feature.name === featureName);

        if (featureName === 'Sections') {
            if (this.selectedSections.length > 0 && this.selectedDepartment) {
                const serviceData = {
                    feature: this.currentViewingFeature,
                    sections: [...this.selectedSections],
                    department: this.selectedDepartment,
                    isAllSelected: this.isAllSectionsSelected()
                };
                if (existingIndex >= 0) {
                    this.selectedServices[existingIndex] = serviceData;
                } else {
                    this.selectedServices.push(serviceData);
                }
            } else if (existingIndex >= 0) {
                // Remove if no selections
                this.selectedServices.splice(existingIndex, 1);
            }
        } else {
            if (this.selectedItems.length > 0) {
                const serviceData = {
                    feature: this.currentViewingFeature,
                    items: [...this.selectedItems],
                    isAllSelected: this.isAllItemsSelected()
                };
                if (existingIndex >= 0) {
                    this.selectedServices[existingIndex] = serviceData;
                } else {
                    this.selectedServices.push(serviceData);
                }
            } else if (existingIndex >= 0) {
                // Remove if no selections
                this.selectedServices.splice(existingIndex, 1);
            }
        }
    }

    /**
     * Remove a service from selectedServices
     */
    removeService(featureName: string): void {
        const index = this.selectedServices.findIndex(s => s.feature.name === featureName);
        if (index >= 0) {
            this.selectedServices.splice(index, 1);
        }
    }

    /**
     * Load items for a feature
     */
    loadFeatureItems(featureName: string): void {
        if (this.itemsSubscription) {
            this.itemsSubscription.unsubscribe();
        }

        this.isLoadingItems = true;
        this.itemsSubscription = this.featuresFacade.loadFeatureItems(featureName, this.itemsSearchTerm).subscribe({
            next: (items) => {
                this.featureItems = items;
                this.itemsTotalItems = items.length;
                this.isLoadingItems = false;
            },
            error: (error) => {
                console.error('Error loading feature items:', error);
                this.isLoadingItems = false;
                this.featureItems = [];
            }
        });
    }

    /**
     * Load departments for sections
     */
    loadDepartmentsForSections(): void {
        if (this.departmentsSubscription) {
            this.departmentsSubscription.unsubscribe();
        }

        this.isLoadingDepartments = true;
        this.departmentsSubscription = this.featuresFacade.loadFeatureItems('Departments', this.departmentsSearchTerm).subscribe({
            next: (items) => {
                this.departments = items;
                this.isLoadingDepartments = false;
            },
            error: (error) => {
                console.error('Error loading departments:', error);
                this.isLoadingDepartments = false;
                this.departments = [];
            }
        });
    }

    /**
     * Select department for sections
     */
    selectDepartment(department: FeatureItem): void {
        this.selectedDepartment = department;
        this.sections = [];
        this.selectedSections = [];
        this.loadSectionsForDepartment(department.id);
    }

    /**
     * Load sections for selected department
     */
    loadSectionsForDepartment(departmentId: number): void {
        if (this.sectionsSubscription) {
            this.sectionsSubscription.unsubscribe();
        }

        this.isLoadingSections = true;
        this.sectionsSubscription = this.featuresFacade.loadSectionsForDepartment(departmentId).subscribe({
            next: (items) => {
                this.sections = items;
                this.isLoadingSections = false;
                
                // After loading, ensure selectedSections only contains sections that exist in the loaded list
                // This prevents issues when restoring selections
                if (this.selectedSections.length > 0) {
                    const validSectionIds = new Set(items.map((item: FeatureItem) => item.id));
                    this.selectedSections = this.selectedSections.filter(section => validSectionIds.has(section.id));
                    // Save updated selections if they changed
                    if (this.currentViewingFeature) {
                        this.saveCurrentSelections();
                    }
                }
            },
            error: (error) => {
                console.error('Error loading sections:', error);
                this.isLoadingSections = false;
                this.sections = [];
            }
        });
    }

    /**
     * Toggle item selection
     */
    toggleItemSelection(item: FeatureItem): void {
        const index = this.selectedItems.findIndex(i => i.id === item.id);
        if (index > -1) {
            this.selectedItems.splice(index, 1);
        } else {
            this.selectedItems.push(item);
        }
        // Save in real-time
        this.saveCurrentSelections();
    }

    /**
     * Toggle section selection
     */
    toggleSectionSelection(section: FeatureItem): void {
        const index = this.selectedSections.findIndex(s => s.id === section.id);
        if (index > -1) {
            this.selectedSections.splice(index, 1);
        } else {
            this.selectedSections.push(section);
        }
        // Save in real-time
        this.saveCurrentSelections();
    }

    /**
     * Select all items for current feature
     */
    toggleSelectAllItems(): void {
        if (this.isAllItemsSelected()) {
            // Deselect all
            this.selectedItems = [];
        } else {
            // Select all
            this.selectedItems = [...this.featureItems];
        }
        // Save in real-time
        this.saveCurrentSelections();
    }

    /**
     * Select all sections for current department
     */
    toggleSelectAllSections(): void {
        if (this.isAllSectionsSelected()) {
            // Deselect all
            this.selectedSections = [];
        } else {
            // Select all
            this.selectedSections = [...this.sections];
        }
        // Save in real-time
        this.saveCurrentSelections();
    }

    /**
     * Check if item is selected
     */
    isItemSelected(item: FeatureItem): boolean {
        return this.selectedItems.some(i => i.id === item.id);
    }

    /**
     * Check if section is selected
     */
    isSectionSelected(section: FeatureItem): boolean {
        return this.selectedSections.some(s => s.id === section.id);
    }

    /**
     * Check if all items are selected
     */
    isAllItemsSelected(): boolean {
        return this.featureItems.length > 0 && this.selectedItems.length === this.featureItems.length;
    }

    /**
     * Check if all sections are selected
     */
    isAllSectionsSelected(): boolean {
        return this.sections.length > 0 && this.selectedSections.length === this.sections.length;
    }

    /**
     * Get filtered items
     */
    getFilteredItems(): FeatureItem[] {
        if (!this.itemsSearchTerm.trim()) {
            return this.featureItems;
        }
        const search = this.itemsSearchTerm.toLowerCase();
        return this.featureItems.filter(item =>
            item.name?.toLowerCase().includes(search) ||
            item.code?.toLowerCase().includes(search)
        );
    }

    /**
     * Get filtered sections
     */
    getFilteredSections(): FeatureItem[] {
        if (!this.sectionsSearchTerm.trim()) {
            return this.sections;
        }
        const search = this.sectionsSearchTerm.toLowerCase();
        return this.sections.filter(section =>
            section.name?.toLowerCase().includes(search) ||
            section.code?.toLowerCase().includes(search)
        );
    }

    /**
     * Get items for current page
     */
    getItemsPage(): FeatureItem[] {
        const filtered = this.getFilteredItems();
        const start = (this.itemsCurrentPage - 1) * this.itemsPerPage;
        return filtered.slice(start, start + this.itemsPerPage);
    }

    /**
     * Get flattened list of selected items for table display
     */
    getSelectedItemsForTable(): Array<{ serviceName: string; itemName: string; serviceFeature: any; item: FeatureItem }> {
        const items: Array<{ serviceName: string; itemName: string; serviceFeature: any; item: FeatureItem }> = [];
        
        for (const service of this.selectedServices) {
            if (service.feature.name === 'Sections') {
                // For sections, add each section
                for (const section of (service.sections || [])) {
                    items.push({
                        serviceName: service.feature.name,
                        itemName: section.name,
                        serviceFeature: service.feature,
                        item: section
                    });
                }
            } else {
                // For other features, add each item
                for (const item of (service.items || [])) {
                    items.push({
                        serviceName: service.feature.name,
                        itemName: item.name,
                        serviceFeature: service.feature,
                        item: item
                    });
                }
            }
        }
        
        return items;
    }

    /**
     * Build features payload for API
     */
    buildFeaturesPayload(): any[] {
        return this.selectedServices.map(service => {
            const isAllSelected = service.isAllSelected || false;
            
            if (service.feature.name === 'Sections') {
                return {
                    name: service.feature.name,
                    is_all: isAllSelected,
                    values: isAllSelected ? [] : (service.sections?.map(s => s.id) || [])
                };
            } else {
                return {
                    name: service.feature.name,
                    is_all: isAllSelected,
                    values: isAllSelected ? [] : (service.items?.map(item => item.id) || [])
                };
            }
        });
    }

    /**
     * Handle form submission
     */
    onSubmit(): void {
        // Check if at least one service with items is selected
        if (this.selectedServices.length === 0) {
            this.showServiceError = true;
            if (this.currentTab !== 'access-apis') {
                this.setCurrentTab('access-apis');
            }
            return;
        }

        // Validate each selected service has items
        const hasInvalidService = this.selectedServices.some(service => {
            if (service.feature.name === 'Sections') {
                return !service.sections || service.sections.length === 0;
            } else {
                return !service.items || service.items.length === 0;
            }
        });

        if (hasInvalidService) {
            this.showServiceError = true;
            if (this.currentTab !== 'access-apis') {
                this.setCurrentTab('access-apis');
            }
            return;
        }

        if (this.integrationForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const formData = this.integrationForm.value;
            const noExpire = !formData.hasExpiryDate;

            const features = this.buildFeaturesPayload();

            const requestBody: any = {
                request_data: {
                    name: formData.name,
                    features: features,
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
     * Search items
     */
    onItemsSearch(): void {
        this.itemsCurrentPage = 1;
        if (this.currentViewingFeature && this.currentViewingFeature.name !== 'Sections') {
            this.loadFeatureItems(this.currentViewingFeature.name);
        }
    }

    /**
     * Search departments
     */
    onDepartmentsSearch(): void {
        this.loadDepartmentsForSections();
    }

    /**
     * Search sections
     */
    onSectionsSearch(): void {
        // Sections are already loaded, just filter
    }

    /**
     * Clear feature selection
     */
    clearFeatureSelection(): void {
        this.currentViewingFeature = null;
        this.selectedItems = [];
        this.featureItems = [];
        this.selectedDepartment = null;
        this.sections = [];
        this.selectedSections = [];
        this.showServiceError = false;
    }
}
