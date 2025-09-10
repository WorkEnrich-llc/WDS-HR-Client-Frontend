import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { TableComponent } from '../../../shared/table/table.component';

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

    filterForm!: FormGroup;
    leaveBalances: any[] = [];
    searchTerm: string = '';
    sortDirection: string = 'asc';
    currentSortColumn: string = '';
    private searchSubject = new Subject<string>();
    private toasterSubscription!: Subscription;

    // Pagination properties
    currentPage: number = 1;
    itemsPerPage: number = 10;
    totalItems: number = 0;
    loadData: boolean = false;

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.currentPage = +params['page'] || 1;
            this.getLeaveBalances(this.currentPage);
        });

        this.toasterSubscription = this.toasterMessageService.currentMessage$
            .pipe(filter(msg => !!msg && msg.trim() !== ''))
            .subscribe(msg => {
                this.toastr.clear();
                this.toastr.success(msg, '', { timeOut: 3000 });
                this.toasterMessageService.clearMessage();
            });

        this.searchSubject
            .pipe(debounceTime(300))
            .subscribe(() => {
                this.currentPage = 1;
                this.getLeaveBalances(this.currentPage);
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
            employeeId: [''],
            leaveType: [''],
            status: ['']
        });
    }

    getLeaveBalances(page: number): void {
        this.loadData = true;

        // Mock data for demonstration - replace with actual service call
        setTimeout(() => {
            this.leaveBalances = [
                {
                    id: 1,
                    employee: { id: 1, name: 'Employee Name' },
                    leaveType: { id: 1, name: 'Leave Name' },
                    total: 21,
                    used: 8,
                    available: 14,
                    updated_at: new Date()
                },
                {
                    id: 2,
                    employee: { id: 2, name: 'Employee Name' },
                    leaveType: { id: 1, name: 'Leave Name' },
                    total: 21,
                    used: 8,
                    available: 14,
                    updated_at: new Date()
                },
                {
                    id: 3,
                    employee: { id: 3, name: 'Employee Name' },
                    leaveType: { id: 1, name: 'Leave Name' },
                    total: 21,
                    used: 8,
                    available: 14,
                    updated_at: new Date()
                }
            ];

            this.totalItems = this.leaveBalances.length;
            this.loadData = false;
        }, 1000);
    }

    onSearchChange(): void {
        this.searchSubject.next(this.searchTerm);
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.getLeaveBalances(page);
    }

    onItemsPerPageChange(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.getLeaveBalances(this.currentPage);
    }

    sortBy(): void {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';

        this.leaveBalances.sort((a, b) => {
            const nameA = a.employee.name.toLowerCase();
            const nameB = b.employee.name.toLowerCase();

            if (nameA < nameB) return this.sortDirection === 'asc' ? -1 : 1;
            if (nameA > nameB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    applyFilters(): void {
        this.currentPage = 1;
        this.getLeaveBalances(this.currentPage);
        this.filterBox.closeOverlay();
    }



    resetFilterForm(): void {
        this.filterForm.reset({
            employeeId: '',
            leaveType: '',
            status: ''
        });
        this.filterBox.closeOverlay();
        this.getLeaveBalances(this.currentPage);
    }

    // Edit modal support
    selectedBalance: any = null;
    editTotal: number = 0;

    openEditModal(balance: any): void {
        this.selectedBalance = { ...balance };
        this.editTotal = this.selectedBalance.total;
        this.editBox.openOverlay();
    }

    saveChanges(): void {
        if (this.selectedBalance) {
            // Update the total and recalculate available
            this.selectedBalance.total = this.editTotal;
            this.selectedBalance.available = this.editTotal - this.selectedBalance.used;
            // Replace the item in the array
            const idx = this.leaveBalances.findIndex(b => b.id === this.selectedBalance.id);
            if (idx !== -1) {
                this.leaveBalances[idx] = this.selectedBalance;
            }
        }
        this.editBox.closeOverlay();
    }

    discardChanges(): void {
        this.selectedBalance = null;
        this.editBox.closeOverlay();
    }
}
