import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { SkelatonLoadingComponent } from '../../../shared/skelaton-loading/skelaton-loading.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { IntegrationsService } from '../../../../core/services/admin-settings/integrations/integrations.service';
import { IntegrationFeaturesFacadeService, FeatureItem } from '../../../../core/services/admin-settings/integrations/integration-features.facade.service';
import { Subscription, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-create-integration',
    imports: [CommonModule, PageHeaderComponent, SkelatonLoadingComponent, OverlayFilterBoxComponent, TableComponent, PopupComponent, FormsModule, ReactiveFormsModule, NgxPaginationModule],
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
    @ViewChild('itemsFilterBox') itemsFilterBox!: OverlayFilterBoxComponent;

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
    selectedServicesForFirstOverlay: any[] = []; // Services selected in first overlay (before items)
    currentViewingFeature: any = null; // Feature currently being viewed/edited in overlay
    lastViewedFeature: any = null; // Track last viewed feature for better UX when reopening
    isLoadingFeatures: boolean = false;
    featureSearchTerm: string = '';

    // Service being edited in items overlay
    editingService: any = null;

    // Items table (second table) - for currently viewing feature
    featureItems: FeatureItem[] = [];
    selectedItems: FeatureItem[] = [];
    isLoadingItems: boolean = false;
    itemsSearchTerm: string = '';
    itemsCurrentPage: number = 1;
    itemsPerPage: number = 10;
    itemsTotalItems: number = 0;
    itemsTotalPages: number = 0;

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

    // Discard modal state
    isDiscardModalOpen: boolean = false;

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
     * Custom validator to check if name is not empty after trimming
     */
    private noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
        if (control.value && typeof control.value === 'string') {
            const trimmed = control.value.trim();
            if (trimmed.length === 0) {
                return { required: true };
            }
        }
        return null;
    }

    /**
     * Custom validator to check if expiry date is after start date
     */
    private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
        if (!this.integrationForm) {
            return null;
        }

        const startDate = this.integrationForm.get('startDate')?.value;
        const expiryDate = control.value;
        const hasExpiryDate = this.integrationForm.get('hasExpiryDate')?.value;

        // Only validate if expiry date checkbox is checked
        if (!hasExpiryDate) {
            return null;
        }

        // If expiry date is empty, don't validate here (required validator will handle it)
        if (!expiryDate) {
            return null;
        }

        // If start date is not set yet, don't validate
        if (!startDate) {
            return null;
        }

        // Compare dates
        const start = new Date(startDate);
        const expiry = new Date(expiryDate);
        
        // Set time to midnight for accurate date comparison
        start.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        if (expiry <= start) {
            return { dateRange: { message: 'Expiry date must be after start date' } };
        }

        return null;
    }

    /**
     * Custom validator to check if start date is before expiry date
     */
    private startDateValidator(control: AbstractControl): ValidationErrors | null {
        if (!this.integrationForm) {
            return null;
        }

        const startDate = control.value;
        const expiryDate = this.integrationForm.get('expiryDate')?.value;
        const hasExpiryDate = this.integrationForm.get('hasExpiryDate')?.value;

        // Only validate if expiry date checkbox is checked
        if (!hasExpiryDate) {
            return null;
        }

        // If start date is empty, don't validate here (required validator will handle it)
        if (!startDate) {
            return null;
        }

        // If expiry date is not set yet, don't validate
        if (!expiryDate) {
            return null;
        }

        // Compare dates
        const start = new Date(startDate);
        const expiry = new Date(expiryDate);
        
        // Set time to midnight for accurate date comparison
        start.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        if (start >= expiry) {
            return { startDateRange: { message: 'Start date must be before expiry date' } };
        }

        return null;
    }

    /**
     * Initialize the form
     */
    private initializeForm(): void {
        this.integrationForm = this.formBuilder.group({
            name: ['', [Validators.required, this.noWhitespaceValidator.bind(this)]],
            startDate: ['', [Validators.required, this.startDateValidator.bind(this)]],
            hasExpiryDate: [false],
            expiryDate: ['', [this.dateRangeValidator.bind(this)]]
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

        // Name is required and must not be only whitespace
        const nameValue = nameControl?.value;
        if (!nameValue || typeof nameValue !== 'string' || nameValue.trim().length === 0 || nameControl?.errors) {
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
     * For create mode, always return true (changes are always present in create mode)
     * This getter is used in the shared template with update component
     */
    get hasChanges(): boolean {
        return true;
    }

    /**
     * Open service filter overlay (first overlay - only services)
     */
    openServiceFilter(): void {
        // Reset search terms
        this.featureSearchTerm = '';

        // Initialize selectedServicesForFirstOverlay with currently selected services
        this.selectedServicesForFirstOverlay = this.selectedServices.map(s => s.feature);

        this.serviceFilterBox.openOverlay();
        this.loadIntegrationFeatures();
    }

    /**
     * Close service filter overlay
     */
    closeServiceFilter(): void {
        this.serviceFilterBox.closeOverlay();
        // Reset search terms when closing
        this.featureSearchTerm = '';
    }

    /**
     * Open items selection overlay for a specific service
     */
    openItemsSelection(service: any): void {
        this.editingService = service;
        this.currentViewingFeature = service.feature;

        // Reset search terms and pagination
        this.itemsSearchTerm = '';
        this.departmentsSearchTerm = '';
        this.sectionsSearchTerm = '';
        this.itemsCurrentPage = 1;

        // Restore existing selections
        if (service.feature.name === 'Sections') {
            this.selectedDepartment = service.department || null;
            this.selectedSections = [...(service.sections || [])];
            if (this.selectedDepartment) {
                this.loadSectionsForDepartment(this.selectedDepartment.id);
            } else {
                this.loadDepartmentsForSections();
            }
        } else {
            this.selectedItems = [...(service.items || [])];
            this.loadFeatureItems(service.feature.name);
        }

        this.itemsFilterBox.openOverlay();
    }

    /**
     * Close items filter overlay
     */
    closeItemsFilter(): void {
        this.itemsFilterBox.closeOverlay();
        // Reset state
        this.editingService = null;
        this.currentViewingFeature = null;
        this.selectedItems = [];
        this.selectedSections = [];
        this.selectedDepartment = null;
        this.itemsSearchTerm = '';
        this.departmentsSearchTerm = '';
        this.sectionsSearchTerm = '';
    }

    /**
     * Confirm items selection and close items overlay
     */
    confirmItemsSelection(): void {
        if (!this.editingService) return;

        // Save current selections to the editing service
        if (this.editingService.feature.name === 'Sections') {
            if (this.selectedSections.length > 0 && this.selectedDepartment) {
                this.editingService.sections = [...this.selectedSections];
                this.editingService.department = this.selectedDepartment;
                this.editingService.isAllSelected = this.isAllSectionsSelected();
            } else {
                // If no items selected, default to all
                this.editingService.sections = [];
                this.editingService.department = undefined;
                this.editingService.isAllSelected = true;
            }
        } else {
            if (this.selectedItems.length > 0) {
                this.editingService.items = [...this.selectedItems];
                this.editingService.isAllSelected = this.isAllItemsSelected();
            } else {
                // If no items selected, default to all
                this.editingService.items = [];
                this.editingService.isAllSelected = true;
            }
        }

        // Update selectedServices with the editing service
        const existingIndex = this.selectedServices.findIndex(s => s.feature.name === this.editingService.feature.name);
        if (existingIndex >= 0) {
            this.selectedServices[existingIndex] = { ...this.editingService };
        } else {
            this.selectedServices.push({ ...this.editingService });
        }

        this.closeItemsFilter();
    }

    /**
     * Toggle service selection in first overlay
     */
    toggleServiceSelection(feature: any): void {
        const index = this.selectedServicesForFirstOverlay.findIndex(f => f.name === feature.name);
        if (index > -1) {
            this.selectedServicesForFirstOverlay.splice(index, 1);
        } else {
            this.selectedServicesForFirstOverlay.push(feature);
        }
    }

    /**
     * Check if service is selected in first overlay
     */
    isServiceSelected(featureName: string): boolean {
        return this.selectedServicesForFirstOverlay.some(f => f.name === featureName);
    }

    /**
     * Confirm service selection and close overlay (first overlay)
     */
    confirmServiceSelection(): void {
        // Add selected services to selectedServices (without items yet - default to all)
        for (const feature of this.selectedServicesForFirstOverlay) {
            // Check if service already exists
            const existingIndex = this.selectedServices.findIndex(s => s.feature.name === feature.name);
            if (existingIndex === -1) {
                // Add new service without items - default to all selected
                this.selectedServices.push({
                    feature: feature,
                    items: [],
                    sections: [],
                    department: undefined,
                    isAllSelected: true  // Default to all if no items selected
                });
            }
        }

        // Remove services that were deselected
        this.selectedServices = this.selectedServices.filter(s =>
            this.selectedServicesForFirstOverlay.some(f => f.name === s.feature.name)
        );

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
     * Load items for a feature with pagination
     */
    loadFeatureItems(featureName: string): void {
        if (this.itemsSubscription) {
            this.itemsSubscription.unsubscribe();
        }

        this.isLoadingItems = true;
        this.itemsSubscription = this.featuresFacade.loadFeatureItems(featureName, this.itemsSearchTerm, this.itemsCurrentPage, this.itemsPerPage).pipe(
            switchMap((result) => {
                // If no items returned, fallback to employees
                if (!result.items || result.items.length === 0) {
                    return this.featuresFacade.loadFeatureItems('Employees', this.itemsSearchTerm, this.itemsCurrentPage, this.itemsPerPage);
                }
                return of(result);
            }),
            catchError((error) => {
                console.error('Error loading feature items, falling back to employees:', error);
                // On error, fallback to employees
                return this.featuresFacade.loadFeatureItems('Employees', this.itemsSearchTerm, this.itemsCurrentPage, this.itemsPerPage);
            })
        ).subscribe({
            next: (result) => {
                this.featureItems = result.items || [];
                this.itemsTotalItems = result.totalItems || 0;
                this.itemsTotalPages = Number(result.totalPages) || 1;
                this.itemsCurrentPage = Number(result.currentPage) || 1;
                this.isLoadingItems = false;

                // After loading, restore selected items from all pages
                // Get all currently selected item IDs (from all pages)
                const selectedItemIds = this.selectedItems.map((item: any) =>
                    typeof item === 'object' && item !== null ? item.id : item
                ).filter((id: any) => id !== null && id !== undefined);

                // For items on current page that are selected, update them with full object data
                // Keep items from other pages in selectedItems
                const currentPageSelectedItems = this.featureItems.filter((item: FeatureItem) =>
                    selectedItemIds.includes(item.id)
                );

                // Merge: keep items from other pages, update/add items from current page
                const otherPageSelectedItems = this.selectedItems.filter((item: any) => {
                    const itemId = typeof item === 'object' && item !== null ? item.id : item;
                    return !this.featureItems.some(fi => fi.id === itemId);
                });

                // Combine: items from other pages + items from current page
                this.selectedItems = [...otherPageSelectedItems, ...currentPageSelectedItems];
            },
            error: (error) => {
                console.error('Error loading feature items (including fallback):', error);
                this.isLoadingItems = false;
                this.featureItems = [];
                this.itemsTotalItems = 0;
                this.itemsTotalPages = 0;
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
        this.departmentsSubscription = this.featuresFacade.loadFeatureItems('Departments', this.departmentsSearchTerm, 1, 10000).subscribe({
            next: (result) => {
                this.departments = result.items || [];
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
                    // Don't save in real-time - only update on confirm
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
        // Don't save in real-time - only update on confirm
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
        // Don't save in real-time - only update on confirm
    }

    /**
     * Select all items for current feature
     */
    toggleSelectAllItems(): void {
        if (this.isAllItemsSelected()) {
            // Deselect all items from current page only
            const currentPageItemIds = this.featureItems.map(item => item.id);
            this.selectedItems = this.selectedItems.filter(item =>
                !currentPageItemIds.includes(item.id)
            );
        } else {
            // Select all items from current page, keeping items from other pages
            const currentPageItemIds = this.featureItems.map(item => item.id);
            // Remove any existing items from current page
            this.selectedItems = this.selectedItems.filter(item =>
                !currentPageItemIds.includes(item.id)
            );
            // Add all items from current page
            this.selectedItems = [...this.selectedItems, ...this.featureItems];
        }
        // Don't save in real-time - only update on confirm
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
        // Don't save in real-time - only update on confirm
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
     * Check if all items on current page are selected
     */
    isAllItemsSelected(): boolean {
        if (this.featureItems.length === 0) return false;
        // Check if all items on current page are selected
        return this.featureItems.every(item => this.isItemSelected(item));
    }

    /**
     * Check if all sections are selected
     */
    isAllSectionsSelected(): boolean {
        return this.sections.length > 0 && this.selectedSections.length === this.sections.length;
    }

    /**
     * Get filtered items - now server-side, so just return current items
     */
    getFilteredItems(): FeatureItem[] {
        return this.featureItems;
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
     * Get items for current page - now server-side, so just return current items
     */
    getItemsPage(): FeatureItem[] {
        return this.featureItems;
    }

    /**
     * Get list of selected services for table display
     */
    getSelectedServicesForTable(): Array<{ serviceName: string; count: number; service: any; isAllSelected: boolean }> {
        return this.selectedServices.map(service => {
            let count = 0;
            if (service.feature.name === 'Sections') {
                count = (service.sections || []).length;
            } else {
                count = (service.items || []).length;
            }
            return {
                serviceName: service.feature.name,
                count: count,
                service: service,
                isAllSelected: service.isAllSelected || false
            };
        });
    }

    /**
     * Get services with no items selected
     */
    getServicesWithNoItems(): string[] {
        return this.selectedServices
            .filter(service => {
                if (service.feature.name === 'Sections') {
                    return !service.sections || service.sections.length === 0;
                } else {
                    return !service.items || service.items.length === 0;
                }
            })
            .map(service => service.feature.name.toLowerCase());
    }

    /**
     * Get error message for service selection
     */
    getServiceErrorMessage(): string {
        if (this.selectedServices.length === 0) {
            return 'Please select at least one service to continue.';
        }
        return '';
    }

    /**
     * Build features payload for API
     */
    buildFeaturesPayload(): any[] {
        return this.selectedServices.map(service => {
            // Check if service has no items selected
            let hasNoItems = false;
            if (service.feature.name === 'Sections') {
                hasNoItems = !service.sections || service.sections.length === 0;
            } else {
                hasNoItems = !service.items || service.items.length === 0;
            }

            // Set is_all to true if no items selected or if explicitly marked as all selected
            const isAllSelected = service.isAllSelected || hasNoItems;

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
        // Check if at least one service is selected
        if (this.selectedServices.length === 0) {
            this.showServiceError = true;
            if (this.currentTab !== 'access-apis') {
                this.setCurrentTab('access-apis');
            }
            return;
        }

        // Clear service error if at least one service is selected
        this.showServiceError = false;

        if (this.integrationForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const formData = this.integrationForm.value;
            const noExpire = !formData.hasExpiryDate;

            const features = this.buildFeaturesPayload();

            const requestBody: any = {
                request_data: {
                    name: formData.name?.trim() || formData.name,
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
     * Handle cancel action - open discard modal
     */
    onCancel(): void {
        this.isDiscardModalOpen = true;
    }

    /**
     * Close discard modal
     */
    closeDiscardModal(): void {
        this.isDiscardModalOpen = false;
    }

    /**
     * Confirm discard action
     */
    confirmDiscard(): void {
        this.isDiscardModalOpen = false;
        this.router.navigate(['/integrations']);
    }

    /**
     * Handle expiry date checkbox change
     */
    onExpiryDateChange(): void {
        const hasExpiryDate = this.integrationForm.get('hasExpiryDate')?.value;
        const expiryDateControl = this.integrationForm.get('expiryDate');
        const startDateControl = this.integrationForm.get('startDate');

        if (hasExpiryDate) {
            expiryDateControl?.setValidators([Validators.required, this.dateRangeValidator.bind(this)]);
            startDateControl?.setValidators([Validators.required, this.startDateValidator.bind(this)]);
        } else {
            expiryDateControl?.clearValidators();
            expiryDateControl?.setValue('');
            startDateControl?.setValidators([Validators.required]);
        }

        expiryDateControl?.updateValueAndValidity();
        startDateControl?.updateValueAndValidity();
    }

    /**
     * Handle start date change
     */
    onStartDateChange(): void {
        const startDateControl = this.integrationForm.get('startDate');
        const expiryDateControl = this.integrationForm.get('expiryDate');
        
        // Update validators to re-check date range
        startDateControl?.updateValueAndValidity({ emitEvent: false });
        expiryDateControl?.updateValueAndValidity({ emitEvent: false });
    }

    /**
     * Handle expiry date input change
     */
    onExpiryDateInputChange(): void {
        const startDateControl = this.integrationForm.get('startDate');
        const expiryDateControl = this.integrationForm.get('expiryDate');
        
        // Update validators to re-check date range
        startDateControl?.updateValueAndValidity({ emitEvent: false });
        expiryDateControl?.updateValueAndValidity({ emitEvent: false });
    }

    /**
     * Get minimum date for expiry date (start date)
     */
    getMinExpiryDate(): string {
        const startDate = this.integrationForm.get('startDate')?.value;
        return startDate || '';
    }

    /**
     * Get maximum date for start date (expiry date)
     */
    getMaxStartDate(): string {
        const expiryDate = this.integrationForm.get('expiryDate')?.value;
        return expiryDate || '';
    }

    /**
     * Search items
     */
    /**
     * Handle items search - reset to page 1 and reload with server-side search
     */
    onItemsSearch(): void {
        this.itemsCurrentPage = 1;
        if (this.currentViewingFeature && this.currentViewingFeature.name !== 'Sections') {
            this.loadFeatureItems(this.currentViewingFeature.name);
        }
    }

    /**
     * Handle items page change
     */
    onItemsPageChange(page: number): void {
        // Ensure page is a number
        const pageNum = Number(page);
        const currentPageNum = Number(this.itemsCurrentPage);
        const totalPagesNum = Number(this.itemsTotalPages);

        // Prevent duplicate requests: check if page actually changed
        if (currentPageNum === pageNum) {
            return;
        }

        // Prevent requests while loading
        if (this.isLoadingItems) {
            return;
        }

        // Ensure page is at least 1
        if (pageNum < 1) {
            return;
        }

        // Only check upper bound if we have total pages data
        if (totalPagesNum > 0 && pageNum > totalPagesNum) {
            return;
        }

        // Update page and load data
        this.itemsCurrentPage = pageNum;

        // Use editingService if available, otherwise currentViewingFeature
        const feature = this.editingService?.feature || this.currentViewingFeature;
        if (feature && feature.name !== 'Sections') {
            this.loadFeatureItems(feature.name);
        }
    }

    /**
     * Handle items per page change
     */
    onItemsItemsPerPageChange(newItemsPerPage: number): void {
        this.itemsPerPage = newItemsPerPage;
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

    /**
     * Get dummy array for pagination pipe (needed for pagination-controls to work)
     */
    getDummyPaginationArray(): any[] {
        return Array(this.itemsTotalItems).fill(null);
    }
}
