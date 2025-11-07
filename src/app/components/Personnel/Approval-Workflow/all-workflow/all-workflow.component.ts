import { Component, inject, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { CommonModule } from '@angular/common';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkflowService } from '../../../../core/services/personnel/workflows/workflow.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-all-workflow',
  imports: [PageHeaderComponent, TableComponent, CommonModule, ReactiveFormsModule, OverlayFilterBoxComponent, RouterLink, FormsModule],
  templateUrl: './all-workflow.component.html',
  styleUrl: './all-workflow.component.css'
})
export class AllWorkflowComponent {
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
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;


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

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllWorkflows(this.currentPage, value);
    });
    this.getAllDepartment(1);

    this.route.queryParams.subscribe(params => {
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
    this._WorkflowService.getAllWorkFlow(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.workflows = response.data.list_items;
        // console.log(this.workflows);
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
        this.loadData = false;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }


  getAllDepartment(pageNumber: number, searchTerm: string = '') {
    this._DepartmentsService.getAllDepartment(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {
        // this.currentPage = Number(response.data.page);
        // this.totalItems = response.data.total_items;
        // this.totalpages = response.data.total_pages;
        this.departments = response.data.list_items;
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
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
    this.searchSubject.next(this.searchTerm);
  }
  resetFilterForm(): void {
    this.filterForm.reset({
      department: ''
    });
    this.filterBox.closeOverlay();
    this.getAllWorkflows(this.currentPage);
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        department: rawFilters.department || undefined
      };

      // console.log('Filters submitted:', filters);
      this.filterBox.closeOverlay();
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
