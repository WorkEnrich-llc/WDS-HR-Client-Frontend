import { Component, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { debounceTime, filter, Observable, Subject } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { AdminUsersService } from 'app/core/services/admin-settings/users/admin-users.service';
import { IUser } from 'app/core/models/users';

@Component({
  selector: 'app-users',
  imports: [PageHeaderComponent, CommonModule, TableComponent, OverlayFilterBoxComponent, FormsModule, ReactiveFormsModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  encapsulation: ViewEncapsulation.None
})
export class UsersComponent {


  filterForm!: FormGroup;
  toasterSubscription: any;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  private userService = inject(AdminUsersService);
  allUsers$!: Observable<IUser[]>;
  // allUsers: IUser[] = [];

  users = [
    {
      id: 1,
      name: "Ahmed Ali",
      email: "ahmed.ali@example.com",
      role: "Admin",
      added_date: "2025-08-01",
      status: "active"
    },
    {
      id: 2,
      name: "Sara Mohamed",
      email: "sara.mohamed@example.com",
      role: "Editor",
      added_date: "2025-08-05",
      status: "inactive"
    },
    {
      id: 3,
      name: "Omar Khaled",
      email: "omar.khaled@example.com",
      role: "Viewer",
      added_date: "2025-08-10",
      status: "pending"
    }
  ];
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalpages: number = 0;
  loadData: boolean = false;
  private searchSubject = new Subject<string>();


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      // this.getAllWorkSchedule(this.currentPage);
    });

    // this.userService.getAllUsers().subscribe({
    //   next: users => {
    //     this.allUsers = users;
    //     console.log('Users:', this.allUsers);
    //   },
    //   error: err => console.error(err)
    // });

    this.allUsers$ = this.userService.getAllUsers();

    // this.userService.getAllUsers().subscribe(users => {
    //   this.allUsers = new Observable<IUser[]>(observer => {
    //     observer.next(users);
    //     observer.complete();
    //   });
    //   console.log('users created', users);
    // });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      // this.getAllWorkSchedule(this.currentPage, value);
    });
    // this.getAllDepartment(1);
    this.filterForm = this.fb.group({
      department: '',
      schedules_type: '',
      work_schedule_type: ''
    });
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.users = this.users.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id - b.id;
      } else {
        return b.id - a.id;
      }
    });
  }


  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }
  resetFilterForm(): void {
    this.filterForm.reset({
      department: '',
      schedules_type: '',
      work_schedule_type: ''
    });

    this.filterBox.closeOverlay();

    const filters = {
      department: undefined,
      schedules_type: undefined,
      work_schedule_type: undefined
    };

    // this.getAllWorkSchedule(this.currentPage, '', filters);
  }
  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        department: rawFilters.department || undefined,
        schedules_type: rawFilters.schedules_type || undefined,
        work_schedule_type: rawFilters.work_schedule_type || undefined
      };


      console.log('Filters submitted:', filters);
      this.filterBox.closeOverlay();
      // this.getAllWorkSchedule(this.currentPage, '', filters);
    }
  }


  copyEmail(email: string, user: any) {
    navigator.clipboard.writeText(email).then(() => {
      user.copied = true;
      setTimeout(() => user.copied = false, 2000);
    });
  }
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    // this.getAllWorkSchedule(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    // this.getAllWorkSchedule(this.currentPage);
  }
}
