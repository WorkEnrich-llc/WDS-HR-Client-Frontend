import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { TableComponent } from 'app/components/shared/table/table.component';
import { GoalsService } from 'app/core/services/od/goals/goals.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription, switchMap, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-all-goals',
  imports: [PageHeaderComponent, OverlayFilterBoxComponent, TableComponent, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './all-goals.component.html',
  styleUrl: './all-goals.component.css'
})
export class AllGoalsComponent implements OnInit, OnDestroy {


  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);


  filterForm!: FormGroup;
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService,
    private goalsService: GoalsService,
    private subService: SubscriptionService
  ) { }

  searchTerm: string = '';


  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  loadData: boolean = false;
  sortDirection: string = 'asc';
  Goals: any[] = [];
  currentFilters: { goal_type?: number } = {};
  currentSearchTerm: string = '';
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;

  GoalsSub: any;
  ngOnInit(): void {

    // subscription data
    this.subService.subscription$.subscribe(sub => {
      this.GoalsSub = sub?.Goals;
      // if (this.GoalsSub) {
      //   console.log("info:", this.GoalsSub.info);
      //   console.log("create:", this.GoalsSub.create);
      //   console.log("update:", this.GoalsSub.update);
      //   console.log("delete:", this.GoalsSub.delete);
      // }
    });

    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('goals/all-goals') || 1;
      this.currentPage = pageFromUrl;
      this.getAllGoals(pageFromUrl);
    });

    // this.getAllGoals(this.currentPage);

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });
        this.toasterMessageService.clearMessage();
      });


    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.currentPage = 1;
          this.currentSearchTerm = term;
          this.loadData = true;
          return this.goalsService.getAllGoals(this.currentPage, this.itemsPerPage, {
            search: term || undefined,
            goal_type: this.currentFilters.goal_type || undefined
          });
        })
      )
      .subscribe({
        next: (response) => {
          const data = response?.data;
          this.currentPage = Number(data?.page ?? 1);
          this.totalItems = data?.total_items ?? 0;
          this.totalpages = data?.total_pages ?? 0;
          this.Goals = data?.list_items ?? [];
          this.sortDirection = 'desc';
          this.sortBy();
          this.loadData = false;
        },
        error: (err) => {
          console.error("Error loading goals:", err.error?.details || err.message);
          this.loadData = false;
        }
      });

    this.filterForm = this.fb.group({
      goal_type: [''],
    });



  }

  private getAllGoalsSub?: Subscription;
  getAllGoals(
    pageNumber: number = 1,
    searchTerm: string = '',
    filters: { goal_type?: number } = {}
  ): void {
    this.loadData = true;
    if (this.getAllGoalsSub) {
      this.getAllGoalsSub.unsubscribe();
    }
    this.getAllGoalsSub = this.goalsService.getAllGoals(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      goal_type: filters.goal_type || undefined
    }).subscribe({
      next: (response) => {
        const data = response?.data;

        this.currentPage = Number(data?.page ?? 1);
        this.totalItems = data?.total_items ?? 0;
        this.totalpages = data?.total_pages ?? 0;
        this.Goals = data?.list_items ?? [];

        this.sortDirection = 'desc';
        this.sortBy();

        this.loadData = false;
      },
      error: (err) => {
        console.error("Error loading goals:", err.error?.details || err.message);
        this.loadData = false;
      }
    });
  }

  getAssignedDepartmentsText(goal: any, maxLength: number = 40): string {
    if (!goal.assigned_department || goal.assigned_department.length === 0) {
      return '';
    }

    const text = goal.assigned_department.map((d: any) => d.name).join(', ');

    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }


  ngOnDestroy(): void {
    if (this.toasterSubscription) {
      this.toasterSubscription.unsubscribe();
    }
    if (this.GoalsSub && typeof this.GoalsSub.unsubscribe === 'function') {
      this.GoalsSub.unsubscribe();
    }
    if (this.getAllGoalsSub) {
      this.getAllGoalsSub.unsubscribe();
    }
    if (this.searchSubject) {
      this.searchSubject.complete();
    }
  }




  // sortting
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.Goals = this.Goals.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
      } else {
        return nameA < nameB ? 1 : (nameA > nameB ? -1 : 0);
      }
    });
  }


  // search and filter

  onSearchChange() {
    let value = this.searchTerm || '';
    // Remove leading spaces for the payload only (do not change input)
    let payload = value.replace(/^\s+/, '');
    // Prevent more than 2 consecutive spaces anywhere in the payload
    payload = payload.replace(/ {3,}/g, '  ');
    // Prevent search if only whitespace or just a single space
    if (payload.trim().length === 0) {
      return;
    }
    this.searchSubject.next(payload);
  }


  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      this.currentFilters = {
        goal_type: rawFilters.goal_type || undefined
      };

      this.currentPage = 1;
      this.filterBox.closeOverlay();
      this.getAllGoals(this.currentPage, this.currentSearchTerm, this.currentFilters);
    }
  }



  resetFilterForm(): void {
    this.filterForm.reset({
      goal_type: '',
    });
    this.filterBox.closeOverlay();
    this.getAllGoals(1);
  }



  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllGoals(this.currentPage, this.currentSearchTerm, this.currentFilters);
  }

  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.getAllGoals(this.currentPage, this.currentSearchTerm, this.currentFilters);
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


  navigateToEdit(goalId: number): void {
    this.paginationState.setPage('goals/all-goals', this.currentPage);
    this.router.navigate(['/goals/edit', goalId]);
  }


  navigateToView(goalId: number): void {
    this.paginationState.setPage('goals/all-goals', this.currentPage);
    this.router.navigate(['/goals/view-goal', goalId]);
  }



}
