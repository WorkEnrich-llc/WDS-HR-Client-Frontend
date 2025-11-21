import { Component, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from './../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from './../../../shared/overlay-filter-box/overlay-filter-box.component';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-job-titles',
  imports: [PageHeaderComponent, RouterLink, TableComponent, FormsModule, OverlayFilterBoxComponent, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './all-job-titles.component.html',
  styleUrl: './all-job-titles.component.css'
})
export class AllJobTitlesComponent {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);

  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private _DepartmentsService: DepartmentsService, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private _JobsService: JobsService, private fb: FormBuilder, private subService: SubscriptionService) { }
  departments: any[] = [];
  jobTitles: any[] = [];
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;
  currentFilters: any = {};
  currentSearchTerm: string = '';

  jobTitleSub: any;
  ngOnInit(): void {

    // subscription data
    this.subService.subscription$.subscribe(sub => {
      this.jobTitleSub = sub?.Branches;
      // if (this.jobTitleSub) {
      //   console.log("info:", this.jobTitleSub.info);
      //   console.log("create:", this.jobTitleSub.create);
      //   console.log("update:", this.jobTitleSub.update);
      //   console.log("delete:", this.jobTitleSub.delete);
      // }
    });


    this.getAllDepartment(1);
    // this.route.queryParams.subscribe(params => {
    //   this.currentPage = +params['page'] || 1;
    //   this.getAllJobTitles(this.currentPage);
    // });
    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('jobs/all-job-titles') || 1;
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

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllJobTitles(this.currentPage, value);

    });


    this.filterForm = this.fb.group({
      updated_from: [''],
      updated_to: [''],
      created_from: [''],
      created_to: [''],
      management_level: [''],
      department: [''],
      section: [''],
      status: ['']
    });
  }


  resetFilterForm(): void {
    this.filterForm.reset({
      updated_from: '',
      updated_to: '',
      created_from: '',
      created_to: '',
      management_level: '',
      department: '',
      section: '',
      status: ''
    });
    this.filterBox.closeOverlay();
    this.getAllJobTitles(this.currentPage);
  }

  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.jobTitles = this.jobTitles.sort((a, b) => {
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
    this.currentPage = 1;
    this.currentSearchTerm = this.searchTerm;
    this.getAllJobTitles(this.currentPage, this.currentSearchTerm, this.currentFilters);
  }


  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        status: rawFilters.status || undefined,
        updated_from: rawFilters.updated_from || undefined,
        updated_to: rawFilters.updated_to || undefined,
        created_from: rawFilters.created_from || undefined,
        created_to: rawFilters.created_to || undefined,
        management_level: rawFilters.management_level || undefined,
        department: rawFilters.department || undefined,
        section: rawFilters.section || undefined
      };

      this.currentPage = 1;
      this.filterBox.closeOverlay();
      this.currentFilters = filters;
      this.getAllJobTitles(this.currentPage, this.currentSearchTerm, filters);

    }
  }

  currentPage: number = 1;
  totalPages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  loadData: boolean = true;
  getAllJobTitles(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
      management_level?: string;
      department?: string;
      section?: string;
      status?: string;
      request_in?: string;
    }
  ) {
    this._JobsService.getAllJobTitles(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      request_in: 'all',
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalPages = response.data.total_pages;
        this.jobTitles = response.data.list_items;
        // console.log(this.jobTitles);
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
    this._DepartmentsService.getAllDepartment(1, 10000, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        // this.totalpages = response.data.total_pages;
        this.departments = response.data.list_items.map((item: any) => ({
          id: item.id,
          name: item.name,
        }));
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllJobTitles(this.currentPage, this.currentSearchTerm, this.currentFilters);
  }

  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.getAllJobTitles(this.currentPage, this.currentSearchTerm, this.currentFilters);
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
    this.paginationState.setPage('jobs/all-job-titles', this.currentPage);
    this.router.navigate(['/jobs/edit', componentId]);
  }


  navigateToView(componentId: number): void {
    this.paginationState.setPage('jobs/all-job-titles', this.currentPage);
    this.router.navigate(['/jobs/view-job', componentId]);
  }





}
