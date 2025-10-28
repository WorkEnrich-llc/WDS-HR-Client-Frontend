import { Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, filter, skip, Subject, Subscription } from 'rxjs';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ApprovalRequestsService } from '../service/approval-requests.service';
import { ApprovalRequestItem, ApprovalRequestFilters } from '../../../../core/interfaces/approval-request';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-requests',
  imports: [PageHeaderComponent, TableComponent, CommonModule, OverlayFilterBoxComponent, RouterLink, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './all-requests.component.html',
  styleUrl: './all-requests.component.css'
})
export class AllRequestsComponent {
  filterForm!: FormGroup;
  constructor(
    private route: ActivatedRoute,
    private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private approvalRequestsService: ApprovalRequestsService
  ) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);

  approvalRequests: ApprovalRequestItem[] = [];
  loading: boolean = false;
  filters: ApprovalRequestFilters = {};

  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;

  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadApprovalRequests(this.currentPage);

    // this.route.queryParams.pipe(skip(1)).subscribe(params => {
    //   this.currentPage = +params['page'] || 1;
    //   this.loadApprovalRequests();
    // });

    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('requests/all-requests') || 1;
      this.currentPage = pageFromUrl;
      this.loadApprovalRequests(pageFromUrl);
    });


    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.filters.search = value;
      this.currentPage = 1;
      this.loadApprovalRequests(this.currentPage);
    });
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      status: [''],
      employee_id: [''],
      leave_type: [''],
      from_date: [''],
      to_date: [''],
      created_from: [''],
      created_to: ['']
    });
  }

  loadApprovalRequests(pageNumber: number): void {
    this.loading = true;
    this.currentPage = pageNumber;
    this.approvalRequestsService.getAllApprovalRequests(
      // this.currentPage,
      pageNumber,
      this.itemsPerPage,
      this.filters
    ).subscribe({
      next: (response) => {
        this.approvalRequests = response.data.list_items;
        this.totalItems = response.data.total_items;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading approval requests:', error);
        this.toastr.error('Failed to load approval requests', 'Error');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filters = { ...this.filterForm.value };
    // Remove empty values
    Object.keys(this.filters).forEach(key => {
      if (!this.filters[key as keyof ApprovalRequestFilters]) {
        delete this.filters[key as keyof ApprovalRequestFilters];
      }
    });

    this.currentPage = 1;
    this.loadApprovalRequests(this.currentPage);
    this.filterBox.closeOverlay();
  }

  sortBy(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.approvalRequests = this.approvalRequests.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      if (this.sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }

  resetFilterForm(): void {
    this.filterForm.reset();
    this.filters = {};
    this.currentPage = 1;
    this.loadApprovalRequests(this.currentPage);
    this.filterBox.closeOverlay();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.loadApprovalRequests(this.currentPage);
  }

  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.loadApprovalRequests(this.currentPage);
  // }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('...', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  // Helper methods to access nested properties for template
  getEmployeeName(request: ApprovalRequestItem): string {
    return request.contact_information?.name || 'N/A';
  }

  getEmployeeJobTitle(request: ApprovalRequestItem): string {
    return request.employee_info?.job_title || 'N/A';
  }

  getStatusName(request: ApprovalRequestItem): string {
    return request.status?.name || 'N/A';
  }

  getCurrentStep(request: ApprovalRequestItem): string {
    return request.current_step || 'N/A';
  }

  getReasonStatusName(request: ApprovalRequestItem): string {
    return request.reason?.status?.name || 'N/A';
  }

  getDateRange(request: ApprovalRequestItem): string {
    if (request.dates?.from_date && request.dates?.to_date) {
      return `${request.dates.from_date} - ${request.dates.to_date}`;
    }
    return 'N/A';
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }


  getWorkTypeDisplay(request: ApprovalRequestItem): string {
    switch (request.work_type) {

      case 'overtime':
        return 'Overtime';

      case 'leave':
        return request.leave?.name || 'Leave';
      case 'permission':
        if (request.permission?.late_arrive) {
          return 'Late Arrive';
        }
        if (request.permission?.early_leave) {
          return 'Early Leave';
        }
        return 'Permission';

      default:
        return request.work_type || 'N/A';
    }
  }

  navigateToView(requestId: number): void {
    this.paginationState.setPage('requests/all-requests', this.currentPage);
    this.router.navigate(['/requests/view-requests', requestId]);
  }
}
