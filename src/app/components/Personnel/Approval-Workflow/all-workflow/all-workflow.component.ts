import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';

import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged, filter, map, Subject, Subscription, switchMap } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkflowService } from '../../../../core/services/personnel/workflows/workflow.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-all-workflow',
  imports: [PageHeaderComponent, TableComponent, ReactiveFormsModule, OverlayFilterBoxComponent, RouterLink, FormsModule, DatePipe],
  providers: [DatePipe],
  templateUrl: './all-workflow.component.html',
  styleUrl: './all-workflow.component.css'
})
export class AllWorkflowComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private _DepartmentsService: DepartmentsService, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder, private _WorkflowService: WorkflowService) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);

  workflows: any[] = [];
  departments: any[] = [];
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalpages: number = 0;
  loadData: boolean = true;
  loadingDepartments: boolean = false;
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;
  private searchSubscription!: Subscription;
  private routeParamsSubscription!: Subscription;
  private getAllWorkflowsSubscription!: Subscription;
  private getAllDepartmentSubscription!: Subscription;


  ngOnInit(): void {
    // this.route.queryParams.subscribe(params => {
    //   this.currentPage = +params['page'] || 1;
    //   this.getAllWorkflows(this.currentPage);
    // });

    this.filterForm = this.fb.group({
      department: ''
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
      // Allow empty string to reset results, but filter out null/undefined
      filter((searchTerm: string) => searchTerm !== null && searchTerm !== undefined),
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
        return this._WorkflowService.getAllWorkFlow(this.currentPage, this.itemsPerPage, {
          search: searchTerm.trim()
        });
      })
    ).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.workflows = response.data.list_items;
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

    // Don't load departments on init - only load when filter overlay opens
    this.routeParamsSubscription = this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('workflow/all-workflows') || 1;
      this.currentPage = pageFromUrl;
      this.getAllWorkflows(pageFromUrl);
    });


  }

  getAllWorkflows(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      department?: string;
    }
  ) {
    // Unsubscribe from previous call if it exists
    if (this.getAllWorkflowsSubscription) {
      this.getAllWorkflowsSubscription.unsubscribe();
    }

    this.loadData = true;
    this.getAllWorkflowsSubscription = this._WorkflowService.getAllWorkFlow(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.workflows = response.data.list_items;
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


  getAllDepartment(pageNumber: number, searchTerm: string = '') {
    // Unsubscribe from previous call if it exists
    if (this.getAllDepartmentSubscription) {
      this.getAllDepartmentSubscription.unsubscribe();
    }

    this.loadingDepartments = true;
    this.getAllDepartmentSubscription = this._DepartmentsService.getAllDepartment(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {
        this.departments = response.data.list_items;
        this.loadingDepartments = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.loadingDepartments = false;
      }
    });
  }

  openFilterOverlay(): void {
    // Load departments when opening the filter overlay (only if not already loaded)
    if (this.departments.length === 0 && !this.loadingDepartments) {
      this.getAllDepartment(1);
    }
    this.overlay.openOverlay();
  }

  onFilterOverlayClose(): void {
    // Unsubscribe from department API call when overlay is closed
    if (this.getAllDepartmentSubscription) {
      this.getAllDepartmentSubscription.unsubscribe();
      this.getAllDepartmentSubscription = null as any;
    }
  }


  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.workflows = this.workflows.sort((a, b) => {
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
    // If cleared, send empty string to trigger reset
    if (trimmedSearch.trim().length === 0) {
      this.searchSubject.next('');
    } else {
      this.searchSubject.next(trimmedSearch);
    }
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
    if (this.getAllWorkflowsSubscription) {
      this.getAllWorkflowsSubscription.unsubscribe();
    }
    if (this.getAllDepartmentSubscription) {
      this.getAllDepartmentSubscription.unsubscribe();
    }
    // Complete the subject to clean up
    this.searchSubject.complete();
  }
  resetFilterForm(): void {
    this.filterForm.reset({
      department: ''
    });
    this.filterBox.closeOverlay();
    this.onFilterOverlayClose(); // Unsubscribe when closing
    this.getAllWorkflows(this.currentPage);
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        department: rawFilters.department || undefined
      };

      this.filterBox.closeOverlay();
      this.onFilterOverlayClose(); // Unsubscribe when closing
      this.getAllWorkflows(this.currentPage, '', filters);
    }
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllWorkflows(this.currentPage);
  }
  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.getAllWorkflows(this.currentPage);
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

  navigateToEdit(workflowId: number): void {
    this.paginationState.setPage('workflow/all-workflows', this.currentPage);
    this.router.navigate(['/workflow/update-workflows', workflowId]);
  }


  navigateToView(workflowId: number): void {
    this.paginationState.setPage('workflow/all-workflows', this.currentPage);
    this.router.navigate(['/workflow/view-workflows', workflowId]);
  }


}
