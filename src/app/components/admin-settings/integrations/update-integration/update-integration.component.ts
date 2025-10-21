import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IntegrationsService } from 'app/core/services/admin-settings/integrations/integrations.service';

@Component({
    selector: 'app-update-integration',
    imports: [CommonModule, PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule],
    templateUrl: '../create-integration/create-integration.component.html',
    styleUrls: ['../create-integration/create-integration.component.css']
})
export class UpdateIntegrationComponent implements OnInit {
    private integrationsService = inject(IntegrationsService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
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
        if (this.integrationForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            const formData = this.integrationForm.value;
            const noExpire = !formData.hasExpiryDate;

            const requestBody: any = {
                request_data: {
                    integration_id: this.integrationId,
                    features: {
                        features: this.selectedServices.map(s => s.service?.replace(/\s+/g, ''))?.length ? this.selectedServices.map(s => s.service?.replace(/\s+/g, '')) : (this.featureKeys ?? [])
                    },
                    starts_at: formData.startDate,
                    no_expire: noExpire
                }
            };

            if (!noExpire) {
                requestBody.request_data.expires_at = formData.expiryDate;
            }

            this.integrationsService.updateIntegrationEntry(requestBody).subscribe({
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
        this.loadIntegrationFeatures();
    }

    closeServiceFilter(): void {
        this.serviceFilterBox.closeOverlay();
        this.searchTerm = '';
        this.selectedModule = 'All Modules';
        this.currentPage = 1;
    }

    loadIntegrationFeatures(): void {
        this.isLoadingServices = true;
        this.integrationsService.getIntegrationFeatures().subscribe({
            next: (response) => {
                this.availableServices = this.flattenServices(response.data.subscription.features);
                this.filteredServices = this.availableServices;
                this.totalServices = this.availableServices.length;
                // capture features keys for request
                this.featureKeys = (response?.data?.object_info?.features?.features ?? []) as string[];
                this.isLoadingServices = false;
                this.applyPreselectedFeatures();
            },
            error: (error) => {
                console.error('Error loading integration features:', error);
                this.isLoadingServices = false;
            }
        });
    }

    flattenServices(features: any[]): any[] {
        const services: any[] = [];
        features.forEach(feature => {
            if (feature.sub_list && feature.sub_list.length > 0) {
                feature.sub_list.forEach((sub: any) => {
                    services.push({
                        id: sub.sub.id,
                        module: feature.main.name,
                        service: sub.sub.name,
                        selected: false
                    });
                });
            }
        });
        return services;
    }

    filterServices(): void {
        let filtered = this.availableServices;
        if (this.searchTerm.trim()) {
            filtered = filtered.filter(service =>
                service.service.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                service.module.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }
        if (this.selectedModule !== 'All Modules') {
            filtered = filtered.filter(service => service.module === this.selectedModule);
        }
        this.filteredServices = filtered;
        this.totalServices = filtered.length;
        this.currentPage = 1;
    }

    getUniqueModules(): string[] {
        const modules = [...new Set(this.availableServices.map(service => service.module))];
        return ['All Modules', ...modules];
    }

    toggleServiceSelection(service: any): void {
        service.selected = !service.selected;
    }

    selectAllServices(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageServices = this.filteredServices.slice(startIndex, endIndex);
        const allSelected = currentPageServices.every(service => service.selected);
        currentPageServices.forEach(service => {
            service.selected = allSelected;
        });
    }

    getCurrentPageServices(): any[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredServices.slice(startIndex, startIndex + this.itemsPerPage);
    }

    confirmServiceSelection(): void {
        this.selectedServices = this.availableServices.filter(service => service.selected);
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
        this.tableTotalItems = this.selectedServices.length;
        this.tableIsLoading = false;
    }

    private prefillFromDetails(): void {
        this.integrationsService.getIntegrationDetails(this.integrationId).subscribe({
            next: (response) => {
                const objectInfo = response?.data?.object_info;
                // No name provided in API response; keep name empty or from route param if available
                const startsAt = response?.data?.subscription?.created_at?.slice(0, 10) || '';
                const noExpire = objectInfo?.no_expire === true ? true : false;
                const expiresAt = objectInfo?.expires_at || '';

                this.integrationForm.patchValue({
                    name: '',
                    startDate: startsAt,
                    hasExpiryDate: !noExpire,
                    expiryDate: !noExpire && expiresAt ? expiresAt : ''
                });

                // capture features keys
                const featuresList: string[] = (objectInfo?.features?.features ?? []) as string[];
                this.featureKeys = featuresList;
            },
            error: (err) => {
                console.error('Failed to load integration details', err);
            }
        });
    }

    private applyPreselectedFeatures(): void {
        if (!this.featureKeys?.length || !this.availableServices?.length) return;
        // Match available services to feature keys by normalized name
        const normalizedSet = new Set(this.featureKeys.map(f => (f || '').toString().toLowerCase().replace(/\s+/g, '')));
        this.availableServices.forEach(svc => {
            const normalized = (svc.service || '').toString().toLowerCase().replace(/\s+/g, '');
            if (normalizedSet.has(normalized)) {
                svc.selected = true;
            }
        });
        this.selectedServices = this.availableServices.filter(s => s.selected);
        this.updateTableData();
    }
}


