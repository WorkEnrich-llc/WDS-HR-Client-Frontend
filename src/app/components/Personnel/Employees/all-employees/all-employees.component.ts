import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { PageHeaderComponent } from './../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { Employee } from '../../../../core/interfaces/employee';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-employees',
  imports: [PageHeaderComponent, CommonModule, TableComponent, OverlayFilterBoxComponent, RouterLink, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './all-employees.component.html',
  styleUrl: './all-employees.component.css'
})
export class AllEmployeesComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  private employeeService = inject(EmployeeService);
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);

  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder) { }

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
  loading: boolean = true;


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('employees/all-employees') || 1;
      this.currentPage = pageFromUrl;
      this.loadEmployees();
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(600)).subscribe(value => {
      this.currentPage = 1;
      this.loadEmployees();
    });

    this.filterForm = this.fb.group({
      created_at: [''],
      status: [''],
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
    this.loading = true;
    this.loadData = true;

    // Pass all state properties to the service method
    this.employeeService.getEmployees(this.currentPage, this.itemsPerPage, this.searchTerm, this.activeFilters)
      .subscribe({
        next: (response) => {
          this.employees = response.data.list_items;
          this.totalItems = response.data.total_items;
          this.transformEmployeesForDisplay();
          this.loading = false;
          this.loadData = false;
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
        created_at: rawFilters.created_at || null
      };
      this.currentPage = 1;
      this.loadEmployees();
      this.filterBox.closeOverlay();
    }
  }


  // Transform API data to match the template expectations
  transformEmployeesForDisplay(): void {
    this.filteredEmployees = this.employees.map(employee => ({
      id: employee.id,
      code: employee.code,
      name: employee.contact_info.name,
      name_arabic: employee.contact_info.name_arabic,
      employeeStatus: employee.employee_status,
      accountStatus: this.getAccountStatus(employee.employee_active),
      jobTitle: employee.job_info.job_title.name,
      branch: employee.job_info.branch.name,
      joinDate: this.formatDate(employee.job_info.start_contract)
    }));
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
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'yyyy-MM-dd') || dateString;
  }


  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.filteredEmployees = this.filteredEmployees.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }

  // resetFilterForm(): void {
  //   this.filterBox.closeOverlay();
  //   this.loadEmployees(this.currentPage);
  // }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.loadEmployees();
  }

  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.loadEmployees(this.currentPage);
  // }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('employees/all-employees', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
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
    this.activeFilters = {};
    this.currentPage = 1;
    this.loadEmployees();
    this.filterBox.closeOverlay();
  }

}
