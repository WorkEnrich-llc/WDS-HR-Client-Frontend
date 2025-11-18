import { Component, inject, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { TableComponent } from '../../../shared/table/table.component';
import { LeaveBalanceService } from 'app/core/services/attendance/leave-balance/leave-balance.service';
import { ILeaveBalance, ILeaveBalanceFilters, ILeaveBalanceResponse } from 'app/core/models/leave-balance';

@Component({
    selector: 'app-leave-balance',
    imports: [PageHeaderComponent, CommonModule, OverlayFilterBoxComponent, TableComponent, FormsModule, ReactiveFormsModule],
    templateUrl: './leave-balance.component.html',
    styleUrls: ['./leave-balance.component.css']
})
export class LeaveBalanceComponent {

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
    private toasterService = inject(ToasterMessageService);
    filterForm!: FormGroup;
    searchTerm: string = '';
    sortDirection: string = 'asc';
    currentSortColumn: string = '';
    private searchSubject = new Subject<string>();
    private toasterSubscription!: Subscription;
    isLoading: boolean = false;

    loadData: boolean = false;

    leaveBalances: ILeaveBalance[] = [];

    totalItems = 0;
    totalPages = 0;
    currentPage = 1;
    itemsPerPage = 10;

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.currentPage = +params['page'] || 1;
            this.getAllLLeaveBalances(this.currentPage);
        });

        this.toasterSubscription = this.toasterMessageService.currentMessage$
            .pipe(filter(msg => !!msg && msg.trim() !== ''))
            .subscribe(msg => {
                this.toastr.clear();
                this.toastr.success(msg, '', { timeOut: 3000 });
                this.toasterMessageService.clearMessage();
            });

        this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
            this.getAllLLeaveBalances(this.currentPage, value);
        });

        this.initializeFilterForm();
    }

    ngOnDestroy(): void {
        if (this.toasterSubscription) {
            this.toasterSubscription.unsubscribe();
        }
        this.searchSubject.complete();
    }

    initializeFilterForm(): void {
        this.filterForm = this.fb.group({
            employee_id: [''],
            leave_id: [''],
            // status: ['']
        });
    }



    getAllLLeaveBalances(pageNumber: number, searchTerm: string = '', filters?: ILeaveBalanceFilters): void {
        this.loadData = true;
        this.leaveBalanceService.getAllLeaveBalance({
            page: pageNumber,
            per_page: this.itemsPerPage,
            search: searchTerm || undefined,
            ...filters
        }).subscribe({
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
        this.getAllLLeaveBalances(page);
    }

    onItemsPerPageChange(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.getAllLLeaveBalances(this.currentPage);
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
            const filters = {
                leave_id: rawFilters.leave_id || undefined,
                employee_id: rawFilters.employee_id || undefined,
            };
            this.filterBox.closeOverlay();
            this.getAllLLeaveBalances(this.currentPage, this.searchTerm, filters);
        }
    }



    resetFilterForm(): void {
        this.filterForm.reset({
            employee_id: '',
            leave_id: '',
            // status: ''
        });
        this.filterBox.closeOverlay();
        this.getAllLLeaveBalances(this.currentPage);
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
        this.leaveBalanceService.updateLeaveBalance(data).subscribe({
            next: () => {
                this.isLoading = false;
                this.editBox.closeOverlay();
                this.selectedBalance.total = this.editTotal;
                this.toasterService.showSuccess('Leave balance updated successfully');
                this.getAllLLeaveBalances(this.currentPage);
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
