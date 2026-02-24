import { Component, inject, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TableComponent } from '../../../shared/table/table.component';
import { LeaveBalanceService } from 'app/core/services/attendance/leave-balance/leave-balance.service';
import { ILeaveBalance, ILeaveBalanceFilters, ILeaveBalanceResponse } from 'app/core/models/leave-balance';
import { EmployeeService } from 'app/core/services/personnel/employees/employee.service';
import { LeaveTypeService } from 'app/core/services/attendance/leave-type/leave-type.service';
import { NgxPaginationModule } from "ngx-pagination";

@Component({
    selector: 'app-leave-balance',
    imports: [PageHeaderComponent, OverlayFilterBoxComponent, TableComponent, FormsModule, ReactiveFormsModule, NgxPaginationModule],
    templateUrl: './leave-balance.component.html',
    styleUrls: ['./leave-balance.component.css']
})
export class LeaveBalanceComponent implements OnInit, OnDestroy {

    constructor(
        private route: ActivatedRoute,
        private toasterMessageService: ToasterMessageService,
        private toastr: ToastrService,
        private fb: FormBuilder
    ) { }

    // Overlay references
    @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
    @ViewChild('editBox') editBox!: OverlayFilterBoxComponent;
    private leaveBalanceService = inject(LeaveBalanceService);
    private employeeService = inject(EmployeeService);
    private leaveTypeService = inject(LeaveTypeService);
    private toasterService = inject(ToasterMessageService);
    filterForm!: FormGroup;
    searchTerm: string = '';
    sortDirection: string = 'asc';
    currentSortColumn: string = '';
    private searchSubject = new Subject<string>();
    private employeesSubscription: Subscription | undefined;
    private leaveTypesSubscription: Subscription | undefined;
    private leaveBalancesSubscription: Subscription | undefined;
    private updateLeaveBalanceSubscription: Subscription | undefined;
    private destroy$ = new Subject<void>();
    isLoading: boolean = false;

    // Filter overlay: loading states and cache so we don't refetch when reopening
    isLoadingEmployees: boolean = false;
    isLoadingLeaveTypes: boolean = false;
    employees: any[] = [];
    leaveTypes: any[] = [];
    private employeesLoaded = false;
    private leaveTypesLoaded = false;

    loadData: boolean = false;

    leaveBalances: ILeaveBalance[] = [];

    totalItems = 0;
    totalPages = 0;
    currentPage = 1;
    itemsPerPage = 10;

    /** Applied filters sent to API; used on every fetch (page change, search, etc.) so filtering is server-side over full dataset */
    private appliedFilters: ILeaveBalanceFilters | undefined;

    ngOnInit(): void {
        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe(params => {
                this.currentPage = +params['page'] || 1;
                this.getAllLLeaveBalances(this.currentPage, this.searchTerm, this.appliedFilters);
            });

        this.toasterMessageService.currentMessage$
            .pipe(
                filter(msg => !!msg && msg.trim() !== ''),
                takeUntil(this.destroy$)
            )
            .subscribe(msg => {
                this.toastr.clear();
                this.toastr.success(msg, '', { timeOut: 3000 });
                this.toasterMessageService.clearMessage();
            });

        this.searchSubject
            .pipe(debounceTime(300), takeUntil(this.destroy$))
            .subscribe(value => {
                this.currentPage = 1;
                this.getAllLLeaveBalances(1, value, this.appliedFilters);
            });

        this.initializeFilterForm();
    }


