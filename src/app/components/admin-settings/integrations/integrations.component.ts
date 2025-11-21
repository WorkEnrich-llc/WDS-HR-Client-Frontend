import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { TableComponent } from '../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../shared/overlay-filter-box/overlay-filter-box.component';
import { PopupComponent } from '../../shared/popup/popup.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { IntegrationsService } from '../../../core/services/admin-settings/integrations/integrations.service';
import { PaginationStateService } from '../../../core/services/pagination-state/pagination-state.service';
import { ToasterMessageService } from '../../../core/services/tostermessage/tostermessage.service';
import { UserStatus } from '../../../core/enums';

@Component({
    selector: 'app-integrations',
    imports: [CommonModule, PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, PopupComponent, FormsModule, ReactiveFormsModule, RouterLink],
    templateUrl: './integrations.component.html',
    styleUrls: ['./integrations.component.css']
})
export class IntegrationsComponent implements OnInit, OnDestroy {
    private integrationsService = inject(IntegrationsService);
    private paginationState = inject(PaginationStateService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private formBuilder = inject(FormBuilder);
    private toasterService = inject(ToasterMessageService);

    @ViewChild(OverlayFilterBoxComponent) filterBox!: OverlayFilterBoxComponent;

    // Table data
    integrations: any[] = [];
    searchTerm: string = '';
    trimmedSearchTerm: string = ''; // Store the trimmed search term to compare
    sortDirection: string = 'asc';
    currentSortColumn: string = '';
    totalItems: number = 0;
    currentPage: number = 1;
    itemsPerPage: number = 10;
    totalPages: number = 0;

    // Loading state
    loadData: boolean = false;

    // Search debounce
    private searchSubject = new Subject<string>();

    // Filter form
    filterForm!: FormGroup;
    currentFilters: any = {};

    // Status enum for template
    userStatus = UserStatus;

    // Copy state tracking
    copiedKeyId: number | null = null;

    // Modal state tracking
    isStatusModalOpen: boolean = false;
    selectedIntegration: any = null;
    modalAction: 'activate' | 'deactivate' | null = null;

    // Subscriptions for cleanup
    private integrationsSubscription?: Subscription;
    private searchSubscription?: Subscription;
    private queryParamsSubscription?: Subscription;
    private statusUpdateSubscription?: Subscription;

    // Breadcrumb data
    breadcrumb = [
        { label: 'Admin Settings', link: '/cloud' },
        { label: 'Integrations' }
    ];

    ngOnInit(): void {
        // Initialize filter form
        this.initializeFilterForm();

        // Handle pagination from URL
        this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
            const pageFromUrl = +params['page'] || this.paginationState.getPage('integrations') || 1;
            this.currentPage = pageFromUrl;
            this.getAllIntegrations(pageFromUrl);
        });

