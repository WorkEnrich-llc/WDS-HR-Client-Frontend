import { Component, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { debounceTime, filter, Observable, Subject } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { AdminUsersService } from 'app/core/services/admin-settings/users/admin-users.service';
import { ISearchParams, IUser, IUserApi } from 'app/core/models/users';
import { Status, UserStatus } from '@app/enums';
import { AdminRolesService } from 'app/core/services/admin-settings/roles/admin-roles.service';
import { Roles } from 'app/core/models/roles';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';

@Component({
  selector: 'app-users',
  imports: [PageHeaderComponent, CommonModule, TableComponent, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  encapsulation: ViewEncapsulation.None
})
export class UsersComponent {

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  private toasterService = inject(ToasterMessageService);
  private rolesService = inject(AdminRolesService);
  private paginationState = inject(PaginationStateService);
  private router = inject(Router);
  filterForm!: FormGroup;
  toasterSubscription: any;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder) { }



  private userService = inject(AdminUsersService);
  allUsers: IUser[] = [];
  filteredList: IUser[] = [];
  userStatus = UserStatus
  status = Status
  roles: Partial<Roles>[] = [];
  statusOptions = Object.entries(Status)
    .filter(([key, value]) => typeof value === 'number')
    .map(([key, value]) => ({ label: key, value }));

  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  loadData: boolean = false;
  private searchSubject = new Subject<string>();



  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pageFromUrl = +params['page'] || this.paginationState.getPage('roles/all-role') || 1;
      this.currentPage = pageFromUrl;
      this.getAllUsers(pageFromUrl);
      // this.currentPage = +params['page'] || 1;
      // this.getAllUsers(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });
    this.getAllRoleNames();

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllUsers(this.currentPage, this.searchTerm, this.filterForm.value);
    });

    this.filterForm = this.fb.group({
      created_from: [''],
      created_to: [''],
      status: [''],
      role: ['']
    });
  }



  getAllUsers(
    pageNumber: number,
    searchTerm: string = '',
    filters?: ISearchParams
  ) {
    this.loadData = true;
    this.userService.getAllUsers(
      {
        page: pageNumber,
        per_page: this.itemsPerPage,
        search: searchTerm || undefined,
        ...filters
      }
    ).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalPages = response.data.total_pages;
        this.allUsers = response.data.list_items.map((item: IUserApi) => ({
          id: item.id,
          name: item.user?.name ?? '',
          email: item.user?.email ?? '',
          code: item.user?.code ?? '',
          status: this.mapToStatus(item),
          created_at: item?.created_at ?? '',
          permissions: (item.permissions ?? []).map((p: any) => ({
            id: p.role?.id,
            name: p.role?.name
          }))
        })) as IUser[];
        this.sortDirection = 'desc';
        this.currentSortColumn = 'name';
        this.sortBy();
        this.loadData = false;
      },
      error: (err) => {
        this.loadData = false;
      }
    });
  }

  getRoleNames(user: IUser): string {
    return user.permissions.map(p => p.name).join(', ');
  }

  private mapToStatus(item: any): UserStatus {
    if (item.status === 'Pending') return UserStatus.Pending;
    if (item.status === 'Expired') return UserStatus.Expired;
    return item.is_active ? UserStatus.Active : UserStatus.Inactive;
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.allUsers.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      if (this.sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }


  resetFilterForm() {
    this.filterForm.reset();
    this.filter();
  }



  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;
      const filters = {
        status: rawFilters.status || undefined,
        created_from: rawFilters.created_from || undefined,
        created_to: rawFilters.created_to || undefined,
        role: rawFilters.role || undefined,
      };
      this.filterBox.closeOverlay();
      this.getAllUsers(this.currentPage, this.searchTerm, filters);
    }
  }


  resendInvitation(email: string): void {
    this.userService.resendInvitation(email).subscribe({
      next: () => {
        this.toasterService.showSuccess('Invitation resent successfully');
      },
      error: () => {
        this.toasterService.showError('Error resending invitation');
      }
    });
  }



  copyEmail(email: string, user: any) {
    navigator.clipboard.writeText(email).then(() => {
      user.copied = true;
      setTimeout(() => user.copied = false, 2000);
    });
  }


  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllUsers(this.currentPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationState.setPage('users/all-users', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  // onPageChange(page: number): void {
  //   this.currentPage = page;
  //   this.getAllUsers(this.currentPage);
  // }



  private getAllRoleNames(): void {
    this.rolesService.getAllRoleNames().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: (err) => console.error('Failed to load all roles', err)
    });
  }

  navigateToEdit(userId: number): void {
    this.paginationState.setPage('users/all-users', this.currentPage);
    this.router.navigate(['/users/edit-user', userId]);
  }


  navigateToView(userId: number): void {
    this.paginationState.setPage('users/all-users', this.currentPage);
    this.router.navigate(['/users/view-user', userId]);
  }
}