    ngOnDestroy(): void {
        this.unsubscribeFilterOverlayRequests();
        if (this.leaveBalancesSubscription) {
            this.leaveBalancesSubscription.unsubscribe();
        }
        if (this.updateLeaveBalanceSubscription) {
            this.updateLeaveBalanceSubscription.unsubscribe();
        }
        this.searchSubject.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    /** Unsubscribe filter-overlay requests when overlay closes (and on component destroy). */
    onFilterOverlayClose(): void {
        this.unsubscribeFilterOverlayRequests();
    }

    private unsubscribeFilterOverlayRequests(): void {
        if (this.employeesSubscription) {
            this.employeesSubscription.unsubscribe();
            this.employeesSubscription = undefined;
        }
        if (this.leaveTypesSubscription) {
            this.leaveTypesSubscription.unsubscribe();
            this.leaveTypesSubscription = undefined;
        }
    }

    initializeFilterForm(): void {
        this.filterForm = this.fb.group({
            employee_id: [''],
            leave_id: [''],
            // status: ['']
        });
    }

    /** Load employees and leave types when filter overlay opens; uses cache if already loaded. */
    loadFilterData(): void {
        if (!this.employeesLoaded) {
            this.loadEmployeesData();
        }
        if (!this.leaveTypesLoaded) {
            this.loadLeaveTypesData();
        }
    }

    /** Load all employees for filter dropdown; response is cached so we don't call API again on reopen. */
    private loadEmployeesData(): void {
        this.unsubscribeFilterOverlayRequests();
        this.isLoadingEmployees = true;
        this.employeesSubscription = this.employeeService.getAllEmployees().subscribe({
            next: (res: any) => {
                const rawEmployees = res.data?.list_items || res.data || res;
                const list = Array.isArray(rawEmployees) ? rawEmployees : [];
                this.employees = list.map((emp: any) => ({
                    id: emp.object_info?.id || emp.id,
                    name: emp.object_info?.contact_info?.name || emp.name || 'N/A'
                })).sort((a: any, b: any) => a.name.localeCompare(b.name));
                this.employeesLoaded = true;
                this.isLoadingEmployees = false;
            },
            error: (err) => {
                console.error('Error loading employees:', err);
                this.isLoadingEmployees = false;
            }
        });
    }

    private loadLeaveTypesData(): void {
        if (this.leaveTypesSubscription) {
            this.leaveTypesSubscription.unsubscribe();
            this.leaveTypesSubscription = undefined;
        }
        this.isLoadingLeaveTypes = true;
        this.leaveTypesSubscription = this.leaveTypeService.getAllLeavetypes(1, 1000).subscribe({
            next: (res: any) => {
                const rawLeaveTypes = res.data?.list_items || res.data || res;
                this.leaveTypes = rawLeaveTypes.map((leave: any) => ({
                    id: leave.id,
                    name: leave.name || 'N/A'
                }));
                this.leaveTypesLoaded = true;
                this.isLoadingLeaveTypes = false;
            },
            error: (err) => {
                console.error('Error loading leave types:', err);
                this.isLoadingLeaveTypes = false;
            }
        });
    }



    getAllLLeaveBalances(pageNumber: number, searchTerm: string = '', filters?: ILeaveBalanceFilters): void {
        if (this.leaveBalancesSubscription) {
            this.leaveBalancesSubscription.unsubscribe();
        }
        this.loadData = true;
        const params: ILeaveBalanceFilters = {
            page: pageNumber,
            per_page: this.itemsPerPage,
            search: searchTerm || undefined,
            ...this.appliedFilters,
            ...filters
        };
        this.leaveBalancesSubscription = this.leaveBalanceService.getAllLeaveBalance(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
            next: (res: ILeaveBalanceResponse) => {
                this.leaveBalances = res.data.list_items;
                this.totalItems = res.data.total_items;
                this.totalPages = res.data.total_pages;
                this.loadData = false;
            },
            error: (err) => {
                console.error('Error fetching leave balances:', err);
                this.loadData = false;
            }
        });
    }

    onSearchChange(): void {
        this.searchSubject.next(this.searchTerm);
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.getAllLLeaveBalances(page, this.searchTerm, this.appliedFilters);
    }

    onItemsPerPageChange(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.getAllLLeaveBalances(1, this.searchTerm, this.appliedFilters);
    }





    sortBy() {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.leaveBalances.sort((a, b) => {
            const nameA = a.employee?.name?.toLowerCase() || '';
            const nameB = b.employee?.name?.toLowerCase() || '';
            if (this.sortDirection === 'asc') {
                return nameA.localeCompare(nameB);
            } else {
                return nameB.localeCompare(nameA);
            }
        });
    }



    applyFilters(): void {
        if (this.filterForm.valid) {
            const rawFilters = this.filterForm.value;
            this.appliedFilters = {
                leave_id: rawFilters.leave_id || undefined,
                employee_id: rawFilters.employee_id || undefined,
            };
            this.filterBox.closeOverlay();
            this.currentPage = 1;
            this.getAllLLeaveBalances(1, this.searchTerm, this.appliedFilters);
        }
    }

    resetFilterForm(): void {
        this.filterForm.reset({
            employee_id: '',
            leave_id: '',
            // status: ''
        });
        this.appliedFilters = undefined;
        this.filterBox.closeOverlay();
        this.currentPage = 1;
        this.getAllLLeaveBalances(1, this.searchTerm);
    }

    // Edit modal support
    selectedBalance: any = null;
    originalTotal: number | null = null;
    editTotal: number = 0;

    openEditModal(balance: any): void {
        this.selectedBalance = { ...balance };
        this.editTotal = this.selectedBalance.total;
        this.originalTotal = balance.total;
        this.editBox.openOverlay();
    }

    saveChanges(): void {
        this.isLoading = true;
        if (!this.selectedBalance) return;
        const data = {
            employee_id: this.selectedBalance.employee.id,
            leave_id: this.selectedBalance.leave.id,
            total: this.editTotal ?? this.selectedBalance.total
        };
        if (this.updateLeaveBalanceSubscription) {
            this.updateLeaveBalanceSubscription.unsubscribe();
        }
        this.updateLeaveBalanceSubscription = this.leaveBalanceService.updateLeaveBalance(data)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
            next: () => {
                this.isLoading = false;
                this.editBox.closeOverlay();
                this.selectedBalance.total = this.editTotal;
                this.toasterService.showSuccess('Leave balance updated successfully', "Updated Successfully");
                this.getAllLLeaveBalances(this.currentPage, this.searchTerm, this.appliedFilters);
            },
            error: (err) => {
                this.isLoading = false;
                this.toasterService.showError('Error updating leave balance');
                console.error('Error updating leave balance:', err);
            }
        });
    }

    discardChanges(): void {
        this.selectedBalance = null;
        this.editBox.closeOverlay();
    }
}