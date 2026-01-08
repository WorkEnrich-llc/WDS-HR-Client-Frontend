import { Component, ViewEncapsulation, OnInit, OnDestroy, ViewChild, inject, TemplateRef } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { PayrollComponentsService } from '../../../../core/services/payroll/payroll-components/payroll-components.service';
import { PayrollRunService } from '../../../../core/services/payroll/payroll-run.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-create-off-cycle-payroll',
    imports: [PageHeaderComponent, NgClass, ReactiveFormsModule, FormsModule, TableComponent, OverlayFilterBoxComponent],
    templateUrl: './create-off-cycle-payroll.component.html',
    styleUrl: './create-off-cycle-payroll.component.css',
    encapsulation: ViewEncapsulation.None
})
export class CreateOffCyclePayrollComponent implements OnInit, OnDestroy {
    // Tabs
    currentTab: string = 'details';

    private router = inject(Router);
    private formBuilder = inject(FormBuilder);
    private departmentsService = inject(DepartmentsService);
    private branchesService = inject(BranchesService);
    private employeeService = inject(EmployeeService);
    private payrollComponentsService = inject(PayrollComponentsService);
    private payrollRunService = inject(PayrollRunService);

    @ViewChild('departmentFilterBox', { static: false }) departmentFilterBox!: OverlayFilterBoxComponent;
    @ViewChild('componentFilterBox', { static: false }) componentFilterBox!: OverlayFilterBoxComponent;
    @ViewChild('selectedDepartmentsHeaderTemplate') selectedDepartmentsHeaderTemplate!: TemplateRef<any>;
    @ViewChild('selectedDepartmentRowTemplate') selectedDepartmentRowTemplate!: TemplateRef<any>;
    @ViewChild('selectedDepartmentsEmptyTemplate') selectedDepartmentsEmptyTemplate!: TemplateRef<any>;
    @ViewChild('selectedComponentsHeaderTemplate') selectedComponentsHeaderTemplate!: TemplateRef<any>;
    @ViewChild('selectedComponentRowTemplate') selectedComponentRowTemplate!: TemplateRef<any>;
    @ViewChild('selectedComponentsEmptyTemplate') selectedComponentsEmptyTemplate!: TemplateRef<any>;
    @ViewChild('modalHeaderTemplate') modalHeaderTemplate!: TemplateRef<any>;
    @ViewChild('modalRowTemplate') modalRowTemplate!: TemplateRef<any>;
    @ViewChild('modalEmptyTemplate') modalEmptyTemplate!: TemplateRef<any>;
    @ViewChild('modalComponentHeaderTemplate') modalComponentHeaderTemplate!: TemplateRef<any>;
    @ViewChild('modalComponentRowTemplate') modalComponentRowTemplate!: TemplateRef<any>;
    @ViewChild('modalComponentEmptyTemplate') modalComponentEmptyTemplate!: TemplateRef<any>;

    // Form
    payrollForm!: FormGroup;
    isSubmitting: boolean = false;
    formErrors: any = {};

    // Recipients per type
    selectedDepartments: any[] = [];
    selectedEmployees: any[] = [];
    selectedBranches: any[] = [];
    selectedCompanies: any[] = [];
    selectedSections: any[] = [];

    // Components selection
    selectedComponents: any[] = [];
    modalSelectedComponents: any[] = [];
    availableComponents: any[] = [];
    isLoadingComponents: boolean = false;
    componentSearchTerm: string = '';
    componentCurrentPage: number = 1;
    componentTotalPages: number = 0;
    componentTotalItems: number = 0;
    componentItemsPerPage: number = 10;

    // Temporary modal selections (only confirmed when clicking Confirm button)
    modalSelectedDepartments: any[] = [];
    modalSelectedEmployees: any[] = [];
    modalSelectedBranches: any[] = [];
    modalSelectedCompanies: any[] = [];
    modalSelectedSections: any[] = [];

