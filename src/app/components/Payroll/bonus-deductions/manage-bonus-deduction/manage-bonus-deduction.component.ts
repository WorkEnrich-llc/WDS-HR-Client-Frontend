
import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { HttpClient } from '@angular/common/http';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { SalaryPortionsService } from '../../../../core/services/payroll/salary-portions/salary-portions.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BonusDeductionsService } from '../bonus-deductions.service';

@Component({
    selector: 'app-manage-bonus-deduction',
    standalone: true,
    imports: [CommonModule, PageHeaderComponent, ReactiveFormsModule, FormsModule, TableComponent, OverlayFilterBoxComponent],
    templateUrl: './manage-bonus-deduction.component.html',
    styleUrls: ['./manage-bonus-deduction.component.css']
})
export class ManageBonusDeductionComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private formBuilder = inject(FormBuilder);
    private http = inject(HttpClient);
    private departmentsService = inject(DepartmentsService);
    private branchesService = inject(BranchesService);
    private employeeService = inject(EmployeeService);
    private salaryPortionsService = inject(SalaryPortionsService);
    private bonusDeductionsService = inject(BonusDeductionsService);
    private toaster = inject(ToasterMessageService);

    @ViewChild('departmentFilterBox') departmentFilterBox!: OverlayFilterBoxComponent;

    // Form
    bonusDeductionForm!: FormGroup;
    isSubmitting: boolean = false;
    isLoadingEdit: boolean = false;
    editLoadError: string | null = null;
    formErrors: any = {};

    // Recipients per type
    selectedDepartments: any[] = [];
    selectedEmployees: any[] = [];
    selectedBranches: any[] = [];
    selectedCompanies: any[] = [];
    selectedSections: any[] = [];
    // Temporary selections for modal (only applied on confirm)
    tempSelectedDepartments: any[] = [];
    tempSelectedEmployees: any[] = [];
    tempSelectedBranches: any[] = [];
    tempSelectedCompanies: any[] = [];
    tempSelectedSections: any[] = [];
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

    // Salary portions config fetched on start
    salaryPortions: any = null;

    // Edit mode
    isEditMode: boolean = false;
    editId: string | number | null = null;
    originalRecipients: any[] = []; // Store original recipients for tracking deletions

    // Header + navigation
    breadcrumbs: { label: string; link?: string }[] = [
        { label: 'Payroll', link: '/payroll' },
        { label: 'Bonus & Deductions', link: '/bonus-deductions/all-bonus-deductions' },
        { label: 'Create Entry' }
    ];
    pageTitle: string = 'Add Bonus or Deduction';
    todayFormatted: string = new Date().toISOString().slice(0, 10);
    currentTab: 'main-info' | 'recipients' = 'main-info';

    // --- Recipient selection logic copied and adapted from create-announcement ---
    setRecipientType(type: 'department' | 'section' | 'employee' | 'branch' | 'company'): void {
        this.clearAllSelections();
        this.selectedRecipientType = type;
        this.modalSearchTerm = '';
        this.selectedSearchTerm = '';
        this.currentPage = 1;
        this.selectedDepartmentId = null;
    }

    private clearAllSelections(): void {
        this.selectedDepartments = [];
        this.selectedEmployees = [];
        this.selectedBranches = [];
        this.selectedCompanies = [];
        this.selectedSections = [];
        this.originalRecipients = []; // Clear original recipients too
        this.updateSelectedDepartmentsTable();
    }

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

    openDepartmentSelection(): void {
        this.clearModalSelections();
        this.departmentFilterBox.openOverlay();
        // Initialize temp arrays with current selections
        this.tempSelectedDepartments = [...this.selectedDepartments];
        this.tempSelectedEmployees = [...this.selectedEmployees];
        this.tempSelectedBranches = [...this.selectedBranches];
        this.tempSelectedCompanies = [...this.selectedCompanies];
        this.tempSelectedSections = [...this.selectedSections];
        this.currentPage = 1;

        // Load data based on selected recipient type
        if (this.selectedRecipientType === 'section') {
            this.loadDepartmentsForSections();
        } else {
            this.loadEntities();
        }
    }

    private clearModalSelections(): void {
        this.availableItems = [];
        this.availableDepartments = [];
        this.selectedDepartmentId = null;
        this.modalSearchTerm = '';
        this.currentPage = 1;
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
                next: (res: any) => finish(res, (x: any) => ({ id: x.id, code: x.code ?? x.id, name: x.contact_info?.name ?? x.name ?? (x.first_name ? `${x.first_name} ${x.last_name ?? ''}`.trim() : '') })),
                error: () => this.isLoadingItems = false
            });
        } else {
            finish({ data: { list_items: [], total_items: 0, total_pages: 1 } }, (x: any) => x);
        }
    }

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

    onSelectedSearchInput(): void {
        this.tableCurrentPage = 1;
        this.updateSelectedDepartmentsTable();
    }

    // Angular lifecycle
    ngOnInit(): void {
        // Optional: setup debounced search for selected table
        this.searchSubscription = this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(() => {
            this.tableCurrentPage = 1;
            this.updateSelectedDepartmentsTable();
        });

        // Check for edit mode

        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.isEditMode = true;
                this.editId = id;
                this.isLoadingEdit = true;
                this.editLoadError = null;
                // Update page title and breadcrumbs for edit mode
                this.pageTitle = 'Edit Bonus or Deduction';
                this.breadcrumbs = [
                    { label: 'Payroll', link: '/payroll' },
                    { label: 'Bonus & Deductions', link: '/bonus-deductions/all-bonus-deductions' },
                    { label: 'Edit Entry' }
                ];
                this.bonusDeductionsService.getBonusDeductionById(Number(id)).subscribe({
                    next: (response) => {
                        const data = (response as any).data?.object_info;

                        if (data && this.bonusDeductionForm) {
                            // Get the correct salary portion name by matching id with index
                            const salaryPortionName = this.getSalaryPortionNameById(data.salary_portion?.id);

                            // Patch form with data from response
                            this.bonusDeductionForm.patchValue({
                                title: data.title || '',
                                classification: data.classification?.id === 4 ? 'bonus' : 'deduction',
                                date: data.date || '',
                                days: data.days || 1,
                                salaryPortion: salaryPortionName || ''
                            });

                            // Patch recipients based on related_to type
                            this.populateRecipientsFromResponse(data);
                        }
                        this.isLoadingEdit = false;
                    },
                    error: (error) => {
                        this.editLoadError = 'Failed to load bonus/deduction.';
                        this.isLoadingEdit = false;
                    }
                });
            }
        });

        // Load salary portions configuration from API on start
        this.loadSalaryPortions();

        // Ensure form exists
        if (!this.bonusDeductionForm) {
            this.bonusDeductionForm = this.formBuilder.group({
                title: ['', [Validators.required, Validators.minLength(2)]],
                classification: ['', [Validators.required]],
                date: ['', [Validators.required, this.notPreviousMonthValidator()]],
                days: [1, [Validators.required, Validators.pattern(/^\d+$/)]],
                salaryPortion: ['', [Validators.required]],
            });
        }
    }

    notPreviousMonthValidator() {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const selectedDate = new Date(control.value);
            const today = new Date();

            // Get first day of current month
            const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            // Check if selected date is before the first day of current month
            if (selectedDate < firstDayOfCurrentMonth) {
                return { previousMonth: true };
            }

            return null;
        };
    }

    /**
     * Populate recipients from the getBonusDeductionById response
     */
    private populateRecipientsFromResponse(data: any): void {
        // Determine recipient type from related_to
        const relatedToMap: Record<number, 'department' | 'section' | 'employee' | 'branch' | 'company'> = {
            1: 'department',
            2: 'section',
            3: 'employee',
            4: 'branch',
            5: 'company'
        };

        const relatedTo = data.related_to?.id || data.related_to;
        this.selectedRecipientType = relatedToMap[relatedTo] || 'department';

        // Clear all selections first
        this.clearAllSelections();

        // Populate recipients based on type
        if (data.sub_related && Array.isArray(data.sub_related)) {
            const recipients = data.sub_related.map((item: any) => ({
                id: item.related_id || item.id,
                code: item.code || '',
                name: item.name || ''
            }));

            // Store original recipients for tracking deletions
            this.originalRecipients = [...recipients];

            switch (relatedTo) {
                case 1:
                    this.selectedDepartments = recipients;
                    break;
                case 2:
                    this.selectedSections = recipients;
                    break;
                case 3:
                    this.selectedEmployees = recipients;
                    break;
                case 4:
                    this.selectedBranches = recipients;
                    break;
                case 5:
                    this.selectedCompanies = recipients;
                    break;
            }
        }

        // Update the selected recipients table display
        this.updateSelectedDepartmentsTable();
    }

    /**
     * Get salary portion name by matching the id with the index in settings
     * The salary_portion.id from getBonusDeductionById corresponds to the index in salary portions settings
     */
    private getSalaryPortionNameById(salaryPortionId: number | undefined): string {
        if (!salaryPortionId || !this.salaryPortions?.settings) {
            return '';
        }
        const portion = this.salaryPortions.settings.find((s: any) => s.index === salaryPortionId);
        return portion?.name || '';
    }

    /**
     * Fetch salary portions config
     */
    private loadSalaryPortions(): void {
        this.salaryPortionsService.single().subscribe({
            next: (res: any) => {
                this.salaryPortions = res;
                // Set default selection if provided
                const def = this.salaryPortions?.settings?.find((s: any) => s.default);
                if (def) {
                    this.bonusDeductionForm.get('salaryPortion')?.setValue(def.name, { emitEvent: false });
                }
            },
            error: () => {
                // Silently ignore for now; UI uses static options
            }
        });
    }

    ngOnDestroy(): void {
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
        }
    }

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
     * Get temporary selection array (used while modal is open)
     */
    private getTempSelectedArray(): any[] {
        switch (this.selectedRecipientType) {
            case 'employee': return this.tempSelectedEmployees;
            case 'branch': return this.tempSelectedBranches;
            case 'company': return this.tempSelectedCompanies;
            case 'section': return this.tempSelectedSections;
            default: return this.tempSelectedDepartments;
        }
    }

    /**
     * Toggle selection in modal using temporary array
     */
    toggleDepartmentSelection(row: any): void {
        const arr = this.getTempSelectedArray();
        const idx = arr.findIndex((d: any) => d.id === row.id);
        if (idx > -1) {
            arr.splice(idx, 1);
        } else {
            arr.push(row);
        }
    }

    /**
     * Is item selected in the modal (temporary array)
     */
    isDepartmentSelected(row: any): boolean {
        return this.getTempSelectedArray().some(d => d.id === row.id);
    }

    /**
     * Check if all items on current modal page are selected
     */
    isAllCurrentPageSelected(): boolean {
        const currentPageItems = this.getCurrentPageDepartments();
        return currentPageItems.length > 0 && currentPageItems.every(item => this.isDepartmentSelected(item));
    }

    /**
     * Select/Deselect all items on current modal page
     */
    selectAllEntities(): void {
        const currentPageItems = this.getCurrentPageDepartments();
        const allSelected = currentPageItems.every((item: any) => this.isDepartmentSelected(item));

        if (allSelected) {
            // Deselect all on current page
            currentPageItems.forEach((item: any) => {
                const arr = this.getTempSelectedArray();
                const index = arr.findIndex(d => d.id === item.id);
                if (index > -1) { arr.splice(index, 1); }
            });
        } else {
            // Select all on current page
            currentPageItems.forEach((item: any) => {
                if (!this.isDepartmentSelected(item)) { this.getTempSelectedArray().push(item); }
            });
        }
    }

    /**
     * Confirm selections: commit temporary arrays to permanent arrays and update table
     */
    saveSelectedDepartments(): void {
        // Commit temp selections to permanent based on type
        switch (this.selectedRecipientType) {
            case 'employee':
                this.selectedEmployees = [...this.tempSelectedEmployees];
                break;
            case 'branch':
                this.selectedBranches = [...this.tempSelectedBranches];
                break;
            case 'company':
                this.selectedCompanies = [...this.tempSelectedCompanies];
                break;
            case 'section':
                this.selectedSections = [...this.tempSelectedSections];
                break;
            default:
                this.selectedDepartments = [...this.tempSelectedDepartments];
                break;
        }

        this.departmentFilterBox.closeOverlay();
        this.updateSelectedDepartmentsTable();
    }

    /**
     * Items visible on current modal page (used for select all)
     */
    getCurrentPageDepartments(): any[] {
        return this.availableItems || [];
    }

    /**
     * Update the outside selected table meta/pagination based on current selections and search
     */
    private updateSelectedDepartmentsTable(): void {
        const allSelected = this.getSelectedArray();
        const term = (this.selectedSearchTerm || '').toLowerCase();
        const filtered = term
            ? allSelected.filter((item: any) =>
                `${item.code ?? ''}`.toLowerCase().includes(term) || `${item.name ?? ''}`.toLowerCase().includes(term)
            )
            : allSelected;

        this.tableTotalItems = filtered.length;
        const startIndex = (this.tableCurrentPage - 1) * this.tableItemsPerPage;
        const endIndex = startIndex + this.tableItemsPerPage;
        // Optionally set a derived page array if template needs it
        // This component uses getSelectedDepartmentsPage() in template; ensure it exists.
    }

    /**
     * Page slice of selected items for the outside table
     */
    getSelectedDepartmentsPage(): any[] {
        const allSelected = this.getSelectedArray();
        const term = (this.selectedSearchTerm || '').toLowerCase();
        const filtered = term
            ? allSelected.filter((item: any) =>
                `${item.code ?? ''}`.toLowerCase().includes(term) || `${item.name ?? ''}`.toLowerCase().includes(term)
            )
            : allSelected;
        const startIndex = (this.tableCurrentPage - 1) * this.tableItemsPerPage;
        const endIndex = startIndex + this.tableItemsPerPage;
        return filtered.slice(startIndex, endIndex);
    }

    // ---- Page navigation and header actions ----
    isFormValidForNext(): boolean {
        return !!this.bonusDeductionForm && this.bonusDeductionForm.valid;
    }

    goToNextTab(): void {
        this.currentTab = 'recipients';
    }

    goToPreviousTab(): void {
        this.currentTab = 'main-info';
    }

    onDiscard(): void {
        // Clear form and selections
        this.bonusDeductionForm.reset();
        this.clearAllSelections();
        this.selectedRecipientType = 'department';
        this.currentTab = 'main-info';
    }

    onSubmit(): void {
        if (!this.bonusDeductionForm.valid || !this.hasSelectedRecipients()) {
            return;
        }
        this.isSubmitting = true;

        // Get form values
        const formValue = this.bonusDeductionForm.value;

        // Get selected recipients
        const selectedArray = this.getSelectedArray();

        // Convert classification to number: 3 = Deduction, 4 = Bonus
        const classificationValue = formValue.classification === 'bonus' ? 4 : 3;

        // Find salary portion index by name
        const selectedSalaryPortion = this.salaryPortions?.settings?.find(
            (sp: any) => sp.name === formValue.salaryPortion
        );
        const salaryPortionId = selectedSalaryPortion?.index ? Number(selectedSalaryPortion.index) : null;

        // Map recipient_type to related_to number
        const relatedToMap: Record<typeof this.selectedRecipientType, number> = {
            department: 1,
            section: 2,
            employee: 3,
            branch: 4,
            company: 5
        };
        const relatedTo = relatedToMap[this.selectedRecipientType];

        // Construct payload based on related_to type
        const requestData: any = {
            title: formValue.title,
            date: formValue.date,
            classification: classificationValue,
            days: Number(formValue.days),
            salary_portion: salaryPortionId,
            related_to: relatedTo // 1: Departments, 2: Sections, 3: Employee, 4: Branches, 5: Company
        };

        // Add related_to_main_id for departments, sections, or branches
        // If related_to is 1, 2, or 4, this represents the department_id, section_id, or branch_id respectively
        if (relatedTo === 1 || relatedTo === 2 || relatedTo === 4) {
            requestData.related_to_main_id = selectedArray.length > 0 ? selectedArray[0].id : null;
        }

        // Add related_to_employee_ids for employees
        if (relatedTo === 3) {
            requestData.related_to_employee_ids = selectedArray.map(item => item.id);
        } else {
            // Send empty array if not employee type
            requestData.related_to_employee_ids = [];
        }

        // Add remove_related_ids for updates (track deleted recipients)
        if (this.isEditMode) {
            // Find recipients that were removed by comparing original with current
            const currentIds = selectedArray.map(item => item.id);
            const removedRecipients = this.originalRecipients.filter(
                original => !currentIds.includes(original.id)
            );
            requestData.remove_related_ids = removedRecipients.map(item => item.id);
        }

        // Wrap payload in request_data for API
        const payload = { request_data: requestData };

        // Call API - create or update based on edit mode
        const apiCall = this.isEditMode
            ? this.bonusDeductionsService.updateBonusDeduction(this.editId!, payload)
            : this.bonusDeductionsService.createBonusDeduction(requestData);
        apiCall.subscribe({
            next: (response) => {
                this.isSubmitting = false;
                const action = this.isEditMode ? 'Updated' : 'Saved';
                this.toaster.showSuccess(`${action} successfully!`);
                this.router.navigate(['/bonus-deductions/all-bonus-deductions']);
            },
            error: (error) => {
                this.isSubmitting = false;
                const action = this.isEditMode ? 'updating' : 'saving';
                this.toaster.showError(`Error ${action} bonus/deduction.`);
                console.error(`Error ${action} Bonus/Deduction:`, error);
            }
        });
    }

    getCompanyName(): string {
        // Placeholder: replace with actual company name source
        return 'Company';
    }

    hasSelectedRecipients(): boolean {
        if (this.selectedRecipientType === 'company') {
            return true;
        }
        const arr = this.getSelectedArray();
        return Array.isArray(arr) && arr.length > 0;
    }

    // ---- Selected table pagination handlers ----
    shouldShowDepartmentsPagination(): boolean {
        return this.tableTotalItems > this.tableItemsPerPage;
    }

    onTablePageChange(page: number): void {
        this.tableCurrentPage = page;
        this.updateSelectedDepartmentsTable();
    }

    onTableItemsPerPageChange(size: number): void {
        this.tableItemsPerPage = size || 10;
        this.tableCurrentPage = 1;
        this.updateSelectedDepartmentsTable();
    }

    // ---- Modal search ----
    onModalSearchInput(_event: any): void {
        this.currentPage = 1;
        if (this.selectedRecipientType === 'section') {
            this.loadDepartmentsForSections();
        } else {
            this.loadEntities();
        }
    }

    /**
     * Modal table pagination: page change
     */
    onModalTablePageChange(page: number): void {
        this.currentPage = page || 1;
        if (this.selectedRecipientType !== 'section') {
            this.loadEntities();
        }
    }

    /**
     * Modal table pagination: items-per-page change
     */
    onModalTableItemsPerPageChange(size: number): void {
        this.itemsPerPage = size || 10;
        this.currentPage = 1;
        if (this.selectedRecipientType !== 'section') {
            this.loadEntities();
        }
    }

    /**
     * Discard modal selections and close overlay
     */
    closeDepartmentSelection(): void {
        // Reset temp arrays to current committed selections
        this.tempSelectedDepartments = [...this.selectedDepartments];
        this.tempSelectedEmployees = [...this.selectedEmployees];
        this.tempSelectedBranches = [...this.selectedBranches];
        this.tempSelectedCompanies = [...this.selectedCompanies];
        this.tempSelectedSections = [...this.selectedSections];
        this.departmentFilterBox.closeOverlay();
    }

    /**
     * Remove a selected item from the outside table (permanent array)
     */
    removeDepartment(row: any): void {
        const arr = this.getSelectedArray();
        const idx = arr.findIndex((d: any) => d.id === row.id);
        if (idx > -1) {
            arr.splice(idx, 1);
        }
        this.updateSelectedDepartmentsTable();
    }
}