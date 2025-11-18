import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';


@Component({
  selector: 'app-all-departments',
  imports: [PageHeaderComponent, TableComponent, RouterLink, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './all-departments.component.html',
  styleUrl: './all-departments.component.css'
})
export class AllDepartmentsComponent implements OnInit, OnDestroy {


  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);


  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private _DepartmentsService: DepartmentsService, private datePipe: DatePipe, private fb: FormBuilder, private subService: SubscriptionService) { }

  subscription: any;

  departments: any[] = [];
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;
  currentFilters: any = {};
  currentSearchTerm: string = '';


  departmentsSub: any;
  ngOnInit(): void {

    // subscription data
    this.subService.subscription$.subscribe(sub => {
      this.departmentsSub = sub?.Departments;
      // if (this.departmentsSub) {
      //   console.log("info:", this.departmentsSub.info);
      //   console.log("create:", this.departmentsSub.create);
      //   console.log("update:", this.departmentsSub.update);
      //   console.log("delete:", this.departmentsSub.delete);
      // }
    });


    // this.route.queryParams.subscribe(params => {
    //   this.currentPage = +params['page'] || 1;
    //   this.getAllDepartment(this.currentPage);
    // });

    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('departments/all-departments') || 1;
      this.currentPage = pageFromUrl;
      this.getAllDepartment(pageFromUrl);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllDepartment(this.currentPage, value);
    });


    this.filterForm = this.fb.group({
      status: [''],
      updatedFrom: [''],
      updatedTo: [''],
      createdFrom: [''],
      createdTo: ['']
    });
  }


  resetFilterForm(): void {
    this.filterForm.reset({
      status: '',
      updatedFrom: '',
      updatedTo: '',
      createdFrom: '',
      createdTo: ''
    });
    this.filterBox.closeOverlay();
    this.getAllDepartment(1);
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.departments = this.departments.sort((a, b) => {
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
    this.currentSearchTerm = this.searchTerm;
    this.searchSubject.next(this.searchTerm);
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        status: rawFilters.status || undefined,
        updated_from: rawFilters.updatedFrom || undefined,
        updated_to: rawFilters.updatedTo || undefined,
        created_from: rawFilters.createdFrom || undefined,
        created_to: rawFilters.createdTo || undefined,
      };

      this.currentFilters = filters;
      this.currentSearchTerm = this.searchTerm;
      this.currentPage = 1;

      this.filterBox.closeOverlay();
      this.getAllDepartment(this.currentPage, this.currentSearchTerm, this.currentFilters);
    }
  }


  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  loadData: boolean = true;
  getAllDepartment(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      status?: string;
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
    }
  ) {
    this.loadData = true;
    this._DepartmentsService.getAllDepartment(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.departments = response.data.list_items.map((item: any) => ({
          id: item.id,
          name: item.name,
          createdAt: this.datePipe.transform(item.created_at, 'dd/MM/yyyy'),
          updatedAt: this.datePipe.transform(item.updated_at, 'dd/MM/yyyy'),
          status: item.is_active ? 'Active' : 'Inactive',
        }));
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



  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.getAllDepartment(this.currentPage, this.currentSearchTerm, this.currentFilters);
  // }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllDepartment(this.currentPage, this.currentSearchTerm, this.currentFilters);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('departments/all-departments', page);

    this.getAllDepartment(this.currentPage, this.currentSearchTerm, this.currentFilters);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page,
        search: this.currentSearchTerm || null,
        ...this.currentFilters
      },
      queryParamsHandling: 'merge'
    });
  }

  navigateToEdit(departmentId: number): void {
    this.paginationState.setPage('departments/all-departments', this.currentPage);
    this.router.navigate(['/departments/edit', departmentId]);
  }


  navigateToView(departmentId: number): void {
    this.paginationState.setPage('departments/all-departments', this.currentPage);
    this.router.navigate(['/departments/view-department', departmentId]);
  }



}
