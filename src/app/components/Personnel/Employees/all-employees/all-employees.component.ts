import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from './../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-all-employees',
  imports: [PageHeaderComponent, CommonModule, TableComponent, OverlayFilterBoxComponent, RouterLink, FormsModule],
  providers: [DatePipe],
  templateUrl: './all-employees.component.html',
  styleUrl: './all-employees.component.css'
})
export class AllEmployeesComponent {
  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

  employees = [
    {
      id: 1,
      name: "John Smith",
      employeeStatus: "New Joiner",
      accountStatus: "active",
      jobTitle: "Software Engineer",
      branch: "New York",
      joinDate: "2025-01-15"
    },
    {
      id: 2,
      name: "Emily Johnson",
      employeeStatus: "New Employee",
      accountStatus: "inactive",
      jobTitle: "Project Manager",
      branch: "London",
      joinDate: "2024-12-01"
    },
    {
      id: 3,
      name: "Michael Brown",
      employeeStatus: "Employed",
      accountStatus: "active",
      jobTitle: "UI/UX Designer",
      branch: "Berlin",
      joinDate: "2023-09-23"
    },
    {
      id: 4,
      name: "Sarah Lee",
      employeeStatus: "New Joiner",
      accountStatus: "active",
      jobTitle: "HR Specialist",
      branch: "Dubai",
      joinDate: "2025-06-01"
    },
    {
      id: 5,
      name: "David Wilson",
      employeeStatus: "Employed",
      accountStatus: "inactive",
      jobTitle: "Accountant",
      branch: "Toronto",
      joinDate: "2022-05-17"
    },
    {
      id: 6,
      name: "Olivia Davis",
      employeeStatus: "New Employee",
      accountStatus: "active",
      jobTitle: "Marketing Manager",
      branch: "Paris",
      joinDate: "2024-11-10"
    },
    {
      id: 7,
      name: "James Miller",
      employeeStatus: "Employed",
      accountStatus: "active",
      jobTitle: "DevOps Engineer",
      branch: "Sydney",
      joinDate: "2021-08-30"
    },
    {
      id: 8,
      name: "Ava Martinez",
      employeeStatus: "New Joiner",
      accountStatus: "inactive",
      jobTitle: "Business Analyst",
      branch: "Amsterdam",
      joinDate: "2025-05-20"
    },
    {
      id: 9,
      name: "William Anderson",
      employeeStatus: "New Employee",
      accountStatus: "active",
      jobTitle: "QA Engineer",
      branch: "Cairo",
      joinDate: "2024-10-05"
    },
    {
      id: 10,
      name: "Sophia Thomas",
      employeeStatus: "Employed",
      accountStatus: "inactive",
      jobTitle: "Product Owner",
      branch: "Riyadh",
      joinDate: "2023-03-18"
    },
    {
      id: 11,
      name: "Benjamin Taylor",
      employeeStatus: "New Joiner",
      accountStatus: "active",
      jobTitle: "Frontend Developer",
      branch: "Madrid",
      joinDate: "2025-06-10"
    },
    {
      id: 12,
      name: "Isabella Moore",
      employeeStatus: "Employed",
      accountStatus: "active",
      jobTitle: "Data Scientist",
      branch: "San Francisco",
      joinDate: "2022-07-01"
    }
  ];

  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // this.currentPage = +params['page'] || 1;
      // this.getAllDepartment(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      // this.getAllDepartment(this.currentPage, value);
    });

  }


  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.employees = this.employees.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }

  resetFilterForm(): void {

    this.filterBox.closeOverlay();
    // this.getAllDepartment(this.currentPage);
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }
  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    // this.getAllDepartment(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    // this.getAllDepartment(this.currentPage);
  }
}
