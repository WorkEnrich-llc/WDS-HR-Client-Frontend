import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from './../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { DelegationService, DelegationItem, DelegationFilters } from '../../../../core/services/personnel/delegation/delegation.service';

@Component({
  selector: 'app-all-delegation',
  imports: [PageHeaderComponent, CommonModule, TableComponent, OverlayFilterBoxComponent, RouterLink, FormsModule, PopupComponent, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './all-delegation.component.html',
  styleUrl: './all-delegation.component.css'
})
export class AllDelegationComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  private delegationService = inject(DelegationService);
  private datePipe = inject(DatePipe)
  private toasterMessageService = inject(ToasterMessageService);
  private route = inject(ActivatedRoute);

  constructor(
  ) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  private fb = inject(FormBuilder);

  delegations: DelegationItem[] = [];
  filters: DelegationFilters = {};
  filteredDelegations: any[] = []; // For display purposes with transformed data
  loadData: boolean = true;
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;
  loading: boolean = true;
  // delete confirmation popup state
  deleteOpen: boolean = false;
  selectedCancelId: number | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      this.loadDelegations();
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        // this.toastr.clear();
        // this.toastr.success(msg, '', { timeOut: 3000 });
        // this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(600)).subscribe(value => {
      this.currentPage = 1;
      this.loadDelegations();
    });
    this.initializeFilterForm();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      status: [''],
      start_date: [''],
    });
  }



  loadDelegations(): void {
    this.loading = true;
    this.loadData = true;
    this.delegationService.getDelegations(this.currentPage, this.itemsPerPage, this.searchTerm, this.filters)
      .subscribe({
        next: (response) => {
          this.delegations = response.data.list_items;
          this.totalItems = response.data.total_items;
          this.transformDelegationsForDisplay();
          this.loading = false;
          this.loadData = false;
        },
        error: (error) => { }
      });
  }

  // Transform API data to match the template expectations
  transformDelegationsForDisplay(): void {
    this.filteredDelegations = this.delegations.map(delegation => ({
      id: delegation.id,
      delegatorName: delegation.delegator.name,
      delegateName: delegation.delegate.name,
      startDate: this.formatDate(delegation.from_date),
      endDate: this.formatDate(delegation.to_date),
      status: delegation.status,
      createdAt: this.formatDate(delegation.created_at)
    }));
  }

  // Format date for display
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'dd/MM/yyyy') || dateString;
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'badge-active';
      case 'pending':
        return 'badge-pending';
      case 'rejected':
        return 'badge-inactive';
      default:
        return 'badge-inactive';
    }
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.filteredDelegations = this.filteredDelegations.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }


  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.loadDelegations();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDelegations();
  }

  // Confirm and delete a delegation by id
  confirmAndCancel(id: number): void {
    this.loading = true;
    this.selectedCancelId = id;
    this.deleteOpen = true;
  }

  // Popup handlers
  openDeleteConfirm(id: number): void {
    this.selectedCancelId = id;
    this.deleteOpen = true;
  }

  closeDeleteConfirm(): void {
    this.selectedCancelId = null;
    this.deleteOpen = false;
  }

  confirmCancel(): void {
    this.loading = true;
    if (this.selectedCancelId == null) return;
    const id = this.selectedCancelId;
    this.closeDeleteConfirm();
    this.cancelDelegation(id);
  }


  // Call service to delete and refresh list
  cancelDelegation(id: number): void {
    // this.loading = true;
    this.delegationService.updateDelegationStatus(id, false).subscribe({
      next: () => {
        this.toasterMessageService.showSuccess('Delegation cancelled successfully');
        this.loadDelegations();
      },
      error: (err) => { }
    });
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
  }

  applyFilters(): void {
    this.loading = true;
    this.filters = { ...this.filterForm.value };
    Object.keys(this.filters).forEach(key => {
      if (!this.filters[key as keyof DelegationFilters]) {
        delete this.filters[key as keyof DelegationFilters];
      }
    });

    this.currentPage = 1;
    this.loadDelegations();
    this.filterBox.closeOverlay();
  }


  resetFilterForm(): void {
  this.filterForm.reset({
    status: '',
    start_date: '',
  });
  this.filters = {};
  this.currentPage = 1;
  this.loadDelegations();
  this.filterBox.closeOverlay();
}

}
