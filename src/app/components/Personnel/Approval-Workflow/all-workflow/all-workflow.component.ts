import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { CommonModule } from '@angular/common';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-all-workflow',
  imports: [PageHeaderComponent,TableComponent,CommonModule,OverlayFilterBoxComponent,RouterLink,FormsModule],
  templateUrl: './all-workflow.component.html',
  styleUrl: './all-workflow.component.css'
})
export class AllWorkflowComponent {
  filterForm!: FormGroup;
  constructor( private route: ActivatedRoute,private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
     private fb: FormBuilder) { }

 @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;

leaveRequests = [
  {
    id: 1,
    name: "Ali Hassan",
    leaveType: "Sick Leave",
    department: "IT",
    jobLevel: "Senior",
    employmentType: "Full-time",
    createdAt: "26/06/2025",
    updatedAt: "26/06/2025"
  },
  {
    id: 2,
    name: "Sara Ahmed",
    leaveType: "Annual Leave",
    department: "HR",
    jobLevel: "Junior",
    employmentType: "Part-time",
    createdAt: "25/06/2025",
    updatedAt: "26/06/2025"
  },
  {
    id: 3,
    name: "Mohamed Ali",
    leaveType: "Maternity Leave",
    department: "Finance",
    jobLevel: "Mid",
    employmentType: "Full-time",
    createdAt: "24/06/2025",
    updatedAt: "25/06/2025"
  },
  {
    id: 4,
    name: "Nour Khaled",
    leaveType: "Unpaid Leave",
    department: "Marketing",
    jobLevel: "Junior",
    employmentType: "Internship",
    createdAt: "23/06/2025",
    updatedAt: "24/06/2025"
  },
  {
    id: 5,
    name: "Tariq Zaki",
    leaveType: "Emergency Leave",
    department: "Support",
    jobLevel: "Senior",
    employmentType: "Remote",
    createdAt: "22/06/2025",
    updatedAt: "23/06/2025"
  },
  {
    id: 6,
    name: "Huda Sami",
    leaveType: "Annual Leave",
    department: "Legal",
    jobLevel: "Mid",
    employmentType: "Contract",
    createdAt: "21/06/2025",
    updatedAt: "22/06/2025"
  },
  {
    id: 7,
    name: "Omar Fathy",
    leaveType: "Sick Leave",
    department: "IT",
    jobLevel: "Junior",
    employmentType: "Full-time",
    createdAt: "20/06/2025",
    updatedAt: "21/06/2025"
  },
  {
    id: 8,
    name: "Laila Hisham",
    leaveType: "Annual Leave",
    department: "Design",
    jobLevel: "Senior",
    employmentType: "Part-time",
    createdAt: "19/06/2025",
    updatedAt: "20/06/2025"
  },
  {
    id: 9,
    name: "Ahmed Ezz",
    leaveType: "Maternity Leave",
    department: "HR",
    jobLevel: "Junior",
    employmentType: "Full-time",
    createdAt: "18/06/2025",
    updatedAt: "19/06/2025"
  },
  {
    id: 10,
    name: "Mona Said",
    leaveType: "Unpaid Leave",
    department: "Sales",
    jobLevel: "Mid",
    employmentType: "Contract",
    createdAt: "17/06/2025",
    updatedAt: "18/06/2025"
  },
  {
    id: 11,
    name: "Khaled Fawzy",
    leaveType: "Sick Leave",
    department: "Operations",
    jobLevel: "Senior",
    employmentType: "Full-time",
    createdAt: "16/06/2025",
    updatedAt: "17/06/2025"
  },
  {
    id: 12,
    name: "Rania Magdy",
    leaveType: "Annual Leave",
    department: "PR",
    jobLevel: "Junior",
    employmentType: "Remote",
    createdAt: "15/06/2025",
    updatedAt: "16/06/2025"
  },
  {
    id: 13,
    name: "Hassan Omar",
    leaveType: "Emergency Leave",
    department: "Logistics",
    jobLevel: "Mid",
    employmentType: "Full-time",
    createdAt: "14/06/2025",
    updatedAt: "15/06/2025"
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
        this.leaveRequests = this.leaveRequests.sort((a, b) => {
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
