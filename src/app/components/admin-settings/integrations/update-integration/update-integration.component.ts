import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { SkelatonLoadingComponent } from '../../../shared/skelaton-loading/skelaton-loading.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IntegrationsService } from 'app/core/services/admin-settings/integrations/integrations.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { IntegrationFeaturesFacadeService, FeatureItem } from '../../../../core/services/admin-settings/integrations/integration-features.facade.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

@Component({
    selector: 'app-update-integration',
    imports: [CommonModule, PageHeaderComponent, SkelatonLoadingComponent, OverlayFilterBoxComponent, TableComponent, PopupComponent, FormsModule, ReactiveFormsModule, NgxPaginationModule],
    templateUrl: '../create-integration/create-integration.component.html',
    styleUrls: ['../create-integration/create-integration.component.css']
})
export class UpdateIntegrationComponent implements OnInit, OnDestroy {
    private integrationsService = inject(IntegrationsService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private formBuilder = inject(FormBuilder);
    private toasterService = inject(ToasterMessageService);
    private featuresFacade = inject(IntegrationFeaturesFacadeService);

    @ViewChild('serviceFilterBox') serviceFilterBox!: OverlayFilterBoxComponent;
    @ViewChild('itemsFilterBox') itemsFilterBox!: OverlayFilterBoxComponent;

    // Form
    integrationForm!: FormGroup;
    isSubmitting: boolean = false;
    isLoadingDetails: boolean = false;

    // Tab management
    currentTab: string = 'main-info';

    // Today's date for display
    todayFormatted: string = '';

    // Flag so shared template can show update-specific UI
    isUpdate: boolean = true;

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

    // Original data for change detection
    private originalFormData: any = null;
    private originalSelectedServices: any[] = [];
    private isOriginalDataStored: boolean = false;
    
    // Cached change detection result
    private _hasChanges: boolean = false;

    // Subscriptions for cleanup
    private featuresSubscription?: Subscription;
    private itemsSubscription?: Subscription;
    private updateSubscription?: Subscription;
    private detailsSubscription?: Subscription;
    private departmentsSubscription?: Subscription;
    private sectionsSubscription?: Subscription;

    // Breadcrumb data
    breadcrumb = [
        { label: 'Admin Settings', link: '/cloud' },
        { label: 'Integration', link: '/integrations' },
        { label: 'Update Integration' }
    ];

    private integrationId!: number;

    ngOnInit(): void {
        this.initializeForm();
        this.setTodayFormatted();
        this.integrationId = Number(this.route.snapshot.paramMap.get('id')) || 1;
        // Prefill integration details
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
        if (this.itemsSubscription) {
            this.itemsSubscription.unsubscribe();
            this.itemsSubscription = undefined;
        }
        if (this.updateSubscription) {
            this.updateSubscription.unsubscribe();
            this.updateSubscription = undefined;
        }
        if (this.detailsSubscription) {
            this.detailsSubscription.unsubscribe();
            this.detailsSubscription = undefined;
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

    private initializeForm(): void {
        this.integrationForm = this.formBuilder.group({
            name: ['', [Validators.required, this.noWhitespaceValidator.bind(this)]],
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

        // Name is required and must not be only whitespace
        const nameValue = nameControl?.value;
        if (!nameValue || typeof nameValue !== 'string' || nameValue.trim().length === 0 || nameControl?.errors) {
            return false;
        }

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
        
        // Check for changes after service selection
        this.checkForChanges();
        
        this.serviceFilterBox.closeOverlay();
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
            // Save the selected item IDs (might be stored as IDs only from prefill)
            const selectedItemIds = (service.items || []).map((item: any) => 
                typeof item === 'object' && item !== null ? item.id : item
            ).filter((id: any) => id !== null && id !== undefined);
            
            // Store IDs for restoration after loading
            this.selectedItems = [];
            if (selectedItemIds.length > 0) {
                // Create temporary items with just IDs - will be replaced after loading
                this.selectedItems = selectedItemIds.map((id: number) => ({ id } as FeatureItem));
            }
            
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
        this.itemsCurrentPage = 1;
    }

    /**
     * Confirm items selection and close items overlay
     */
    confirmItemsSelection(): void {
        if (!this.editingService) return;
        
        // Save current selections to the editing service
        if (this.editingService.feature.name === 'Sections') {
            if (this.selectedSections.length > 0 && this.selectedDepartment) {
                // User has manually selected sections - set is_all to false and send selected sections
                this.editingService.sections = [...this.selectedSections];
                this.editingService.department = this.selectedDepartment;
                this.editingService.isAllSelected = false;
            } else {
                // If no items selected, default to all (is_all = true)
                this.editingService.sections = [];
                this.editingService.department = undefined;
                this.editingService.isAllSelected = true;
            }
        } else {
            if (this.selectedItems.length > 0) {
                // User has manually selected items - set is_all to false and send selected items
                this.editingService.items = [...this.selectedItems];
                this.editingService.isAllSelected = false;
            } else {
                // If no items selected, default to all (is_all = true)
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
        
        // Check for changes after items/sections selection
        this.checkForChanges();
        
        this.closeItemsFilter();
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
                const isAllSelected = existingService.isAllSelected || false;
                
                if (isAllSelected) {
                    // Will select all sections after loading
                    this.selectedSections = [];
                } else {
                    // Restore specific selected sections
                    this.selectedSections = [...(existingService.sections || [])];
                }
                
                if (this.selectedDepartment) {
                    // Load sections for the department
                    this.loadSectionsForDepartment(this.selectedDepartment.id);
                } else {
                    // Load departments list
                    this.loadDepartmentsForSections();
                }
            } else {
                // Restore selected items - if isAllSelected is true, we'll select all after loading
                const existingItems = existingService.items || [];
                const isAllSelected = existingService.isAllSelected || false;
                
                if (isAllSelected) {
                    // Will select all items after loading
                    this.selectedItems = [];
                } else {
                    // Restore specific selected items
                    this.selectedItems = [...existingItems];
                }
                // Load all items for this feature
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
            // Check for changes after removing service
            this.checkForChanges();
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
                
                // If isAllSelected is true, don't pre-select any items (keep them unmarked)
                // User will manually select items if needed, which will set is_all to false
                const existingService = this.selectedServices.find(s => 
                    s.feature.name === featureName && s.isAllSelected === true
                );
                
                if (existingService && existingService.isAllSelected) {
                    // If isAllSelected is true, don't pre-select items - keep them unmarked
                    // But preserve items from other pages
                    const currentPageItemIds = this.featureItems.map(item => item.id);
                    this.selectedItems = this.selectedItems.filter(item => 
                        !currentPageItemIds.includes(item.id)
                    );
                } else {
                    // After loading, restore selected items from all pages
                    // Get all currently selected item IDs (from all pages)
                    const selectedItemIds = this.selectedItems.map((item: any) =>
                        typeof item === 'object' && item !== null ? item.id : item
                    ).filter((id: any) => id !== null && id !== undefined);

                    // Get item IDs from editingService if available
                    let editingServiceItemIds: any[] = [];
                    if (this.editingService && this.editingService.items && this.editingService.items.length > 0) {
                        editingServiceItemIds = this.editingService.items.map((item: any) => 
                            typeof item === 'object' && item !== null ? item.id : item
                        ).filter((id: any) => id !== null && id !== undefined);
                    }

                    // Combine all selected IDs
                    const allSelectedIds = [...new Set([...selectedItemIds, ...editingServiceItemIds])];

                    // For items on current page that are selected, update them with full object data
                    const currentPageSelectedItems = this.featureItems.filter((item: FeatureItem) => 
                        allSelectedIds.includes(item.id)
                    );

                    // Keep items from other pages (not on current page)
                    const otherPageSelectedItems = this.selectedItems.filter((item: any) => {
                        const itemId = typeof item === 'object' && item !== null ? item.id : item;
                        return !this.featureItems.some(fi => fi.id === itemId);
                    });

                    // Combine: items from other pages + items from current page
                    this.selectedItems = [...otherPageSelectedItems, ...currentPageSelectedItems];
                }
                
                // Don't save in real-time - only update on confirm
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
                
                // Check if this feature has isAllSelected set to true
                const existingService = this.selectedServices.find(s => 
                    s.feature.name === 'Sections' && s.isAllSelected === true && s.department?.id === departmentId
                );
                
                if (existingService && existingService.isAllSelected) {
                    // If isAllSelected is true, select all sections
                    this.selectedSections = [...items];
                } else if (this.selectedSections.length > 0) {
                    // After loading, ensure selectedSections only contains sections that exist in the loaded list
                    // This prevents issues when restoring selections
                    const validSectionIds = new Set(items.map((item: FeatureItem) => item.id));
                    this.selectedSections = this.selectedSections.filter(section => validSectionIds.has(section.id));
                }
                
                // Don't save in real-time - only update on confirm
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
            // Deselect all items on current page
            const currentPageItemIds = this.featureItems.map(item => item.id);
            this.selectedItems = this.selectedItems.filter(item =>
                !currentPageItemIds.includes(item.id)
            );
        } else {
            // Select all items on current page
            const currentPageItemIds = this.featureItems.map(item => item.id);
            const existingItemIds = this.selectedItems.map(item => item.id);
            const newItems = this.featureItems.filter(item =>
                !existingItemIds.includes(item.id)
            );
            this.selectedItems = [...this.selectedItems, ...newItems];
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
     * Check if all items are selected
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
            // If isAllSelected is true, send is_all: true with empty values
            // If isAllSelected is false (user manually selected items), send is_all: false with selected item IDs
            if (service.feature.name === 'Sections') {
                return {
                    name: service.feature.name,
                    is_all: service.isAllSelected === true,
                    values: service.isAllSelected === true ? [] : (service.sections?.map(s => s.id) || [])
                };
            } else {
                return {
                    name: service.feature.name,
                    is_all: service.isAllSelected === true,
                    values: service.isAllSelected === true ? [] : (service.items?.map(item => item.id) || [])
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
                    integration_id: this.integrationId,
                    name: formData.name?.trim() || formData.name,
                    features: features,
                    start_at: formData.startDate,
                    no_expire: noExpire
                }
            };

            if (!noExpire) {
                requestBody.request_data.expires_at = formData.expiryDate;
            }

            this.updateSubscription = this.integrationsService.updateIntegrationEntry(requestBody).subscribe({
                next: () => {
                    this.toasterService.showSuccess('Integration updated successfully.');
                    this.router.navigate(['/integrations']);
                },
                error: (error) => {
                    console.error('Error updating integration:', error);
                    this.toasterService.showError('Failed to update integration.');
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
     * Handle start date change
     */
    onStartDateChange(): void {
        const startDate = this.integrationForm.get('startDate')?.value;
        const expiryDate = this.integrationForm.get('expiryDate')?.value;

        // If expiry date is set and is before start date, clear it
        if (startDate && expiryDate && expiryDate < startDate) {
            this.integrationForm.get('expiryDate')?.setValue('');
        }
    }

    /**
     * Handle expiry date input change
     */
    onExpiryDateInputChange(): void {
        const startDate = this.integrationForm.get('startDate')?.value;
        const expiryDate = this.integrationForm.get('expiryDate')?.value;

        // If start date is set and is after expiry date, clear it
        if (expiryDate && startDate && startDate > expiryDate) {
            this.integrationForm.get('startDate')?.setValue('');
        }
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
        // Prevent duplicate requests: check if page actually changed
        if (this.itemsCurrentPage === page) {
            return;
        }
        
        // Prevent requests while loading
        if (this.isLoadingItems) {
            return;
        }
        
        // Ensure page is at least 1
        if (page < 1) {
            return;
        }
        
        // Only check upper bound if we have total pages data
        if (this.itemsTotalPages > 0 && page > this.itemsTotalPages) {
            return;
        }
        
        // Update page and load data
        this.itemsCurrentPage = page;
        if (this.currentViewingFeature && this.currentViewingFeature.name !== 'Sections') {
            this.loadFeatureItems(this.currentViewingFeature.name);
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
    }

    /**
     * Prefill form and selections from integration details
     */
    private prefillFromDetails(): void {
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

                // Get features from object_info.features
                const features = objectInfo?.features || [];
                if (features.length > 0) {
                    // Process all features
                    this.prefillAllFeatures(features);
                } else {
                    // If no features, store original data immediately
                    this.storeOriginalData();
                }

                this.isLoadingDetails = false;
            },
            error: (err) => {
                console.error('Failed to load integration details', err);
                this.isLoadingDetails = false;
            }
        });
    }

    /**
     * Prefill all features from the integration details
     */
    private prefillAllFeatures(features: any[]): void {
        // Clear existing selections
        this.selectedServices = [];

        // Process each feature
        const featureObservables = features.map(featureData => {
            const featureName = featureData?.name;
            const isAll = featureData?.is_all === true;
            const values = featureData?.values || [];

            // Extract IDs from values array (values can be objects with id property or just numbers)
            const valueIds: number[] = values.map((val: any) => {
                return typeof val === 'object' && val !== null ? val.id : val;
            }).filter((id: any) => typeof id === 'number');

            // Create feature object from response data (don't rely on availableFeatures)
            const feature = {
                name: featureName,
                is_all: isAll,
                values: valueIds
            };

            if (featureName === 'Sections') {
                // For sections, handle departments and sections
                return this.prefillSectionsFeature(feature, isAll, valueIds);
            } else {
                // For other features, load items
                return this.prefillRegularFeature(feature, isAll, valueIds);
            }
        });

        // Wait for all features to be processed
        forkJoin(featureObservables).subscribe({
            next: (results) => {
                // All features have been processed and added to selectedServices
                console.log('All features prefilled:', this.selectedServices);
                // Store original data after features are loaded
                this.storeOriginalData();
            },
            error: (error) => {
                console.error('Error prefilling features:', error);
            }
        });
    }

    /**
     * Prefill a regular feature (not Sections)
     * Note: We don't load items here to avoid unnecessary API calls on component start
     * Items will be loaded when the user opens the items overlay
     */
    private prefillRegularFeature(feature: any, isAll: boolean, values: number[]): any {
        // Don't load items during initialization - just save the IDs
        // Items will be loaded when user opens the items overlay
        let selectedItems: FeatureItem[] = [];
        let isAllSelected = false;

        if (isAll) {
            // If is_all is true, don't load items now - mark as all selected
            selectedItems = [];
            isAllSelected = true;
        } else {
            // If is_all is false, save the IDs only (items will be loaded when overlay opens)
            // Create placeholder items with just IDs
            selectedItems = values.map((id: number) => ({ id } as FeatureItem));
            isAllSelected = false;
        }

        // Add to selectedServices without loading actual items
        this.selectedServices.push({
            feature: feature,
            items: selectedItems,
            isAllSelected: isAllSelected
        });

        // Return immediately without making API call
        return of({ feature: feature.name, success: true });
    }

    /**
     * Prefill Sections feature (requires departments)
     */
    private prefillSectionsFeature(feature: any, isAll: boolean, values: number[]): any {
        // First load departments
        return this.featuresFacade.loadFeatureItems('Departments', undefined, 1, 10000).pipe(
            switchMap((departmentsResult) => {
                const departments = departmentsResult.items || [];
                if (isAll) {
                    // If is_all is true, we need to find which department has sections
                    // Try to find a department that has sections
                    if (departments.length > 0) {
                        // Load sections for all departments to find which one has sections
                        const departmentObservables = departments.map((dept: FeatureItem) =>
                            this.featuresFacade.loadSectionsForDepartment(dept.id).pipe(
                                map((sections) => ({ department: dept, sections }))
                            )
                        );

                        return forkJoin(departmentObservables).pipe(
                            map((results: any[]) => {
                                // Find the first department that has sections
                                for (const result of results) {
                                    if (result.sections.length > 0) {
                                        this.selectedServices.push({
                                            feature: feature,
                                            sections: [...result.sections],
                                            department: result.department,
                                            isAllSelected: true
                                        });
                                        return { feature: feature.name, success: true };
                                    }
                                }
                                // If no department has sections, use the first department anyway
                                if (departments.length > 0) {
                                    this.selectedServices.push({
                                        feature: feature,
                                        sections: [],
                                        department: departments[0],
                                        isAllSelected: true
                                    });
                                    return { feature: feature.name, success: true };
                                }
                                return { feature: feature.name, success: false };
                            })
                        );
                    } else {
                        return of({ feature: feature.name, success: false });
                    }
                } else {
                    // If is_all is false, find which department contains the selected sections
                    const departmentObservables = departments.map((dept: FeatureItem) =>
                        this.featuresFacade.loadSectionsForDepartment(dept.id).pipe(
                            map((sections) => ({ department: dept, sections }))
                        )
                    );

                    if (departmentObservables.length === 0) {
                        return of({ feature: feature.name, success: false });
                    }

                    return forkJoin(departmentObservables).pipe(
                        map((results: any[]) => {
                            // Find the department that has the selected sections
                            for (const result of results) {
                                const matchingSections = result.sections.filter((s: FeatureItem) => values.includes(s.id));
                                if (matchingSections.length > 0) {
                                    // Found the department
                                    this.selectedServices.push({
                                        feature: feature,
                                        sections: matchingSections,
                                        department: result.department,
                                        isAllSelected: false
                                    });
                                    return { feature: feature.name, success: true };
                                }
                            }
                            return { feature: feature.name, success: false };
                        })
                    );
                }
            })
        );
    }

    /**
     * Store original form data and selected services for change detection
     */
    private storeOriginalData(): void {
        // Only store once
        if (this.isOriginalDataStored) {
            return;
        }

        // Store original form values
        const formValue = this.integrationForm.getRawValue();
        this.originalFormData = {
            name: formValue.name?.trim() || formValue.name || '',
            startDate: formValue.startDate || '',
            hasExpiryDate: formValue.hasExpiryDate || false,
            expiryDate: formValue.expiryDate || ''
        };

        // Store original selected services (deep copy)
        this.originalSelectedServices = this.deepCopySelectedServices(this.selectedServices);
        this.isOriginalDataStored = true;

        // Subscribe to form value changes to detect changes
        this.setupFormChangeDetection();
    }

    /**
     * Setup form change detection subscriptions
     */
    private setupFormChangeDetection(): void {
        // Subscribe to form value changes
        this.integrationForm.valueChanges.subscribe(() => {
            this.checkForChanges();
        });
    }

    /**
     * Check for changes and update the cached value
     */
    private checkForChanges(): void {
        this._hasChanges = this.computeHasChanges();
    }

    /**
     * Deep copy selected services for comparison
     */
    private deepCopySelectedServices(services: any[]): any[] {
        return services.map(service => {
            const copy: any = {
                feature: {
                    name: service.feature?.name || '',
                    is_all: service.feature?.is_all || false,
                    values: service.feature?.values ? [...service.feature.values] : []
                },
                isAllSelected: service.isAllSelected || false
            };

            if (service.items && service.items.length > 0) {
                copy.items = service.items.map((item: any) => ({
                    id: item.id,
                    name: item.name
                }));
            }

            if (service.sections && service.sections.length > 0) {
                copy.sections = service.sections.map((section: any) => ({
                    id: section.id,
                    name: section.name
                }));
            }

            if (service.department) {
                copy.department = {
                    id: service.department.id,
                    name: service.department.name
                };
            }

            return copy;
        });
    }

    /**
     * Check if form or services have changed (getter for template)
     */
    get hasChanges(): boolean {
        return this._hasChanges;
    }

    /**
     * Compute if form or services have changed
     */
    private computeHasChanges(): boolean {
        // If original data hasn't been stored yet, return false
        if (!this.originalFormData || (this.originalSelectedServices.length === 0 && this.selectedServices.length === 0)) {
            return false;
        }

        // Check if form values changed
        const currentForm = this.integrationForm.getRawValue();
        const formChanged = 
            (currentForm.name?.trim() || currentForm.name || '') !== this.originalFormData.name ||
            (currentForm.startDate || '') !== this.originalFormData.startDate ||
            (currentForm.hasExpiryDate || false) !== this.originalFormData.hasExpiryDate ||
            (currentForm.expiryDate || '') !== this.originalFormData.expiryDate;

        if (formChanged) {
            return true;
        }

        // Check if selected services changed
        return this.servicesChanged();
    }

    /**
     * Check if selected services have changed
     */
    private servicesChanged(): boolean {
        // Check if count changed
        if (this.selectedServices.length !== this.originalSelectedServices.length) {
            return true;
        }

        // Check each service
        for (let i = 0; i < this.selectedServices.length; i++) {
            const current = this.selectedServices[i];
            const original = this.originalSelectedServices.find(
                s => s.feature.name === current.feature.name
            );

            if (!original) {
                return true; // Service was added
            }

            // Check if isAllSelected changed
            if (current.isAllSelected !== original.isAllSelected) {
                return true;
            }

            // If not all selected, check items/sections
            if (!current.isAllSelected) {
                if (current.feature.name === 'Sections') {
                    // For sections, check department and sections
                    const currentDeptId = current.department?.id;
                    const originalDeptId = original.department?.id;
                    if (currentDeptId !== originalDeptId) {
                        return true;
                    }

                    const currentSectionIds = (current.sections || []).map((s: any) => s.id).sort();
                    const originalSectionIds = (original.sections || []).map((s: any) => s.id).sort();
                    if (JSON.stringify(currentSectionIds) !== JSON.stringify(originalSectionIds)) {
                        return true;
                    }
                } else {
                    // For other features, check items
                    const currentItemIds = (current.items || []).map((item: any) => item.id).sort();
                    const originalItemIds = (original.items || []).map((item: any) => item.id).sort();
                    if (JSON.stringify(currentItemIds) !== JSON.stringify(originalItemIds)) {
                        return true;
                    }
                }
            }
        }

        // Check if any original service was removed
        for (const original of this.originalSelectedServices) {
            const found = this.selectedServices.find(s => s.feature.name === original.feature.name);
            if (!found) {
                return true; // Service was removed
            }
        }

        return false;
    }

    /**
     * Get dummy array for pagination pipe (needed for pagination-controls to work)
     */
    getDummyPaginationArray(): any[] {
        return Array(this.itemsTotalItems).fill(null);
    }

}
