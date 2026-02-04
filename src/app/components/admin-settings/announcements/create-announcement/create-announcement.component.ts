import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { HttpClient } from '@angular/common/http';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { AnnouncementsService } from '../../../../core/services/admin-settings/announcements/announcements.service';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-create-announcement',
    standalone: true,
    imports: [PageHeaderComponent, ReactiveFormsModule, FormsModule, TableComponent, OverlayFilterBoxComponent, NgClass],
    templateUrl: './create-announcement.component.html',
    styleUrls: ['./create-announcement.component.css']
})
export class CreateAnnouncementComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private formBuilder = inject(FormBuilder);
    private http = inject(HttpClient);
    private departmentsService = inject(DepartmentsService);
    private branchesService = inject(BranchesService);
    private employeeService = inject(EmployeeService);
    private announcementsService = inject(AnnouncementsService);

    @ViewChild('departmentFilterBox') departmentFilterBox!: OverlayFilterBoxComponent;

    // Form
    announcementForm!: FormGroup;
    isSubmitting: boolean = false;
    formErrors: any = {};

    // Image upload
    selectedImage: string | null = null;
    imageError: string | null = null;

    // Recipients per type
    selectedDepartments: any[] = [];
    selectedEmployees: any[] = [];
    selectedBranches: any[] = [];
    selectedCompanies: any[] = [];
    selectedSections: any[] = [];

    // Temporary selections in modal (before confirm)
    tempSelectedDepartments: any[] = [];
    tempSelectedEmployees: any[] = [];
    tempSelectedBranches: any[] = [];
    tempSelectedCompanies: any[] = [];
    tempSelectedSections: any[] = [];

    availableItems: any[] = [];
    availableDepartments: any[] = [];
    selectedDepartmentId: number | null = null;
    // Separate search terms: one for modal (server-side) and one for selected list (client-side)
    modalSearchTerm: string = '';
    selectedSearchTerm: string = '';
    currentPage: number = 1;
    totalPages: number = 0;
    totalItems: number = 0;
    itemsPerPage: number = 10;
    isLoadingDepartments: boolean = false;
    isLoadingItems: boolean = false;

    // Recipients type selection
    selectedRecipientType: 'department' | 'section' | 'employee' | 'branch' | 'company' = 'department';

    // Search debouncing
    private searchSubject = new Subject<string>();
    private searchSubscription?: Subscription;

    // Employee-specific debounced search (uses switchMap to cancel previous requests)
    private employeeSearchSubject = new Subject<string>();
    private employeeSearchSubscription?: Subscription;

    // Track in-flight request so we can cancel it when overlays close
    private currentRequestSub?: Subscription | null = null;

    // Selected table pagination (mirror create-integration)
    tableCurrentPage: number = 1;
    tableItemsPerPage: number = 10;
    tableTotalItems: number = 0;
    tableIsLoading: boolean = false;

    // Tabs
    currentTab: string = 'main-info';

    // Date formatting
    todayFormatted: string = new Date().toLocaleDateString('en-GB');

    // Breadcrumb
    breadcrumb = [
        { label: 'Admin Settings', link: '/cloud' },
        { label: 'Announcements', link: '/announcements' },
        { label: 'Create Announcement' }
    ];

    ngOnInit(): void {
        this.initializeForm();
        this.setupSearchDebouncing();
    }

    ngOnDestroy(): void {
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
        }
        if (this.employeeSearchSubscription) {
            this.employeeSearchSubscription.unsubscribe();
        }
        // Cancel any in-flight requests
        this.cancelCurrentRequest();
    }

    /**
     * Setup debounced search functionality
     */
    private setupSearchDebouncing(): void {
        // General-purpose search (other entity types)
        this.searchSubscription = this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(searchTerm => {
            this.modalSearchTerm = searchTerm;
            this.performSearch();
        });

        // Employee-specific debounced search with switchMap to cancel previous HTTP calls
        this.employeeSearchSubscription = this.employeeSearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap((term: string) => {
                // Cancel any previous explicit request
                if (this.currentRequestSub) {
                    this.currentRequestSub.unsubscribe();
                    this.currentRequestSub = null;
                }
                this.isLoadingItems = true;
                this.currentPage = 1;
                // Use the employee service; ensure errors map to empty result
                return this.employeeService.getEmployees(this.currentPage, this.itemsPerPage, term).pipe(
                    catchError(() => of({ data: { list_items: [], total_items: 0, total_pages: 1 } }))
                );
            })
        ).subscribe((res: any) => {
            // Normalize response similar to loadEntities employee branch
            const items = (res?.data?.list_items ?? res?.list_items ?? res?.data ?? []) || [];
            const normalized = Array.isArray(items) ? items.map((x: any) => {
                const contactName = x.object_info?.contact_info?.name;
                const name = contactName ||
                    x.object_info?.name ||
                    x.name ||
                    (x.object_info?.first_name ? `${x.object_info.first_name} ${x.object_info.last_name ?? ''}`.trim() : '');
                return {
                    id: x.object_info?.id ?? x.id,
                    code: x.object_info?.code ?? x.code ?? x.id,
                    name: name,
                    fullName: name
                };
            }).filter((emp: any) => emp.id && emp.name) : [];
            this.availableItems = normalized;
            this.totalItems = res?.data?.total_items ?? res?.total_items ?? normalized.length;
            const computedPages = Math.ceil(this.totalItems / this.itemsPerPage);
            this.totalPages = (res?.data?.total_pages ?? res?.total_pages ?? computedPages) || 1;
            this.isLoadingItems = false;
        });
    }

    /**
     * Perform search based on current recipient type
     */
    private performSearch(): void {
        // console.log('performSearch called for:', this.selectedRecipientType, 'searchTerm:', this.modalSearchTerm);
        this.currentPage = 1;
        if (this.selectedRecipientType === 'section') {
            this.loadDepartmentsForSections();
        } else {
            this.loadEntities();
        }
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
        this.announcementForm = this.formBuilder.group({
            title: ['', [Validators.required, Validators.minLength(2)]],
            body: ['', [Validators.required, Validators.minLength(2), this.noWhitespaceValidator.bind(this)]]
        });
    }

    /**
     * Navigate to next tab
     */
    goToNextTab(): void {
        if (this.currentTab === 'main-info') {
            this.currentTab = 'recipients';
        }
    }

    /**
     * Navigate to previous tab
     */
    goToPreviousTab(): void {
        if (this.currentTab === 'recipients') {
            this.currentTab = 'main-info';
        }
    }

    /**
     * Go back to main info (alias for goToPreviousTab)
     */
    goBackToMainInfo(): void {
        this.goToPreviousTab();
    }

    /**
     * Check if form is valid for next step
     */
    isFormValidForNext(): boolean {
        if (this.currentTab === 'main-info') {
            return (this.announcementForm.get('title')?.valid ?? false) && (this.announcementForm.get('body')?.valid ?? false);
        }
        return true;
    }


    /**
     * Open image picker
     */
    openImagePicker(event: Event): void {
        event.stopPropagation();
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * Handle image selection
     */
    onImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        // If no file selected (user cancelled), do nothing
        if (!file) {
            // Reset the input value to ensure change event fires next time
            input.value = '';
            return;
        }

        // Clear any previous errors first
        this.imageError = null;

        // Validate file type - only allow jpg, jpeg, png, webp
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const isValidType = allowedTypes.includes(file.type) ||
            (fileExtension && ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension));

        if (!isValidType) {
            this.imageError = 'Please select a valid image file. Only JPG, JPEG, PNG, and WEBP formats are allowed.';
            // Reset input
            input.value = '';
            return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            this.imageError = 'Image size must be less than 10MB.';
            // Reset input
            input.value = '';
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.selectedImage = e.target?.result as string;
        };
        reader.onerror = () => {
            this.imageError = 'Failed to read the image file. Please try again.';
            input.value = '';
        };
        reader.readAsDataURL(file);
    }

    /**
     * Remove selected image
     */
    removeImage(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.selectedImage = null;
        this.imageError = null;

        // Reset file input
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * Open department selection overlay
     */
    openDepartmentSelection(): void {
        // Load temp selections from current selections for display during edit
        this.tempSelectedDepartments = JSON.parse(JSON.stringify(this.selectedDepartments));
        this.tempSelectedEmployees = JSON.parse(JSON.stringify(this.selectedEmployees));
        this.tempSelectedBranches = JSON.parse(JSON.stringify(this.selectedBranches));
        this.tempSelectedCompanies = JSON.parse(JSON.stringify(this.selectedCompanies));
        this.tempSelectedSections = JSON.parse(JSON.stringify(this.selectedSections));

        this.departmentFilterBox.openOverlay();
        this.currentPage = 1;

        // Load data based on selected recipient type
        if (this.selectedRecipientType === 'section') {
            this.loadDepartmentsForSections();
        } else {
            this.loadEntities();
        }
    }

    /**
     * Clear selections in the modal (but keep main selections)
     */
    private clearModalSelections(): void {
        this.availableItems = [];
        this.availableDepartments = [];
        this.selectedDepartmentId = null;
        this.modalSearchTerm = '';
        this.currentPage = 1;
        // Don't trigger search subject here to avoid duplicate calls
    }

    /**
     * Set current recipient type (UI only for now)
     */
    setRecipientType(type: 'department' | 'section' | 'employee' | 'branch' | 'company'): void {
        // Clear all previous selections when switching types
        this.clearAllSelections();

        this.selectedRecipientType = type;
        this.modalSearchTerm = ''; // Reset modal search when changing type
        this.selectedSearchTerm = ''; // Reset selected-items search when changing type
        this.currentPage = 1; // Reset page when changing type
        this.selectedDepartmentId = null; // Reset department selection for sections

        // Don't make API calls when switching radio buttons
        // API calls will only happen when user clicks "Add" button
    }

    /**
     * Clear all selections from all recipient types
     */
    private clearAllSelections(): void {
        this.selectedDepartments = [];
        this.selectedEmployees = [];
        this.selectedBranches = [];
        this.selectedCompanies = [];
        this.selectedSections = [];

        // Update the selected items table to reflect cleared selections
        this.updateSelectedDepartmentsTable();
    }

    /**
     * UI label helper: returns label with (s) suffix as in the design
     */
    getRecipientLabelWithS(): string {
        const map: Record<typeof this.selectedRecipientType, string> = {
            department: 'Department(s)',
            section: 'Section(s)',
            employee: 'Employee(s)',
            branch: 'Branch(s)',
            company: 'Company(s)'
        } as const;
        return map[this.selectedRecipientType];
    }

    /**
     * Load departments from API
     */
    loadDepartments(): void { this.selectedRecipientType = 'department'; this.loadEntities(); }

    /**
     * Load departments for section selection (10000 per page)
     */
    loadDepartmentsForSections(): void {
        this.isLoadingItems = true;
        this.departmentsService.getAllDepartment(1, 10000, { search: this.modalSearchTerm || undefined }).subscribe({
            next: (res: any) => {
                const departments = res?.data?.list_items || [];
                this.availableDepartments = departments.map((dept: any) => ({
                    id: dept.id,
                    code: dept.code,
                    name: dept.name
                }));
                // Don't set availableItems for sections - only populate dropdown
                this.availableItems = [];
                this.totalItems = 0;
                this.isLoadingItems = false;
            },
            error: () => {
                this.isLoadingItems = false;
            }
        });
    }

    /**
     * Load sections for selected department
     */
    loadSectionsForDepartment(departmentId: number): void {
        this.isLoadingItems = true;
        this.selectedDepartmentId = departmentId;
        this.departmentsService.showDepartment(departmentId).subscribe({
            next: (res: any) => {
                const sections = res?.data?.object_info?.sections || [];
                this.availableItems = sections.map((section: any) => ({
                    id: section.id,
                    code: section.code,
                    name: section.name
                }));
                this.totalItems = sections.length;
                this.isLoadingItems = false;
            },
            error: () => {
                this.isLoadingItems = false;
            }
        });
    }

    /**
     * Handle department selection for sections
     */
    onDepartmentSelected(departmentId: string): void {
        const id = parseInt(departmentId, 10);
        if (id && !isNaN(id)) {
            this.loadSectionsForDepartment(id);
        } else {
            // Clear sections if no department selected
            this.availableItems = [];
            this.totalItems = 0;
            this.selectedDepartmentId = null;
        }
    }

    /**
     * Search departments when sections are selected
     */
    searchDepartmentsForSections(): void {
        this.loadDepartmentsForSections();
    }

    /**
     * Handle search input with debouncing
     */
    onModalSearchInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        // Route search terms to employee-specific debouncer when searching employees,
        // otherwise use the generic debouncer.
        if (this.selectedRecipientType === 'employee') {
            this.employeeSearchSubject.next(target.value);
        } else {
            this.searchSubject.next(target.value);
        }
    }

    /**
     * Clear search and reload data
     */
    clearModalSearch(): void {
        this.modalSearchTerm = '';
        this.searchSubject.next('');
        // Don't call performSearch() here as it will be triggered by the searchSubject
    }

    // Generic loader based on selectedRecipientType
    loadEntities(): void {
        this.isLoadingItems = true;

        const page = this.currentPage;
        const perPage = this.itemsPerPage;
        const search = this.modalSearchTerm || '';

        const finish = (res: any, map: (x: any) => any) => {
            const items = (res?.data?.list_items ?? res?.list_items ?? res?.data ?? []) || [];
            const normalized = Array.isArray(items) ? items.map(map) : [];
            this.availableItems = normalized;
            this.totalItems = res?.data?.total_items ?? res?.total_items ?? normalized.length;
            const computedPages = Math.ceil(this.totalItems / perPage);
            this.totalPages = (res?.data?.total_pages ?? res?.total_pages ?? computedPages) || 1;
            this.isLoadingItems = false;
        };

        // Cancel any previous request before issuing a new one (applies to departments/branches/employees)
        if (this.currentRequestSub) {
            this.currentRequestSub.unsubscribe();
            this.currentRequestSub = null;
        }

        if (this.selectedRecipientType === 'department') {
            this.currentRequestSub = this.departmentsService.getAllDepartment(page, perPage, { search: search || undefined }).subscribe({
                next: (res: any) => finish(res, (x: any) => ({ id: x.id, code: x.code ?? x.id, name: x.name })),
                error: () => { this.isLoadingItems = false; this.currentRequestSub = null; }
            });
        } else if (this.selectedRecipientType === 'branch') {
            this.currentRequestSub = this.branchesService.getAllBranches(page, perPage, { search: search || undefined }).subscribe({
                next: (res: any) => finish(res, (x: any) => ({ id: x.id, code: x.code ?? x.id, name: x.name })),
                error: () => { this.isLoadingItems = false; this.currentRequestSub = null; }
            });
        } else if (this.selectedRecipientType === 'employee') {
            // For employee searches triggered by typing, the employeeSearchSubject + switchMap handles cancellation.
            // Here we still support explicit loads (e.g., pagination) and ensure previous request is cancelled.
            this.currentRequestSub = this.employeeService.getEmployees(page, perPage, search).subscribe({
                next: (res: any) => {
                    const items = (res?.data?.list_items ?? res?.list_items ?? res?.data ?? []) || [];
                    const normalized = Array.isArray(items) ? items.map((x: any) => {
                        const contactName = x.object_info?.contact_info?.name;
                        const name = contactName ||
                            x.object_info?.name ||
                            x.name ||
                            (x.object_info?.first_name ? `${x.object_info.first_name} ${x.object_info.last_name ?? ''}`.trim() : '');
                        return {
                            id: x.object_info?.id ?? x.id,
                            code: x.object_info?.code ?? x.code ?? x.id,
                            name: name,
                            fullName: name
                        };
                    }).filter((emp: any) => emp.id && emp.name) : [];
                    this.availableItems = normalized;
                    this.totalItems = res?.data?.total_items ?? res?.total_items ?? normalized.length;
                    const computedPages = Math.ceil(this.totalItems / perPage);
                    this.totalPages = (res?.data?.total_pages ?? res?.total_pages ?? computedPages) || 1;
                    this.isLoadingItems = false;
                    this.currentRequestSub = null;
                },
                error: () => { this.isLoadingItems = false; this.currentRequestSub = null; }
            });
        } else {
            finish({ data: { list_items: [], total_items: 0, total_pages: 1 } }, (x: any) => x);
        }
    }

    /**
     * Filter entities based on search term
     */
    // Client-side search for selected items table
    onSelectedSearchInput(): void {
        this.tableCurrentPage = 1;
        this.updateSelectedDepartmentsTable();
    }

    /**
     * Get the appropriate selected array (temporary during modal, permanent outside)
     */
    private getSelectedArray(): any[] {
        switch (this.selectedRecipientType) {
            case 'employee': return this.tempSelectedEmployees;
            case 'branch': return this.tempSelectedBranches;
            case 'company': return this.tempSelectedCompanies;
            case 'section': return this.tempSelectedSections;
            default: return this.tempSelectedDepartments;
        }
    }

    /**
     * Get the permanent selected array (for outside display)
     */
    private getPermanentSelectedArray(): any[] {
        switch (this.selectedRecipientType) {
            case 'employee': return this.selectedEmployees;
            case 'branch': return this.selectedBranches;
            case 'company': return this.selectedCompanies;
            case 'section': return this.selectedSections;
            default: return this.selectedDepartments;
        }
    }

    toggleDepartmentSelection(department: any): void { this.toggleItemSelection(department); }
    toggleItemSelection(item: any): void {
        const arr = this.getSelectedArray();
        const idx = arr.findIndex((d: any) => d.id === item.id);
        if (idx > -1) { arr.splice(idx, 1); } else { arr.push(item); }
    }

    /**
     * Check if department is selected
     */
    isDepartmentSelected(department: any): boolean { return this.getSelectedArray().some(d => d.id === department.id); }

    /**
     * Select all departments on current page
     */
    selectAllDepartments(): void {
        const currentPageDepartments = this.getCurrentPageDepartments();
        const allSelected = currentPageDepartments.every(dept => this.isDepartmentSelected(dept));

        if (allSelected) {
            // Deselect all on current page
            currentPageDepartments.forEach(dept => {
                const arr = this.getSelectedArray();
                const index = arr.findIndex(d => d.id === dept.id);
                if (index > -1) { arr.splice(index, 1); }
            });
        } else {
            // Select all on current page
            currentPageDepartments.forEach(dept => {
                if (!this.isDepartmentSelected(dept)) { this.getSelectedArray().push(dept); }
            });
        }
    }

    /**
     * Check if all departments on current page are selected
     */
    isAllCurrentPageSelected(): boolean {
        const currentPageDepartments = this.getCurrentPageDepartments();
        return currentPageDepartments.length > 0 && currentPageDepartments.every(dept => this.isDepartmentSelected(dept));
    }

    /**
     * Save selected departments
     */
    saveSelectedDepartments(): void {
        this.departmentFilterBox.closeOverlay();
        // update selected table meta
        this.updateSelectedDepartmentsTable();
    }

    /**
     * Close department selection overlay (discard changes)
     */
    closeDepartmentSelection(): void {
        // Clear temporary selections without saving
        this.tempSelectedDepartments = [];
        this.tempSelectedEmployees = [];
        this.tempSelectedBranches = [];
        this.tempSelectedCompanies = [];
        this.tempSelectedSections = [];
        // Cancel any in-flight requests related to the overlay
        this.cancelCurrentRequest();
        this.departmentFilterBox.closeOverlay();
    }

    /**
     * Confirm and save selections from modal
     */
    confirmDepartmentSelection(): void {
        // Copy from temporary to permanent arrays
        this.selectedDepartments = [...this.tempSelectedDepartments];
        this.selectedEmployees = [...this.tempSelectedEmployees];
        this.selectedBranches = [...this.tempSelectedBranches];
        this.selectedCompanies = [...this.tempSelectedCompanies];
        this.selectedSections = [...this.tempSelectedSections];

        // Clear temporary selections
        this.tempSelectedDepartments = [];
        this.tempSelectedEmployees = [];
        this.tempSelectedBranches = [];
        this.tempSelectedCompanies = [];
        this.tempSelectedSections = [];

        // Update the table display
        this.updateSelectedDepartmentsTable();
        // Cancel any in-flight overlay requests and close
        this.cancelCurrentRequest();
        this.departmentFilterBox.closeOverlay();
    }

    /**
     * Remove department from selection
     */
    removeDepartment(department: any): void {
        const arr = this.getPermanentSelectedArray();
        const index = arr.findIndex(d => d.id === department.id);
        if (index > -1) { arr.splice(index, 1); }
        this.updateSelectedDepartmentsTable();
    }

    /**
     * Get departments for current page
     */
    getCurrentPageDepartments(): any[] { return this.availableItems; }

    // Selected departments table helpers
    private getFilteredSelectedArray(): any[] {
        // Use permanent selected array for outside display
        const arr = this.getPermanentSelectedArray();
        const term = (this.selectedSearchTerm || '').toLowerCase().trim();
        if (!term) return arr;
        return arr.filter(item => {
            const code = (item.code || '').toString().toLowerCase();
            const name = (item.name || '').toString().toLowerCase();
            return code.includes(term) || name.includes(term);
        });
    }

    getSelectedDepartmentsPage(): any[] {
        const start = (this.tableCurrentPage - 1) * this.tableItemsPerPage;
        const filtered = this.getFilteredSelectedArray();
        return filtered.slice(start, start + this.tableItemsPerPage);
    }

    onTablePageChange(page: number): void {
        this.tableCurrentPage = page;
    }

    onTableItemsPerPageChange(itemsPerPage: number): void {
        this.tableItemsPerPage = itemsPerPage;
        this.tableCurrentPage = 1;
    }

    shouldShowDepartmentsPagination(): boolean { return this.getFilteredSelectedArray().length >= 10; }

    private updateSelectedDepartmentsTable(): void {
        this.tableIsLoading = true;
        this.tableTotalItems = this.getFilteredSelectedArray().length;
        // ensure current page is not out of range
        const maxPage = Math.max(1, Math.ceil(this.tableTotalItems / this.tableItemsPerPage));
        if (this.tableCurrentPage > maxPage) {
            this.tableCurrentPage = maxPage;
        }
        // small timeout to let UI refresh similarly to integration component UX
        setTimeout(() => (this.tableIsLoading = false));
    }

    /**
     * Cancel any current in-flight overlay request.
     */
    private cancelCurrentRequest(): void {
        if (this.currentRequestSub) {
            try { this.currentRequestSub.unsubscribe(); } catch { /* ignore */ }
            this.currentRequestSub = null;
        }
        // Also stop employee search pipeline's in-flight HTTP by triggering an empty term if needed
        // (employeeSearchSubject uses switchMap which cancels automatically on next emission)
        this.isLoadingItems = false;
    }

    /**
     * Navigate to previous page
     */
    goToPreviousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadEntities();
        }
    }

    /**
     * Navigate to next page
     */
    goToNextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadEntities();
        }
    }

    /**
     * Get pagination info text
     */
    getPaginationInfo(): string {
        const itemsPerPage = this.itemsPerPage;
        const startItem = this.totalItems === 0 ? 0 : (this.currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * itemsPerPage, this.totalItems);
        return `Showing ${startItem}-${endItem} from ${this.totalItems}`;
    }

    /**
     * Returns the appropriate empty message for the overlay modal table
     * based on the currently selected recipient overlay and search state.
     */
    getModalEmptyMessage(): string {
        // If still loading, let the table show the loader state instead of a message.
        if (this.isLoadingItems) {
            return 'Loading...';
        }

        const term = (this.modalSearchTerm || '').trim();

        switch (this.selectedRecipientType) {
            case 'department':
                return term ? `No departments found for "${term}".` : 'No departments found.';
            case 'section':
                if (!this.selectedDepartmentId) {
                    return 'Please select a department to view its sections.';
                }
                return term ? `No sections found for "${term}".` : 'No sections found for the selected department.';
            case 'employee':
                return term ? `No employees found for "${term}".` : 'No employees found.';
            case 'branch':
                return term ? `No branches found for "${term}".` : 'No branches found.';
            case 'company':
                return 'No companies found.';
            default:
                return 'No items found.';
        }
    }

    // Overlay table pagination handlers (mirror view-departments)
    onOverlayPageChange(page: number): void {
        this.currentPage = page;
        this.loadDepartments();
    }

    onOverlayItemsPerPageChange(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.loadDepartments();
    }

    /**
     * Handle form submission
     */
    onSubmit(): void {
        if (this.announcementForm.valid && this.hasSelectedRecipients()) {
            this.sendNotification();
        }
    }

    /**
     * Handle discard action
     */
    onDiscard(): void {
        this.router.navigate(['/announcements']);
    }

    /**
     * Check if there are selected recipients
     */
    hasSelectedRecipients(): boolean {
        // For company type, we don't need to select recipients manually
        if (this.selectedRecipientType === 'company') {
            return true; // Company is automatically selected from localStorage
        }

        const selectedArray = this.getPermanentSelectedArray();
        return selectedArray.length > 0;
    }

    /**
     * Get recipient type as number
     */
    getRecipientTypeNumber(): number {
        const typeMap = {
            'department': 1,
            'section': 2,
            'employee': 3,
            'branch': 4,
            'company': 5
        };
        return typeMap[this.selectedRecipientType];
    }

    /**
     * Get recipients array
     */
    getRecipientsArray(): number[] {
        if (this.selectedRecipientType === 'company') {
            // Get company ID from localStorage
            const companyInfo = localStorage.getItem('company_info');
            if (companyInfo) {
                const company = JSON.parse(companyInfo);
                return [company.id];
            }
            return [];
        } else {
            // Use the permanent selected arrays (not the modal temporary selections)
            const selectedArray = this.getPermanentSelectedArray();
            return selectedArray.map(item => item.id);
        }
    }

    /**
     * Get company name from localStorage
     */
    getCompanyName(): string {
        const companyInfo = localStorage.getItem('company_info');
        if (companyInfo) {
            const company = JSON.parse(companyInfo);
            return company.name || 'Company';
        }
        return 'Company';
    }

    /**
     * Send notification
     */
    sendNotification(): void {
        this.isSubmitting = true;

        const formData = new FormData();
        const titleValue = this.announcementForm.get('title')?.value;
        const bodyValue = this.announcementForm.get('body')?.value;
        formData.append('title', typeof titleValue === 'string' ? titleValue.trim() : titleValue);
        formData.append('body', typeof bodyValue === 'string' ? bodyValue.trim() : bodyValue);
        formData.append('type', this.getRecipientTypeNumber().toString());

        // Add recipients as array
        const recipients = this.getRecipientsArray();
        formData.append('recipients', JSON.stringify(recipients));

        // Add image if selected
        if (this.selectedImage) {
            // Convert base64 to file
            const imageFile = this.base64ToFile(this.selectedImage, 'announcement-image.jpg');
            formData.append('image', imageFile);
        }

        // Clear previous errors
        this.formErrors = {};

        // Use the announcements service
        this.announcementsService.createAnnouncement(formData).subscribe({
            next: (response) => {
                this.isSubmitting = false;
                // Navigate to announcements list or show success message
                this.router.navigate(['/announcements']);
            },
            error: (error) => {
                this.isSubmitting = false;
                console.error('Error sending notification:', error);

                // Handle API validation errors
                if (error.error && error.error.error_handling) {
                    this.handleApiErrors(error.error.error_handling);
                }
            }
        });
    }

    /**
     * Convert base64 string to File object
     */
    private base64ToFile(base64: string, filename: string): File {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    /**
     * Handle API validation errors
     */
    private handleApiErrors(errors: any[]): void {
        this.formErrors = {};

        errors.forEach(error => {
            const field = error.field;
            const message = error.error;

            if (field === 'title' || field === 'body') {
                this.formErrors[field] = message;
            } else if (field === 'type' && message.includes('recipients')) {
                this.formErrors['recipients'] = message;
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
}
