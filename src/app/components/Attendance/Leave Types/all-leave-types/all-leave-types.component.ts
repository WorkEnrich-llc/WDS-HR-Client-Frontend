import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged, filter, Subject, Subscription, switchMap, of, map } from 'rxjs';
import { TableComponent } from '../../../shared/table/table.component';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-leave-types',
  imports: [PageHeaderComponent, RouterLink, OverlayFilterBoxComponent, TableComponent, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './all-leave-types.component.html',
  styleUrl: './all-leave-types.component.css'
})
export class AllLeaveTypesComponent implements OnInit, OnDestroy {


  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder, private _LeaveTypeService: LeaveTypeService) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


  filterForm!: FormGroup;
  leaveTypes: any[] = [];
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;
  private searchSubscription!: Subscription;
  private routeParamsSubscription!: Subscription;
  private getAllLeaveTypesSubscription!: Subscription;
  private paginationState = inject(PaginationStateService);
  private router = inject(Router)


  ngOnInit(): void {

    this.routeParamsSubscription = this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('leave-types/all-leave-types') || 1;
      this.currentPage = pageFromUrl;
      this.getAllJobTitles(pageFromUrl);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    // Improved search with switchMap, debounce, and whitespace handling
    this.searchSubscription = this.searchSubject.pipe(
      // Trim leading whitespace only (keep trailing spaces if user wants them)
      map((searchTerm: string) => searchTerm.trimStart()),
      // Filter out null/undefined and empty/whitespace-only strings - only send request when there's actual content
      filter((searchTerm: string) => searchTerm !== null && searchTerm !== undefined && searchTerm.trim().length > 0),
      // Debounce to avoid too many requests
      debounceTime(300),
      // Only proceed if the value has actually changed
      distinctUntilChanged(),
      // Cancel previous requests and switch to new one
      switchMap((searchTerm: string) => {
        // Reset to first page when searching
        this.currentPage = 1;
        this.loadData = true;
        // Return the HTTP observable - switchMap will cancel previous requests
        return this._LeaveTypeService.getAllLeavetypes(this.currentPage, this.itemsPerPage, {
          search: searchTerm.trim()
        });
      })
    ).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.leaveTypes = response.data.list_items;
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
        this.loadData = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.loadData = false;
      }
    });

    this.filterForm = this.fb.group({
      employment_type: [''],
      status: ['']
    });

  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
    if (this.getAllLeaveTypesSubscription) {
      this.getAllLeaveTypesSubscription.unsubscribe();
    }
    // Complete the subject to clean up
    this.searchSubject.complete();
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.leaveTypes = this.leaveTypes.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
      } else {
        return nameA < nameB ? 1 : (nameA > nameB ? -1 : 0);
      }
    });
  }

  onSearchChange() {
    // Trim leading whitespace before sending to subject
    const trimmedSearch = this.searchTerm.trimStart();
    this.searchSubject.next(trimmedSearch);
  }


  resetFilterForm(): void {
    this.filterForm.reset({
      employment_type: '',
      status: ''
    });
    this.filterBox.closeOverlay();
    this.getAllJobTitles(this.currentPage);
  }



  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        employment_type: rawFilters.employment_type || undefined,
        status: rawFilters.status || undefined
      };


      this.filterBox.closeOverlay();
      this.getAllJobTitles(this.currentPage, '', filters);
    }
  }

  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  loadData: boolean = true;
  getAllJobTitles(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      employment_type?: string;
      status?: string;
    }
  ) {
    // Unsubscribe from previous call if it exists
    if (this.getAllLeaveTypesSubscription) {
      this.getAllLeaveTypesSubscription.unsubscribe();
    }

    this.loadData = true;
    this.getAllLeaveTypesSubscription = this._LeaveTypeService.getAllLeavetypes(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.leaveTypes = response.data.list_items;
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
        this.loadData = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.loadData = false;
      }
    });
  }


  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllJobTitles(this.currentPage);
  }
  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.getAllJobTitles(this.currentPage);
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



  navigateToEdit(componentId: number): void {
    this.paginationState.setPage('leave-types/all-leave-types', this.currentPage);
    this.router.navigate(['/leave-types/update-leave-types', componentId]);
  }


  navigateToView(componentId: number): void {
    this.paginationState.setPage('leave-types/all-leave-types', this.currentPage);
    this.router.navigate(['/leave-types/view-leave-types', componentId]);
  }

}
