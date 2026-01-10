import { DatePipe } from '@angular/common';
import { Component, inject, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from './../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { takeUntil, switchMap, distinctUntilChanged, map } from 'rxjs/operators';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { Employee } from '../../../../core/interfaces/employee';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';

@Component({
  selector: 'app-all-employees',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, RouterLink, FormsModule, ReactiveFormsModule, DatePipe],
  providers: [DatePipe],
  templateUrl: './all-employees.component.html',
  styleUrl: './all-employees.component.css'
})
export class AllEmployeesComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  private employeeService = inject(EmployeeService);
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);
  private departmentsService = inject(DepartmentsService);

  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService, private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  employees: Employee[] = [];
  filteredEmployees: any[] = []; // For display purposes with transformed data
  loadData: boolean = true;
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private activeFilters: any = {};
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;
  private routeSubscription!: Subscription;
  private searchSubscription!: Subscription;
  private destroy$ = new Subject<void>();
  private isInitialLoad: boolean = true;
  private isUpdatingQueryParams: boolean = false;
  private isChangingItemsPerPage: boolean = false;
  private lastLoadedPage: number = 0; // Initialize to 0 so initial load always happens
  loading: boolean = true;
  departments: any[] = [];
  private getAllDepartmentSubscription: any = null;
  loadingDepartments: boolean = false;


  ngOnInit(): void {
    // Initialize filter form first
    this.filterForm = this.fb.group({
      created_from: [''],
      created_to: [''],
      status: [''],
      contract_end_date: [''],
      contract_start_date: [''],
      department_id: [''],
    });

    // Load state from query params
    this.routeSubscription = this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        // Skip if we're programmatically updating query params
        if (this.isUpdatingQueryParams) {
          return;
        }

        // Track previous filters to detect changes
        const previousFilters = JSON.stringify(this.activeFilters);

        // Load pagination
        const pageFromUrl = +params['page'] || this.paginationState.getPage('employees/all-employees') || 1;
        this.currentPage = pageFromUrl;

        // Load search term
        if (params['search']) {
          this.searchTerm = decodeURIComponent(params['search']);
        } else {
          this.searchTerm = '';
        }

        // Load filters
        if (params['filters']) {
          try {
            const filters = JSON.parse(decodeURIComponent(params['filters']));
            this.activeFilters = filters;
            // Populate filter form
            this.filterForm.patchValue({
              status: filters.status || '',
              created_from: filters.created_from || '',
              created_to: filters.created_to || '',
              contract_end_date: filters.contract_end_date || '',
              contract_start_date: filters.contract_start_date || '',
              department_id: filters.department_id || ''
            });
          } catch (e) {
            console.error('Error parsing filters from query params:', e);
            this.activeFilters = {};
          }
        } else {
          // Clear filters if not in query params
          this.activeFilters = {};
          // Reset filter form when filters are cleared
          this.filterForm.patchValue({
            status: '',
            created_from: '',
            created_to: '',
            contract_end_date: '',
            contract_start_date: '',
            department_id: ''
          });
        }

        // Load items per page from 'view' parameter
        if (params['view']) {
          this.itemsPerPage = +params['view'] || 10;
        } else if (params['itemsPerPage']) {
          // Backward compatibility: if itemsPerPage exists but view doesn't, use it
          this.itemsPerPage = +params['itemsPerPage'] || 10;
        }

        // Check if filters changed or page changed
        const currentFilters = JSON.stringify(this.activeFilters);
        const filtersChanged = previousFilters !== currentFilters;
        const pageChanged = pageFromUrl !== this.lastLoadedPage;

        // Load employees if page changed, filters changed, or it's initial load
        if (pageChanged || filtersChanged || this.isInitialLoad) {
          this.isInitialLoad = false;
          // Reset lastLoadedPage to ensure loadEmployees executes
          if (filtersChanged) {
            this.lastLoadedPage = 0;
          }
          this.loadEmployees();
        }
      });


    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(
        takeUntil(this.destroy$),
        filter(msg => !!msg && msg.trim() !== '')
      )
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });

    this.searchSubscription = this.searchSubject
      .pipe(
        takeUntil(this.destroy$),
        // Trim leading whitespace from search term
        map((searchTerm: string) => {
          const trimmed = searchTerm.trimStart();
          // Update searchTerm property to reflect trimmed value in UI
          this.searchTerm = trimmed;
          return trimmed;
        }),
        // Debounce to wait for user to stop typing
        debounceTime(600),
        // Avoid duplicate consecutive searches
        distinctUntilChanged(),
        // Cancel previous request and make new one
        switchMap((searchTerm: string) => {
          this.loading = true;
          this.loadData = true;
          this.currentPage = 1;

          // If search is empty or whitespace-only, load without search term
          const finalSearchTerm = (searchTerm && searchTerm.trim() !== '') ? searchTerm.trim() : '';

          // Update query params with search term (only if not initial load)
          if (!this.isInitialLoad) {
            this.updateQueryParams({ search: finalSearchTerm, page: 1 });
          }

          return this.employeeService.getEmployees(this.currentPage, this.itemsPerPage, finalSearchTerm, this.activeFilters);
        })
      )
      .subscribe({
        next: (response) => {
          try {
            // Handle response structure
            const listItems = response?.data?.list_items || [];
            const totalItems = response?.data?.total_items || 0;

            this.employees = listItems;
            this.totalItems = totalItems;
            this.transformEmployeesForDisplay();
            this.loading = false;
            this.loadData = false;
            this.sortDirection = 'desc';
            this.sortBy();
          } catch (error) {
            console.error('Error processing search response:', error);
            this.loading = false;
            this.loadData = false;
            this.toastr.error('Error processing search results', 'Error');
          }
        },
        error: (error) => {
          console.error('Error loading employees:', error);
          this.loading = false;
          this.loadData = false;
          this.toastr.error('Failed to load employees', 'Error');
        }
      });
  }

  // loadEmployees(currentPage: number): void {
  //   this.loading = true;
  //   this.employeeService.getEmployees(currentPage, this.itemsPerPage, this.searchTerm)
  //     .subscribe({
  //       next: (response) => {
  //         this.employees = response.data.list_items;
  //         this.totalItems = response.data.total_items;
  //         this.transformEmployeesForDisplay();
  //         this.loading = false;
  //         this.loadData = false;
  //         // console.log('Employees loaded:', response);
  //       },
  //       error: (error) => {
  //         console.error('Error loading employees:', error);
  //         this.loading = false;
  //         this.loadData = false;
  //         this.toastr.error('Failed to load employees', 'Error');
  //       }
  //     });
  // }

  loadEmployees(): void {
    // Prevent duplicate requests for the same page
    if (this.currentPage === this.lastLoadedPage && !this.isInitialLoad) {
      return;
    }

    this.loading = true;
    this.loadData = true;

    // Pass all state properties to the service method
    this.employeeService.getEmployees(this.currentPage, this.itemsPerPage, this.searchTerm, this.activeFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          try {
            // Handle response structure
            const listItems = response?.data?.list_items || [];
            const totalItems = response?.data?.total_items || 0;

            this.employees = listItems;
            this.totalItems = totalItems;
            this.transformEmployeesForDisplay();
            this.loading = false;
            this.loadData = false;
            this.sortDirection = 'desc';
            this.sortBy();
            // Track the last loaded page to prevent duplicate requests
            this.lastLoadedPage = this.currentPage;
          } catch (error) {
            console.error('Error processing employees data:', error);
            this.loading = false;
            this.loadData = false;
            this.toastr.error('Error processing employees data', 'Error');
          }
        },
        error: (error) => {
          console.error('Error loading employees:', error);
          this.loading = false;
          this.loadData = false;
          this.toastr.error('Failed to load employees', 'Error');
        }
      });
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;
      this.activeFilters = {
        status: rawFilters.status === 'all' ? null : rawFilters.status,
        created_from: rawFilters.created_from || null,
        created_to: rawFilters.created_to || null,
        contract_end_date: rawFilters.contract_end_date || null,
        contract_start_date: rawFilters.contract_start_date || null,
        department: rawFilters.department_id ? parseInt(rawFilters.department_id, 10) : null
      };

      // Reset to page 1 and reset lastLoadedPage to ensure loadEmployees executes
      this.currentPage = 1;
      this.lastLoadedPage = 0; // Reset to force loadEmployees to execute

      // Set flag to prevent route subscription from firing
      this.isUpdatingQueryParams = true;

      // Update query params with filters
      this.updateQueryParams({ filters: this.activeFilters, page: 1 });

      // Load employees with the new filters (bypassing duplicate check by resetting lastLoadedPage)
      this.loadEmployees();

      this.filterBox.closeOverlay();
    }
  }


  // Transform API data to match the template expectations
  transformEmployeesForDisplay(): void {
    try {
      if (!this.employees || !Array.isArray(this.employees) || this.employees.length === 0) {
        this.filteredEmployees = [];
        return;
      }

      this.filteredEmployees = this.employees.map((item: any) => {
        try {
          // The employee data is nested in object_info
          const employee = item.object_info || item;
          const endContract = employee.current_contract?.end_contract;
          return {
            id: employee.id,
            code: employee.code || '',
            name: employee.contact_info?.name || '',
            name_arabic: employee.contact_info?.name_arabic || '',
            employeeStatus: employee.employee_status || '',
            accountStatus: this.getAccountStatus(employee.employee_active),
            jobTitle: employee.job_info?.job_title?.name || '',
            branch: employee.job_info?.branch?.name || '',
            joinDate: this.formatDate(employee.job_info?.start_contract),
            end_contract: (endContract && typeof endContract === 'string' && endContract.trim() !== '') ? endContract : null,
            created_at: employee.created_at || ''
          };
        } catch (empError) {
          console.error('Error transforming employee:', empError, item);
          return null;
        }
      }).filter(emp => emp !== null); // Remove any null entries from failed transformations
    } catch (error) {
      console.error('Error transforming employees:', error);
      this.filteredEmployees = [];
    }
  }

  // Helper method to convert string employee_active to account status
  private getAccountStatus(employeeActive: string): 'active' | 'inactive' | 'pending' | 'disabled' {
    switch (employeeActive?.toLowerCase()) {
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      case 'disabled':
        return 'disabled';
      case 'inactive':
      default:
        return 'inactive';
    }
  }

  // Determine employee status based on contract dates and status
  private getEmployeeStatus(employee: Employee): string {
    const today = new Date();
    const startDate = new Date(employee.job_info.start_contract);
    const daysDiff = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

    if (daysDiff < 0) {
      return 'New Joiner'; // Contract hasn't started yet
    } else if (daysDiff <= 90) {
      return 'New Employee'; // Within first 90 days
    } else {
      return 'Employed'; // More than 90 days
    }
  }

  // Format date for display
  // private formatDate(dateString: string): string {
  //   const date = new Date(dateString);
  //   return this.datePipe.transform(date, 'yyyy-MM-dd') || dateString;
  // }

  private formatDate(dateStr: string): string | null {
    if (!dateStr) return null;

    if (dateStr.indexOf('/') > -1) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }

    return dateStr;
  }



  // sortBy() {
  //   this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   this.filteredEmployees.sort((a, b) => {
  //     const nameA = a.name?.toLowerCase() || '';
  //     const nameB = b.name?.toLowerCase() || '';
  //     if (this.sortDirection === 'asc') {
  //       return nameA.localeCompare(nameB);
  //     } else {
  //       return nameB.localeCompare(nameA);
  //     }
  //   });
  // }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    const directionMultiplier = this.sortDirection === 'asc' ? 1 : -1;

    this.filteredEmployees.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      const nameComparison = nameA.localeCompare(nameB);
      if (nameComparison !== 0) {
        return nameComparison * directionMultiplier;
      }

      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      if (dateA < dateB) {
        return -1 * directionMultiplier;
      }
      if (dateA > dateB) {
        return 1 * directionMultiplier;
      }
      return 0;
    });
  }


  // sortBy() {
  //   this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   this.filteredEmployees = this.filteredEmployees.sort((a, b) => {
  //     if (this.sortDirection === 'asc') {
  //       return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
  //     } else {
  //       return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
  //     }
  //   });
  // }

  // resetFilterForm(): void {
  //   this.filterBox.closeOverlay();
  //   this.loadEmployees(this.currentPage);
  // }

  onSearchChange() {
    // Trim leading whitespace before emitting
    const trimmedSearch = this.searchTerm.trimStart();
    // Update the searchTerm property to reflect trimmed value
    this.searchTerm = trimmedSearch;
    this.searchSubject.next(trimmedSearch);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.lastLoadedPage = 0; // Reset to force API request with new page size

    // Set flags to prevent route subscription and pageChange from interfering
    this.isUpdatingQueryParams = true;
    this.isChangingItemsPerPage = true;

    // Get current params to remove itemsPerPage if it exists
    const currentParams = { ...this.route.snapshot.queryParams };
    const updatedParams: any = {
      ...currentParams,
      view: newItemsPerPage.toString(),
      page: '1'
    };

    // Remove itemsPerPage if it exists
    if (updatedParams['itemsPerPage']) {
      delete updatedParams['itemsPerPage'];
    }

    // Navigate with only the params we want
    // Don't use merge - set all params explicitly to remove itemsPerPage
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: updatedParams
    }).then(() => {
      // Reset flags after navigation completes
      setTimeout(() => {
        this.isUpdatingQueryParams = false;
        this.isChangingItemsPerPage = false;
      }, 100); // Small delay to ensure pageChange event doesn't interfere

      // Load employees with the new itemsPerPage value
      this.loadEmployees();
    }).catch((error) => {
      console.error('Navigation error:', error);
      this.isUpdatingQueryParams = false;
      this.isChangingItemsPerPage = false;
      this.loadEmployees();
    });
  }

  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.loadEmployees(this.currentPage);
  // }

  onPageChange(page: number): void {
    // Skip if we're changing items per page (it will trigger pageChange to 1)
    if (this.isChangingItemsPerPage) {
      return;
    }

    this.currentPage = page;
    this.paginationState.setPage('employees/all-employees', page);

    // Set flag to prevent route subscription from firing
    // updateQueryParams will also set this flag, but we set it here first to be safe
    this.isUpdatingQueryParams = true;

    // Update query params with page - this will navigate and trigger route changes
    // but the flag prevents the route subscription from calling loadEmployees
    this.updateQueryParams({ page });

    // Load employees directly with the new page (route subscription is blocked by flag)
    this.loadEmployees();
  }

  ngOnDestroy(): void {
    // Complete the destroy subject to trigger takeUntil for all subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // Unsubscribe from individual subscriptions if they exist
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    // Complete the search subject
    this.searchSubject.complete();
  }

  navigateToEdit(employeeId: number): void {
    this.paginationState.setPage('employees/all-employees', this.currentPage);
    this.router.navigate(['/employees/edit-employee', employeeId]);
  }



  navigateToView(employee: any): void {
    if (employee.employeeStatus === 'New Joiner') {
      this.router.navigate(['/employees/view-newjoiner', employee.id]);
    } else {
      this.router.navigate(['/employees/view-employee', employee.id]);
    }
  }

  resetFilterForm(): void {
    this.filterForm.reset();
    this.filterForm.patchValue({
      created_from: '',
      created_to: '',
      status: '',
      contract_end_date: '',
      contract_start_date: '',
      department_id: ''
    });
    this.activeFilters = {};
    this.searchTerm = ''; // Clear search term
    this.currentPage = 1;
    this.lastLoadedPage = 0; // Reset to force loadEmployees to execute

    // Set flag to prevent route subscription from firing
    this.isUpdatingQueryParams = true;

    // Clear all filter-related query params (filters and search)
    const newParams: any = { page: '1' };

    // Navigate with cleaned params (without merge to fully replace query params)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams
    }).then(() => {
      setTimeout(() => {
        this.isUpdatingQueryParams = false;
      }, 100);

      // Load employees without filters
      this.loadEmployees();
      this.filterBox.closeOverlay();
    }).catch((error) => {
      console.error('Navigation error:', error);
      this.isUpdatingQueryParams = false;
      this.loadEmployees();
      this.filterBox.closeOverlay();
    });
  }

  /**
   * Open filter overlay and load all departments with per_page=10000
   */
  openFilterOverlay(): void {
    // Load departments when opening the filter overlay (only if not already loaded)
    if (this.departments.length === 0 && !this.loadingDepartments) {
      this.getAllDepartment(1);
    }
    this.overlay.openOverlay();
  }

  /**
   * Get all departments with high per_page limit
   */
  private getAllDepartment(pageNumber: number): void {
    this.loadingDepartments = true;
    this.getAllDepartmentSubscription = this.departmentsService
      .getAllDepartment(pageNumber, 10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          try {
            this.departments = response?.data?.list_items || [];
            this.loadingDepartments = false;
          } catch (error) {
            console.error('Error loading departments:', error);
            this.loadingDepartments = false;
          }
        },
        error: (error) => {
          console.error('Error fetching departments:', error);
          this.loadingDepartments = false;
        }
      });
  }

  /**
   * Close filter overlay callback
   */
  onFilterOverlayClose(): void {
    // Unsubscribe from department API call when overlay is closed
    if (this.getAllDepartmentSubscription) {
      this.getAllDepartmentSubscription.unsubscribe();
      this.getAllDepartmentSubscription = null as any;
    }
  }

  /**
   * Update query parameters while preserving existing ones
   */
  private updateQueryParams(updates: {
    page?: number;
    search?: string;
    filters?: any;
    itemsPerPage?: number;
  }): void {
    const currentParams = this.route.snapshot.queryParams;
    const newParams: any = { ...currentParams };

    // Update page
    if (updates.page !== undefined) {
      newParams['page'] = updates.page.toString();
    }

    // Update search
    if (updates.search !== undefined) {
      if (updates.search && updates.search.trim() !== '') {
        newParams['search'] = encodeURIComponent(updates.search);
      } else {
        delete newParams['search'];
      }
    }

    // Update filters
    if (updates.filters !== undefined) {
      if (updates.filters && Object.keys(updates.filters).length > 0) {
        // Only include non-null filters
        const nonNullFilters: any = {};
        Object.keys(updates.filters).forEach(key => {
          if (updates.filters[key] !== null && updates.filters[key] !== '') {
            nonNullFilters[key] = updates.filters[key];
          }
        });

        if (Object.keys(nonNullFilters).length > 0) {
          newParams['filters'] = encodeURIComponent(JSON.stringify(nonNullFilters));
        } else {
          delete newParams['filters'];
        }
      } else {
        delete newParams['filters'];
      }
    }

    // Update items per page (save as 'view' in query params)
    if (updates.itemsPerPage !== undefined) {
      // Always save the view value if provided (even if it's the default)
      if (updates.itemsPerPage !== null && updates.itemsPerPage !== undefined && !isNaN(updates.itemsPerPage) && updates.itemsPerPage > 0) {
        newParams['view'] = updates.itemsPerPage.toString();
        // Remove itemsPerPage if it exists (migration from old param)
        delete newParams['itemsPerPage'];
      } else {
        // Only delete if explicitly set to null/undefined/0
        delete newParams['view'];
        delete newParams['itemsPerPage'];
      }
    }

    // Set flag to prevent route subscription from firing
    this.isUpdatingQueryParams = true;

    // Navigate with updated params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams,
      queryParamsHandling: 'merge'
    }).then(() => {
      // Reset flag after navigation completes with enough delay to prevent route subscription from firing
      setTimeout(() => {
        this.isUpdatingQueryParams = false;
      }, 100);
    });
  }


  getContractStatus(endDateString: string | null | undefined): string {
    if (!endDateString) {
      return '';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const contractEnd = new Date(endDateString);
    contractEnd.setHours(0, 0, 0, 0);

    if (contractEnd < today) {
      return 'expired';
    }

    const minutesPerDay = 1000 * 60 * 60 * 24;
    const remainingMonths = contractEnd.getTime() - today.getTime();
    const remainingDays = Math.ceil(remainingMonths / minutesPerDay);

    if (remainingDays <= 30) {
      return 'nearly-expired';
    }

    if (remainingDays <= 60) {
      return 'warning';
    }
    return '';
  }

  public getEmployeeClass = (employee: any): string => {
    const status = this.getContractStatus(employee.end_contract);
    if (status === 'nearly-expired') {
      return 'contract-expiring-red';
    }

    if (status === 'warning') {
      return 'contract-expiring-yellow';
    }

    return '';
  }

}
