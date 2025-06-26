import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { TableComponent } from '../../../shared/table/table.component';

@Component({
  selector: 'app-all-leave-types',
  imports: [PageHeaderComponent,CommonModule,RouterLink,OverlayFilterBoxComponent,TableComponent,FormsModule],
  templateUrl: './all-leave-types.component.html',
  styleUrl: './all-leave-types.component.css'
})
export class AllLeaveTypesComponent {

  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
     private fb: FormBuilder) { }

 @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  
 leaveTypes= [
  {
    id: 1,
    name: 'Annual Leave',
    accrualRate: 1.5,
    employmentType: 'Full-time',
    createdAt: '26/06/2025',
    updatedAt: '26/06/2025',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Sick Leave',
    accrualRate: 1,
    employmentType: 'Part-time',
    createdAt: '25/06/2025',
    updatedAt: '26/06/2025',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Maternity Leave',
    accrualRate: 1.2,
    employmentType: 'Contract',
    createdAt: '20/06/2025',
    updatedAt: '26/06/2025',
    status: 'Inactive'
  },
  {
    id: 4,
    name: 'Paternity Leave',
    accrualRate: 0.8,
    employmentType: 'Full-time',
    createdAt: '15/06/2025',
    updatedAt: '26/06/2025',
    status: 'Active'
  },
  {
    id: 5,
    name: 'Bereavement Leave',
    accrualRate: 1,
    employmentType: 'Remote',
    createdAt: '10/06/2025',
    updatedAt: '26/06/2025',
    status: 'Inactive'
  },
  {
    id: 6,
    name: 'Study Leave',
    accrualRate: 1.3,
    employmentType: 'Internship',
    createdAt: '05/06/2025',
    updatedAt: '26/06/2025',
    status: 'Active'
  },
  {
    id: 7,
    name: 'Unpaid Leave',
    accrualRate: 0,
    employmentType: 'Contract',
    createdAt: '01/06/2025',
    updatedAt: '26/06/2025',
    status: 'Inactive'
  },
  {
    id: 8,
    name: 'Compassionate Leave',
    accrualRate: 1.1,
    employmentType: 'Part-time',
    createdAt: '28/05/2025',
    updatedAt: '26/06/2025',
    status: 'Active'
  },
  {
    id: 9,
    name: 'Marriage Leave',
    accrualRate: 1,
    employmentType: 'Full-time',
    createdAt: '20/05/2025',
    updatedAt: '26/06/2025',
    status: 'Inactive'
  },
  {
    id: 10,
    name: 'Emergency Leave',
    accrualRate: 0.9,
    employmentType: 'Remote',
    createdAt: '15/05/2025',
    updatedAt: '26/06/2025',
    status: 'Active'
  },
  {
    id: 11,
    name: 'Personal Leave',
    accrualRate: 1.4,
    employmentType: 'Internship',
    createdAt: '10/05/2025',
    updatedAt: '26/06/2025',
    status: 'Inactive'
  },
  {
    id: 12,
    name: 'Jury Duty',
    accrualRate: 1,
    employmentType: 'Full-time',
    createdAt: '05/05/2025',
    updatedAt: '26/06/2025',
    status: 'Active'
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
      this.leaveTypes = this.leaveTypes.sort((a, b) => {
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