    availableItems: any[] = [];
    availableDepartments: any[] = [];
    selectedDepartmentId: number | null = null;
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

    // Selected table pagination
    tableCurrentPage: number = 1;
    tableItemsPerPage: number = 10;
    tableTotalItems: number = 0;
    tableIsLoading: boolean = false;

    constructor() { }

    ngOnInit(): void {
        this.initializeForm();
        this.setupSearchDebouncing();
    }

    ngOnDestroy(): void {
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
        }
    }

    /**
     * Initialize the form
     */
    initializeForm(): void {
        this.payrollForm = this.formBuilder.group({
            payroll_title: ['', [Validators.required, Validators.minLength(2)]]
        });
    }

    /**
     * Navigate to next tab
     */
    goToNextTab(): void {
        if (this.currentTab === 'details') {
            this.currentTab = 'recipients';
        }
    }

    /**
     * Navigate to previous tab
     */
    goToPreviousTab(): void {
        if (this.currentTab === 'recipients') {
            this.currentTab = 'details';
        }
    }

    /**
     * Check if form is valid for next step
     */
    isFormValidForNext(): boolean {
        if (this.currentTab === 'details') {
            return true; // Add your validation logic here
        }
        return true;
    }

    /**
     * Setup debounced search functionality
     */
    private setupSearchDebouncing(): void {
        this.searchSubscription = this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(searchTerm => {
            this.modalSearchTerm = searchTerm;
            this.performSearch();
        });
    }

    /**
     * Perform search based on current recipient type
     */
    private performSearch(): void {
        this.currentPage = 1;
        if (this.selectedRecipientType === 'section') {
            this.loadDepartmentsForSections();
        } else {
            this.loadEntities();
        }
    }

    /**
     * Open department selection overlay
     */
    openDepartmentSelection(): void {
        this.initializeModalSelections();
        this.departmentFilterBox.openOverlay();
        this.currentPage = 1;

        if (this.selectedRecipientType === 'section') {
            this.loadDepartmentsForSections();
        } else {
            this.loadEntities();
        }
    }

    /**
     * Initialize modal selections from main selections
     */
    private initializeModalSelections(): void {
        this.modalSelectedDepartments = JSON.parse(JSON.stringify(this.selectedDepartments));
        this.modalSelectedEmployees = JSON.parse(JSON.stringify(this.selectedEmployees));
        this.modalSelectedBranches = JSON.parse(JSON.stringify(this.selectedBranches));
        this.modalSelectedCompanies = JSON.parse(JSON.stringify(this.selectedCompanies));
        this.modalSelectedSections = JSON.parse(JSON.stringify(this.selectedSections));
    }

    /**
     * Clear selections in the modal (but keep main selections)
     */
    private clearModalSelections(): void {
        this.modalSelectedDepartments = [];
        this.modalSelectedEmployees = [];
        this.modalSelectedBranches = [];
        this.modalSelectedCompanies = [];
        this.modalSelectedSections = [];
        this.availableItems = [];
        this.availableDepartments = [];
        this.selectedDepartmentId = null;
        this.modalSearchTerm = '';
        this.currentPage = 1;
    }

    /**
     * Set current recipient type (UI only for now)
     */
    setRecipientType(type: 'department' | 'section' | 'employee' | 'branch' | 'company'): void {
        this.clearAllSelections();
        this.selectedRecipientType = type;
        this.modalSearchTerm = '';
        this.selectedSearchTerm = '';
        this.currentPage = 1;
        this.selectedDepartmentId = null;
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
        this.updateSelectedDepartmentsTable();
    }

    /**
     * UI label helper: returns label with (s) suffix
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
    loadDepartments(): void {
        this.selectedRecipientType = 'department';
        this.loadEntities();
    }

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
            this.availableItems = [];
            this.totalItems = 0;
            this.selectedDepartmentId = null;
        }
    }

    /**
     * Handle search input with debouncing
     */
    onModalSearchInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchSubject.next(target.value);
    }

    /**
     * Clear search and reload data
     */
    clearModalSearch(): void {
        this.modalSearchTerm = '';
        this.searchSubject.next('');
    }

    /**
     * Generic loader based on selectedRecipientType
     */
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

        if (this.selectedRecipientType === 'department') {
            this.departmentsService.getAllDepartment(page, perPage, { search: search || undefined }).subscribe({
                next: (res: any) => finish(res, (x: any) => ({ id: x.id, code: x.code ?? x.id, name: x.name })),
                error: () => this.isLoadingItems = false
            });
        } else if (this.selectedRecipientType === 'branch') {
            this.branchesService.getAllBranches(page, perPage, { search: search || undefined }).subscribe({
                next: (res: any) => finish(res, (x: any) => ({ id: x.id, code: x.code ?? x.id, name: x.name })),
                error: () => this.isLoadingItems = false
            });
        } else if (this.selectedRecipientType === 'employee') {
            this.employeeService.getEmployees(page, perPage, search).subscribe({
                next: (res: any) => {
                    const items = (res?.data?.list_items ?? res?.list_items ?? res?.data ?? []) || [];
                    const normalized = Array.isArray(items) ? items.map((x: any) => {
                        // Extract employee name from contact_info first (API standard), then fallback to other fields
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
                },
                error: () => this.isLoadingItems = false
            });
        } else {
            finish({ data: { list_items: [], total_items: 0, total_pages: 1 } }, (x: any) => x);
        }
    }

    /**
     * Client-side search for selected items table
     */
    onSelectedSearchInput(): void {
        this.tableCurrentPage = 1;
        this.updateSelectedDepartmentsTable();
    }

    /**
     * Get selected array based on type
     */
    private getSelectedArray(): any[] {
        switch (this.selectedRecipientType) {
            case 'employee': return this.selectedEmployees;
            case 'branch': return this.selectedBranches;
            case 'company': return this.selectedCompanies;
            case 'section': return this.selectedSections;
            default: return this.selectedDepartments;
        }
    }

    /**
     * Get modal selected array based on type (temporary selections in overlay)
     */
    private getModalSelectedArray(): any[] {
        switch (this.selectedRecipientType) {
            case 'employee': return this.modalSelectedEmployees;
            case 'branch': return this.modalSelectedBranches;
            case 'company': return this.modalSelectedCompanies;
            case 'section': return this.modalSelectedSections;
            default: return this.modalSelectedDepartments;
        }
    }

    /**
     * Toggle item selection
     */
    toggleDepartmentSelection(department: any): void {
        this.toggleItemSelection(department);
    }

    toggleItemSelection(item: any): void {
        const arr = this.getModalSelectedArray();
        const idx = arr.findIndex((d: any) => d.id === item.id);
        if (idx > -1) {
            arr.splice(idx, 1);
        } else {
            arr.push(item);
        }
    }

    /**
     * Check if department is selected in modal
     */
    isDepartmentSelected(department: any): boolean {
        return this.getModalSelectedArray().some(d => d.id === department.id);
    }

    /**
     * Select all departments on current page
     */
    selectAllDepartments(): void {
        const currentPageDepartments = this.getCurrentPageDepartments();
        const allSelected = currentPageDepartments.every(dept => this.isDepartmentSelected(dept));
        const arr = this.getModalSelectedArray();

        if (allSelected) {
            currentPageDepartments.forEach(dept => {
                const index = arr.findIndex(d => d.id === dept.id);
                if (index > -1) {
                    arr.splice(index, 1);
                }
            });
        } else {
            currentPageDepartments.forEach(dept => {
                if (!this.isDepartmentSelected(dept)) {
                    arr.push(dept);
                }
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
     * Save selected departments - copy modal selections to main
     */
    saveSelectedDepartments(): void {
        this.selectedDepartments = JSON.parse(JSON.stringify(this.modalSelectedDepartments));
        this.selectedEmployees = JSON.parse(JSON.stringify(this.modalSelectedEmployees));
        this.selectedBranches = JSON.parse(JSON.stringify(this.modalSelectedBranches));
        this.selectedCompanies = JSON.parse(JSON.stringify(this.modalSelectedCompanies));
        this.selectedSections = JSON.parse(JSON.stringify(this.modalSelectedSections));
        this.departmentFilterBox.closeOverlay();
        this.updateSelectedDepartmentsTable();
    }

    /**
     * Close department selection overlay
     */
    closeDepartmentSelection(): void {
        this.clearModalSelections();
        this.departmentFilterBox.closeOverlay();
    }

    /**
     * Remove department from selection
     */
    removeDepartment(department: any): void {
        const arr = this.getSelectedArray();
        const index = arr.findIndex(d => d.id === department.id);
        if (index > -1) {
            arr.splice(index, 1);
        }
        this.updateSelectedDepartmentsTable();
    }

    /**
     * Get departments for current page
     */
    getCurrentPageDepartments(): any[] {
        return this.availableItems;
    }

    /**
     * Filter selected array based on search
     */
    private getFilteredSelectedArray(): any[] {
        const arr = this.getSelectedArray();
        const term = (this.selectedSearchTerm || '').toLowerCase().trim();
        if (!term) return arr;
        return arr.filter(item => {
            const code = (item.code || '').toString().toLowerCase();
            const name = (item.name || '').toString().toLowerCase();
            return code.includes(term) || name.includes(term);
        });
    }

    /**
     * Get selected departments for current page
     */
    getSelectedDepartmentsPage(): any[] {
        const start = (this.tableCurrentPage - 1) * this.tableItemsPerPage;
        const filtered = this.getFilteredSelectedArray();
        return filtered.slice(start, start + this.tableItemsPerPage);
    }

    /**
     * Handle table page change
     */
    onTablePageChange(page: number): void {
        this.tableCurrentPage = page;
    }

    /**
     * Handle items per page change
     */
    onTableItemsPerPageChange(itemsPerPage: number): void {
        this.tableItemsPerPage = itemsPerPage;
        this.tableCurrentPage = 1;
    }

    /**
     * Check if should show pagination
     */
    shouldShowDepartmentsPagination(): boolean {
        return this.getFilteredSelectedArray().length >= 10;
    }

    /**
     * Update selected departments table
     */
    private updateSelectedDepartmentsTable(): void {
        this.tableIsLoading = true;
        this.tableTotalItems = this.getFilteredSelectedArray().length;
        const maxPage = Math.max(1, Math.ceil(this.tableTotalItems / this.tableItemsPerPage));
        if (this.tableCurrentPage > maxPage) {
            this.tableCurrentPage = maxPage;
        }
        setTimeout(() => (this.tableIsLoading = false));
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
     * Check if there are selected recipients
     */
    hasSelectedRecipients(): boolean {
        if (this.selectedRecipientType === 'company') {
            return true;
        }
        const selectedArray = this.getSelectedArray();
        return selectedArray.length > 0;
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
     * Submit the form
     */
    onSubmit(): void {
        // Validate form
        if (!this.payrollForm.valid) {
            this.formErrors = { payroll_title: 'Payroll Title is required' };
            return;
        }

        // Validate recipients
        if (!this.hasSelectedRecipients()) {
            this.formErrors = { recipients: 'Please select at least one recipient' };
            return;
        }

        // Validate components
        if (!this.hasSelectedComponents()) {
            this.formErrors = { components: 'Please select at least one component' };
            return;
        }

        this.isSubmitting = true;

        // Build the request data
        const requestData = {
            title: this.payrollForm.get('payroll_title')?.value || '',
            date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
            related_to_section: this.getRelatedToSection(),
            related_to_main_id: this.getRelatedToMainId(),
            related_to_employee_ids: this.selectedRecipientType === 'employee' ? this.selectedEmployees.map(e => e.id) : [],
            components: this.selectedComponents.map(c => c.id)
        };

        // Call the API
        this.payrollRunService.createOffCyclePayroll(requestData).subscribe({
            next: (response) => {
                this.isSubmitting = false;
                // Redirect to payroll runs list on success
                this.router.navigate(['/payroll-runs/payroll-runs']);
            },
            error: (err) => {
                this.isSubmitting = false;
                console.error('Error creating off-cycle payroll:', err);
                // Set error message from API response
                if (err.error?.message) {
                    this.formErrors['api'] = err.error.message;
                } else {
                    this.formErrors['api'] = 'An error occurred while creating the payroll. Please try again.';
                }
            }
        });
    }

    /**
     * Get related_to_section value based on selectedRecipientType
     */
    private getRelatedToSection(): number {
        const map: Record<typeof this.selectedRecipientType, number> = {
            department: 1,
            section: 2,
            employee: 3,
            branch: 4,
            company: 5
        };
        return map[this.selectedRecipientType];
    }

    /**
     * Get related_to_main_id based on selectedRecipientType
     */
    private getRelatedToMainId(): number | null {
        switch (this.selectedRecipientType) {
            case 'department':
                return this.selectedDepartments.length > 0 ? this.selectedDepartments[0].id : null;
            case 'section':
                return this.selectedSections.length > 0 ? this.selectedSections[0].id : null;
            case 'branch':
                return this.selectedBranches.length > 0 ? this.selectedBranches[0].id : null;
            case 'company':
                return this.selectedCompanies.length > 0 ? this.selectedCompanies[0].id : null;
            default:
                return null;
        }
    }

    /**
     * Discard and go back
     */
    onDiscard(): void {
        this.router.navigate(['/payroll-runs/payroll-runs']);
    }

    /**
     * Get field error
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
     * Open component selection overlay
     */
    openComponentSelection(): void {
        this.initializeModalComponents();
        this.componentFilterBox.openOverlay();
        this.componentCurrentPage = 1;
        this.loadAvailableComponents();
    }

    /**
     * Initialize modal component selections from main selections
     */
    private initializeModalComponents(): void {
        this.modalSelectedComponents = JSON.parse(JSON.stringify(this.selectedComponents));
    }

    /**
     * Clear component selections in modal
     */
    private clearModalComponents(): void {
        this.modalSelectedComponents = [];
        this.availableComponents = [];
        this.componentSearchTerm = '';
        this.componentCurrentPage = 1;
    }

    /**
     * Load available payroll components
     */
    loadAvailableComponents(): void {
        this.isLoadingComponents = true;
        this.payrollComponentsService.getAllComponent(
            this.componentCurrentPage,
            this.componentItemsPerPage,
            { search: this.componentSearchTerm || undefined }
        ).subscribe({
            next: (response) => {
                // Filter components to show only "Off Cycle" status
                const offCycleComponents = response.data.list_items.filter(
                    (item: any) => item.component_status?.name === 'Off Cycle'
                );

                this.componentCurrentPage = Number(response.data.page);
                this.componentTotalItems = offCycleComponents.length;
                this.componentTotalPages = Math.ceil(offCycleComponents.length / this.componentItemsPerPage);

                this.availableComponents = offCycleComponents.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    component_type: item.component_type?.name || 'N/A',
                    classification: item.classification.name,
                    payroll_type: item.component_status?.name || '-',
                    show_in_payslip: item.show_in_payslip,
                    show_in_payslip_label: item.show_in_payslip ? 'Shown' : 'Hidden',
                    status: item.is_active ? 'Active' : 'Inactive',
                }));
                this.isLoadingComponents = false;
            },
            error: (err) => {
                console.error('Error loading components:', err);
                this.isLoadingComponents = false;
            }
        });
    }

    /**
     * Toggle component selection
     */
    toggleComponentSelection(component: any): void {
        const index = this.modalSelectedComponents.findIndex(c => c.id === component.id);
        if (index > -1) {
            this.modalSelectedComponents.splice(index, 1);
        } else {
            this.modalSelectedComponents.push(JSON.parse(JSON.stringify(component)));
        }
    }

    /**
     * Check if component is selected
     */
    isComponentSelected(component: any): boolean {
        return this.modalSelectedComponents.some(c => c.id === component.id);
    }

    /**
     * Select/Deselect all components on current page
     */
    toggleAllComponentsOnPage(): void {
        const currentPageComponents = this.getComponentsForCurrentPage();
        const allSelected = currentPageComponents.every(comp => this.isComponentSelected(comp));

        if (allSelected) {
            // Deselect all on current page
            currentPageComponents.forEach(comp => {
                const index = this.modalSelectedComponents.findIndex(c => c.id === comp.id);
                if (index > -1) {
                    this.modalSelectedComponents.splice(index, 1);
                }
            });
        } else {
            // Select all on current page
            currentPageComponents.forEach(comp => {
                if (!this.isComponentSelected(comp)) {
                    this.modalSelectedComponents.push(JSON.parse(JSON.stringify(comp)));
                }
            });
        }
    }

    /**
     * Check if all components on current page are selected
     */
    isAllComponentsOnPageSelected(): boolean {
        const currentPageComponents = this.getComponentsForCurrentPage();
        return currentPageComponents.length > 0 && currentPageComponents.every(comp => this.isComponentSelected(comp));
    }

    /**
     * Get components for current page
     */
    private getComponentsForCurrentPage(): any[] {
        const start = (this.componentCurrentPage - 1) * this.componentItemsPerPage;
        const end = start + this.componentItemsPerPage;
        return this.availableComponents.slice(start, end);
    }

    /**
     * Save selected components - copy modal selections to main
     */
    saveSelectedComponents(): void {
        this.selectedComponents = JSON.parse(JSON.stringify(this.modalSelectedComponents));
        this.componentFilterBox.closeOverlay();
        this.updateSelectedComponentsTable();
    }

    /**
     * Close component selection overlay
     */
    closeComponentSelection(): void {
        this.clearModalComponents();
        this.componentFilterBox.closeOverlay();
    }

    /**
     * Remove component from selection
     */
    removeComponent(component: any): void {
        const index = this.selectedComponents.findIndex(c => c.id === component.id);
        if (index > -1) {
            this.selectedComponents.splice(index, 1);
        }
        this.updateSelectedComponentsTable();
    }

    /**
     * Update selected components table display
     */
    updateSelectedComponentsTable(): void {
        // This will trigger change detection for the table
        this.selectedComponents = [...this.selectedComponents];
    }

    /**
     * Get components page for table pagination
     */
    getComponentsPage(): any[] {
        // In a real scenario, you'd implement proper pagination
        return this.selectedComponents;
    }

    /**
     * Check if there are selected components
     */
    hasSelectedComponents(): boolean {
        return this.selectedComponents.length > 0;
    }

    /**
     * Trigger component search
     */
    onComponentSearch(searchTerm: string): void {
        this.componentSearchTerm = searchTerm;
        this.componentCurrentPage = 1;
        this.loadAvailableComponents();
    }

    /**
     * Handle component page change
     */
    onComponentPageChange(page: number): void {
        this.componentCurrentPage = page;
        this.loadAvailableComponents();
    }

    /**
     * Handle component items per page change
     */
    onComponentItemsPerPageChange(itemsPerPage: number): void {
        this.componentItemsPerPage = itemsPerPage;
        this.componentCurrentPage = 1;
        this.loadAvailableComponents();
    }
}

