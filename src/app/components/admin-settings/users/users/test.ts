// import { Component, inject, ViewChild, ViewEncapsulation } from '@angular/core';
// import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
// import { CommonModule, DatePipe } from '@angular/common';
// import { TableComponent } from '../../../shared/table/table.component';
// import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
// import { debounceTime, filter, Observable, Subject } from 'rxjs';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, RouterLink } from '@angular/router';
// import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
// import { ToastrService } from 'ngx-toastr';
// import { AdminUsersService } from 'app/core/services/admin-settings/users/admin-users.service';
// import { ISearchParams, IUser, IUserApi } from 'app/core/models/users';
// import { Status, UserStatus } from '@app/enums';
// import { AdminRolesService } from 'app/core/services/admin-settings/roles/admin-roles.service';
// import { Roles } from 'app/core/models/roles';

// @Component({
//    selector: 'app-users',
//    imports: [PageHeaderComponent, CommonModule, TableComponent, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule, RouterLink],
//    providers: [DatePipe],
//    templateUrl: './users.component.html',
//    styleUrl: './users.component.css',
//    encapsulation: ViewEncapsulation.None
// })
// export class UsersComponent {

//    @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
//    @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
//    private toasterService = inject(ToasterMessageService);
//    private rolesService = inject(AdminRolesService);
//    filterForm!: FormGroup;
//    toasterSubscription: any;
//    constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
//       private datePipe: DatePipe, private fb: FormBuilder) { }



//    private userService = inject(AdminUsersService);
//    // allUsers!: Observable<IUser[]>;
//    totalPages: number = 0;
//    allUsers: IUser[] = [];
//    filteredList: IUser[] = [];
//    userStatus = UserStatus
//    status = Status
//    roles: Roles[] = [];
//    statusOptions = Object.entries(Status)
//       .filter(([key, value]) => typeof value === 'number')
//       .map(([key, value]) => ({ label: key, value }));

//    searchTerm: string = '';
//    sortDirection: string = 'asc';
//    currentSortColumn: string = '';
//    totalItems: number = 0;
//    currentPage: number = 1;
//    itemsPerPage: number = 10;
//    totalpages: number = 0;
//    loadData: boolean = false;
//    private searchSubject = new Subject<string>();



//    ngOnInit(): void {
//       this.route.queryParams.subscribe(params => {
//          this.currentPage = +params['page'] || 1;
//          this.getAllUsers(this.currentPage);
//       });




//       this.toasterSubscription = this.toasterMessageService.currentMessage$
//          .pipe(filter(msg => !!msg && msg.trim() !== ''))
//          .subscribe(msg => {
//             this.toastr.clear();
//             this.toastr.success(msg, '', { timeOut: 3000 });

//             this.toasterMessageService.clearMessage();
//          });

//       this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
//          this.getAllUsers(this.currentPage, value);
//       });

//       this.getAllRoles();
//       this.filterForm = this.fb.group({
//          created_from: [''],
//          created_to: [''],
//          status: [''],
//          role: ['']
//       });
//    }



//    getAllUsers(
//       pageNumber: number,
//       searchTerm: string = '',
//       filters?: ISearchParams
//    ) {
//       this.loadData = true;
//       this.userService.getAllUsers(
//          {
//             page: pageNumber,
//             per_page: this.itemsPerPage,
//             search: searchTerm || undefined,
//             ...filters
//          }

//       ).subscribe({
//          next: (response) => {
//             // console.log('API response:', response);
//             this.currentPage = Number(response.data.page);
//             this.totalItems = response.data.total_items;
//             this.totalPages = response.data.total_pages;
//             this.allUsers = response.data.list_items.map((item: IUserApi) => ({
//                id: item.id,
//                name: item.user?.name ?? '',
//                email: item.user?.email ?? '',
//                code: item.user?.code ?? '',
//                status: this.mapToStatus(item),
//                created_at: item?.created_at ?? '',
//                permissions: (item.permissions ?? []).map((p: any) => ({
//                   id: p.role?.id,
//                   name: p.role?.name
//                }))
//             })) as IUser[];
//             this.sortDirection = 'desc';
//             this.currentSortColumn = 'name';
//             this.sortBy();
//             this.loadData = false;
//          },
//          error: (err) => {
//             console.log(err.error?.details);
//             console.log('API error:', err.error?.details);
//             this.loadData = false;
//          }
//       });
//    }

//    getRoleNames(user: IUser): string {
//       return user.permissions.map(p => p.name).join(', ');
//    }

//    private mapToStatus(item: any): UserStatus {
//       if (item.status === 'Pending') return UserStatus.Pending;
//       if (item.status === 'Expired') return UserStatus.Expired;
//       return item.is_active ? UserStatus.Active : UserStatus.Inactive;
//    }

//    sortBy() {
//       this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
//       this.allUsers.sort((a, b) => {
//          const nameA = a.name?.toLowerCase() || '';
//          const nameB = b.name?.toLowerCase() || '';
//          if (this.sortDirection === 'asc') {
//             return nameA.localeCompare(nameB);
//          } else {
//             return nameB.localeCompare(nameA);
//          }
//       });
//    }


//    onSearchChange() {
//       this.searchSubject.next(this.searchTerm);
//    }


//    resetFilterForm() {
//       this.filterForm.reset();
//       this.filter(); // reload with default params
//    }





//    filter(): void {
//       if (this.filterForm.valid) {
//          const rawFilters = this.filterForm.value;
//          const filters = {
//             status: rawFilters.status || undefined,
//             created_from: rawFilters.createdFrom || undefined,
//             created_to: rawFilters.createdTo || undefined,
//             role: rawFilters.role || undefined,
//          };
//          this.filterBox.closeOverlay();
//          this.getAllUsers(this.currentPage, '', filters);
//       }
//    }




//    applyFilters() {
//       this.filteredList = this.allUsers.filter(item =>
//          item.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
//       );
//       this.sortBy();
//    }


//    resendInvitation(email: string) {
//       this.userService.searchUser(email).subscribe({
//          next: () => {
//             this.toasterService.showSuccess('Invitation resent successfully');
//          },
//          error: (err) => {
//             console.error('Failed to resend invitation', err);
//             this.toasterService.showError('Failed to resend invitation');
//          }
//       });
//    }





//    copyEmail(email: string, user: any) {
//       navigator.clipboard.writeText(email).then(() => {
//          user.copied = true;
//          setTimeout(() => user.copied = false, 2000);
//       });
//    }


//    onItemsPerPageChange(newItemsPerPage: number) {
//       this.itemsPerPage = newItemsPerPage;
//       this.currentPage = 1;
//       this.getAllUsers(this.currentPage);
//    }
//    onPageChange(page: number): void {
//       this.currentPage = page;
//       this.getAllUsers(this.currentPage);
//    }



//    private getAllRoles(): void {
//       this.rolesService.getAllRoles(1, 50).subscribe({
//          next: (data) => {
//             console.log('All roles data:', data);
//             this.roles = data.roles;
//          },
//          error: (err) => console.error('Failed to load all roles', err)
//       });
//    }
// }