        // Setup search debounce
        this.searchSubscription = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
            this.currentPage = 1;
            this.getAllIntegrations(this.currentPage);
        });
    }

    ngOnDestroy(): void {
        this.unsubscribeAll();
    }

    /**
     * Unsubscribe from all active subscriptions
     */
    private unsubscribeAll(): void {
        if (this.integrationsSubscription) {
            this.integrationsSubscription.unsubscribe();
            this.integrationsSubscription = undefined;
        }
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
            this.searchSubscription = undefined;
        }
        if (this.queryParamsSubscription) {
            this.queryParamsSubscription.unsubscribe();
            this.queryParamsSubscription = undefined;
        }
        if (this.statusUpdateSubscription) {
            this.statusUpdateSubscription.unsubscribe();
            this.statusUpdateSubscription = undefined;
        }
    }

    /**
     * Initialize filter form
     */
    private initializeFilterForm(): void {
        this.filterForm = this.formBuilder.group({
            created_at: [''],
            expiry_at: [''],
            status: ['']
        });
    }

    /**
     * Get all integrations with pagination, search, and filters
     */
    getAllIntegrations(pageNumber: number = 1): void {
        // Unsubscribe from previous call if exists
        if (this.integrationsSubscription) {
            this.integrationsSubscription.unsubscribe();
        }

        this.loadData = true;

        // Use trimmed search term for API call
        this.integrationsSubscription = this.integrationsService.getAllIntegrations(pageNumber, this.itemsPerPage, this.trimmedSearchTerm, this.currentFilters)
            .subscribe({
                next: (response: any) => {
                    this.currentPage = Number(response.data.page);
                    this.totalItems = response.data.total_items;
                    this.totalPages = response.data.total_pages;

                    // Map the API response to table data to match the image structure
                    this.integrations = response.data.list_items.map((item: any, index: number) => ({
                        id: item.id,
                        integrationName: item.name || `Integration ${String(item.id).padStart(3, '0')}`,
                        createDate: this.formatDate(item.created_at),
                        expiryDate: this.formatExpiryDate(item.expires_at, item.no_expire),
                        status: this.getStatusInfo(item.status, item.expires_at),
                        originalStatus: item.status, // Store the original status from API
                        key: item.access_key || '--',
                        features: this.formatFeatures(item.features?.features || []),
                        createdBy: item.created_by || '--',
                        createdAt: item.created_at || '--',
                        noExpire: item.no_expire || false
                    }));

                    this.loadData = false;
                },
                error: (error: any) => {
                    console.error('Error fetching integrations:', error);
                    this.loadData = false;
                }
            });
    }

    /**
     * Format features array to string
     */
    private formatFeatures(features: string[]): string {
        return features.length > 0 ? features.join(', ') : 'None';
    }

    /**
     * Format date to DD/MM/YYYY format
     */
    private formatDate(dateString: string): string {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    }

    /**
     * Format expiry date - returns formatted date or message if no expiry
     */
    private formatExpiryDate(dateString: string, noExpire: boolean): string {
        if (noExpire || !dateString) {
            return 'No expiry date';
        }
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    }

    /**
     * Get status information with color and icon
     */
    private getStatusInfo(status: string, expiresAt: string): string {
        const now = new Date();
        const expiryDate = expiresAt ? new Date(expiresAt) : null;

        // Normalize status to lowercase for comparison
        const normalizedStatus = status?.toLowerCase() || '';

        // Check if pending
        if (normalizedStatus === 'pending') {
            return UserStatus.Pending;
        }

        // Check if revoked, inactive, or deactivated
        if (normalizedStatus === 'revoked' || normalizedStatus === 'inactive' || normalizedStatus === 'deactivated') {
            return UserStatus.Inactive;
        }

        // Check if expired based on expiry date
        if (expiryDate && expiryDate < now) {
            return UserStatus.Expired;
        }

        // Default to active
        return UserStatus.Active;
    }

    /**
     * Apply filters
     */
    filter(): void {
        if (this.filterForm.valid) {
            const rawFilters = this.filterForm.value;

            const filters = {
                created_at: rawFilters.created_at || undefined,
                expiry_at: rawFilters.expiry_at || undefined,
                status: rawFilters.status || undefined
            };

            this.currentFilters = filters;
            this.currentPage = 1;
            this.filterBox.closeOverlay();
            this.getAllIntegrations(this.currentPage);
        }
    }

    /**
     * Reset filter form
     */
    resetFilterForm(): void {
        this.filterForm.reset();
        this.currentFilters = {};
        this.currentPage = 1;
        this.getAllIntegrations(this.currentPage);
    }

    /**
     * Clear individual filter
     */
    clearFilter(filterName: string): void {
        this.filterForm.get(filterName)?.setValue('');
        this.currentFilters[filterName] = '';
    }


    /**
     * Handle search input change
     */
    onSearchChange(): void {
        // Trim the search term
        const trimmedSearch = this.searchTerm.trim();
        
        // Only send search request if the trimmed value is different from the previous trimmed value
        // This prevents sending requests when only leading/trailing spaces are added/removed
        if (trimmedSearch !== this.trimmedSearchTerm) {
            this.trimmedSearchTerm = trimmedSearch;
            // Update the input value to remove leading/trailing spaces
            if (this.searchTerm !== trimmedSearch) {
                this.searchTerm = trimmedSearch;
            }
            // Send the trimmed search term
            this.searchSubject.next(trimmedSearch);
        } else {
            // If only whitespace was added/removed, update the input value but don't send request
            if (this.searchTerm !== trimmedSearch) {
                this.searchTerm = trimmedSearch;
            }
        }
    }

    /**
     * Handle items per page change
     */
    onItemsPerPageChange(newItemsPerPage: number): void {
        this.itemsPerPage = newItemsPerPage;
        this.currentPage = 1;
        this.getAllIntegrations(this.currentPage);
    }

    /**
     * Handle page change
     */
    onPageChange(page: number): void {
        this.currentPage = page;
        this.paginationState.setPage('integrations', page);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { page },
            queryParamsHandling: 'merge'
        });
    }

    /**
     * Sort table data
     */
    sortBy(column: string): void {
        if (this.currentSortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortColumn = column;
            this.sortDirection = 'asc';
        }

        this.integrations.sort((a, b) => {
            const valueA = a[column]?.toString().toLowerCase() || '';
            const valueB = b[column]?.toString().toLowerCase() || '';

            if (this.sortDirection === 'asc') {
                return valueA.localeCompare(valueB);
            } else {
                return valueB.localeCompare(valueA);
            }
        });
    }

    /**
     * Copy integration key to clipboard
     */
    copyKey(key: string, integrationId: number): void {
        navigator.clipboard.writeText(key).then(() => {
            // Show visual feedback
            this.copiedKeyId = integrationId;

            // Show success toast
            this.toasterService.showSuccess('Integration key copied to clipboard!', 'Copied');

            // Reset visual feedback after 2 seconds
            setTimeout(() => {
                this.copiedKeyId = null;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy key: ', err);
            this.toasterService.showError('Failed to copy integration key', 'Copy Failed');
        });
    }

    /**
     * Edit integration
     */
    editIntegration(integration: any): void {
        this.router.navigate(['/integrations/update-integration', integration.id]);
    }

    /**
     * Open status modal (activate/deactivate)
     */
    toggleIntegrationStatus(integration: any): void {
        this.selectedIntegration = integration;
        this.modalAction = (integration.status === UserStatus.Active || integration.status === UserStatus.Pending) ? 'deactivate' : 'activate';
        this.isStatusModalOpen = true;
    }

    /**
     * Close status modal
     */
    closeStatusModal(): void {
        this.isStatusModalOpen = false;
        this.selectedIntegration = null;
        this.modalAction = null;
    }

    /**
     * Confirm status change (activate/deactivate)
     */
    confirmStatusChange(): void {
        if (!this.selectedIntegration || !this.modalAction) {
            return;
        }

        // Determine the status to send: true for activate, false for deactivate (revoke)
        const newStatus = this.modalAction === 'activate' ? true : false;

        // Unsubscribe from previous status update if exists
        if (this.statusUpdateSubscription) {
            this.statusUpdateSubscription.unsubscribe();
        }

        this.statusUpdateSubscription = this.integrationsService.updateIntegrationStatus(this.selectedIntegration.id, newStatus)
            .subscribe({
                next: (response) => {
                    const action = this.modalAction === 'deactivate' ? 'revoked' : 'activated';
                    this.toasterService.showSuccess(`Integration ${action} successfully`, 'Success');
                    this.closeStatusModal();
                    this.getAllIntegrations(this.currentPage);
                },
                error: (error) => {
                    console.error('Error updating integration status:', error);
                    const action = this.modalAction === 'deactivate' ? 'revoke' : 'activate';
                    this.toasterService.showError(`Failed to ${action} integration`, 'Error');
                    this.closeStatusModal();
                }
            });
    }

}

