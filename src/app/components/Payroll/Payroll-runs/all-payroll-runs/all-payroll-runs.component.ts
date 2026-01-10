import { Component, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PayrollRunService } from 'app/core/services/payroll/payroll-run.service';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-all-payroll-runs',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './all-payroll-runs.component.html',
  styleUrl: './all-payroll-runs.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AllPayrollRunsComponent implements OnDestroy {
  days: number[] = Array.from({ length: 28 }, (_, i) => i + 1);
  private subscriptions: Subscription[] = [];
  private apiSub?: Subscription;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @ViewChild('configureBox') configureBox!: OverlayFilterBoxComponent;
  @ViewChild('importBox') importBox!: OverlayFilterBoxComponent;
  private paginationState: PaginationStateService;
  private router: Router;

  loadData: boolean = false;
  filterForm!: FormGroup;
  payrollRuns: any[] = [];
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private searchSubject = new Subject<string>();
  currentPayrollEndDate: string = '';
  selectedStartDay: number | null = null;
  startConfigure: number | null = null;
  isConfiguring: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService,
    private payrollRunService: PayrollRunService,
    paginationState: PaginationStateService,
    router: Router,
    private fb: FormBuilder
  ) {
    this.paginationState = paginationState;
    this.router = router;
  }
  closeOverlays(): void {
    this.importBox?.closeOverlay();
  }
  closeconfigureBoxOverlays(): void {
    this.configureBox?.closeOverlay();
  }
  // ...existing code...


  ngOnInit(): void {
    // Initialize filter form
    this.filterForm = this.fb.group({
      run_cycle: [''],
      created_at: ['']
    });

    const sub = this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('payroll-runs/payroll-runs') || 1;
      this.currentPage = pageFromUrl;

      // Build filters object from query params
      const filters: any = {};

      // Load filters from query params if they exist
      if (params['run_cycle']) {
        this.filterForm.patchValue({ run_cycle: params['run_cycle'] });
        filters['run_cycle'] = params['run_cycle'];
      }
      if (params['created_at']) {
        this.filterForm.patchValue({ created_at: params['created_at'] });
        filters['created_at'] = params['created_at'];
      }

      // Fetch with filters if any exist, otherwise fetch without filters
      this.fetchPayrollRuns(Object.keys(filters).length > 0 ? filters : undefined);
    });
    this.subscriptions.push(sub);
  }

  ngAfterViewInit(): void {
    const toasterSub = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });
    this.subscriptions.push(toasterSub);

    const searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      // this.getAllDepartment(this.currentPage, value);
    });
    this.subscriptions.push(searchSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    if (this.apiSub) {
      this.apiSub.unsubscribe();
    }
  }

  fetchPayrollRuns(filters?: any) {
    this.loadData = true;
    if (this.apiSub) {
      this.apiSub.unsubscribe();
    }
    this.apiSub = this.payrollRunService.getAllPayrollRuns(this.currentPage, this.itemsPerPage, filters).subscribe({
      next: (response: any) => {
        const items = response?.data?.list_items ?? [];

        // Extract end_date from the first item (most recent payroll run)
        if (items.length > 0) {
          this.currentPayrollEndDate = items[0].end_date || '';
        }

        // Extract start_configure from response
        if (response?.data?.start_configure) {
          this.startConfigure = response.data.start_configure;
          this.selectedStartDay = response.data.start_configure;
        }

        this.payrollRuns = items.map((item: any) => ({
          title: item.title ? `${item.title}` : '',
          cycle: item.start_date && item.end_date ? `${item.start_date} – ${item.end_date}` : '',
          numOfEmp: item.emp_count ?? 0,
          Status: item.status ?? '',
          id: item.id
        }));
        this.totalItems = response?.data?.total_items ?? 0;
        this.loadData = false;
      },
      error: () => {
        this.toastr.error('Failed to load payroll runs');
        this.loadData = false;
      }
    });
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.payrollRuns = this.payrollRuns.sort((a, b) => {
      const dateA = new Date(a.title);
      const dateB = new Date(b.title);

      if (this.sortDirection === 'asc') {
        return dateA > dateB ? 1 : (dateA < dateB ? -1 : 0);
      } else {
        return dateA < dateB ? 1 : (dateA > dateB ? -1 : 0);
      }
    });
  }

  // import
  selectedFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedExtensions = ['xls', 'xlsx'];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension && allowedExtensions.includes(extension)) {
        this.selectedFile = file;
      } else {
        alert('Only .xls or .xlsx files are allowed.');
        input.value = '';
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  applyFilters(): void {
    if (this.filterForm.valid) {
      const formValue = this.filterForm.value;
      const queryParams: any = { page: '1' };

      // Build filters object
      const filters: any = {};

      // Add run_cycle to query params and filters if selected
      if (formValue.run_cycle) {
        queryParams['run_cycle'] = formValue.run_cycle;
        filters['run_cycle'] = formValue.run_cycle;
      }

      // Add created_at to query params and filters if set
      if (formValue.created_at) {
        queryParams['created_at'] = formValue.created_at;
        filters['created_at'] = formValue.created_at;
      }

      // Set current page to 1 and fetch with filters
      this.currentPage = 1;

      // Navigate with query params
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: queryParams
      });

      // Fetch data with filters
      this.fetchPayrollRuns(filters);
      this.filterBox.closeOverlay();
    }
  }

  resetFilterForm(): void {
    this.filterForm.reset({
      run_cycle: '',
      created_at: ''
    });
    this.currentPage = 1;

    // Clear all query params except page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: '1' }
    });

    // Fetch without filters
    this.fetchPayrollRuns();
    this.filterBox.closeOverlay();
  }
  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.fetchPayrollRuns();
  }
  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   // this.getAllDepartment(this.currentPage);
  // }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('...', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
    this.fetchPayrollRuns();
  }

  navigateToEdit(runsId: number): void {
    this.paginationState.setPage('payroll-runs/payroll-runs', this.currentPage);
    this.router.navigate(['/payroll-runs/edit-payroll-run', runsId]);
  }


  navigateToView(runsId: number): void {
    this.paginationState.setPage('payroll-runs/payroll-runs', this.currentPage);
    this.router.navigate(['/payroll-runs/view-payroll-run', runsId]);
  }

  navigateToCreateOffCyclePayroll(): void {
    this.router.navigate(['/payroll-runs/create-off-cycle-payroll']);
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Processed': 'badge-probation',
      'Completed': 'badge-success',
      'Complete': 'badge-success',
      'In Process': 'badge-newjoiner',
      'Draft': 'badge-gray',
      'Pending': 'badge-warning',
      'Failed': 'badge-danger'
    };
    return statusMap[status] || 'badge-gray';
  }

  savePayrollConfiguration(): void {
    if (!this.selectedStartDay) {
      this.toastr.error('Please select a start day');
      return;
    }

    this.isConfiguring = true;
    const formData = new FormData();
    formData.append('start_in', this.selectedStartDay.toString());

    this.payrollRunService.configurePayroll(formData).subscribe({
      next: (response) => {
        this.toasterMessageService.showSuccess('Payroll configuration saved successfully');

        // Extract end date from response details
        if (response?.details && response.details.length > 0) {
          this.currentPayrollEndDate = response.details[1]?.end_date || response.details[0]?.end_date || '';
        }

        // Don't close the modal - let user close it manually
        // Reset the form but keep modal open
        this.fetchPayrollRuns();
        this.isConfiguring = false;
      },
      error: (error) => {
        console.error('Error saving payroll configuration:', error);
        this.toasterMessageService.showError(error?.error?.message || 'Failed to save payroll configuration');
        this.isConfiguring = false;
      }
    });
  }
}