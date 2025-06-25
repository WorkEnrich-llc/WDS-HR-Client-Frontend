import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-work-schedule',
  imports: [PageHeaderComponent, CommonModule, TableComponent, FormsModule, OverlayFilterBoxComponent, RouterLink],
  providers: [DatePipe],
  templateUrl: './work-schedule.component.html',
  styleUrl: './work-schedule.component.css'
})
export class WorkScheduleComponent {

  filterForm!: FormGroup;
  constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private datePipe: DatePipe, private fb: FormBuilder) { }

 @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  

  workschaduale = [
    {
      id: 1,
      name: 'Morning Shift',
      status: 'active',
      created_at: '10/01/2024',
      updated_at: '25/06/2025',
      employment_type: 'Full-Time'
    },
    {
      id: 2,
      name: 'Evening Shift',
      status: 'inactive',
      created_at: '12/03/2023',
      updated_at: '25/06/2025',
      employment_type: 'Part-Time'
    },
    {
      id: 3,
      name: 'Night Shift',
      status: 'active',
      created_at: '05/07/2022',
      updated_at: '01/01/2025',
      employment_type: 'Shift Schedule'
    },
    {
      id: 4,
      name: 'Weekend Schedule',
      status: 'active',
      created_at: '22/09/2023',
      updated_at: '25/06/2025',
      employment_type: 'Freelance'
    },
    {
      id: 5,
      name: 'Remote Work',
      status: 'inactive',
      created_at: '14/02/2023',
      updated_at: '20/05/2025',
      employment_type: 'Remote'
    },
    {
      id: 6,
      name: 'Contract-Based',
      status: 'active',
      created_at: '01/08/2023',
      updated_at: '15/06/2025',
      employment_type: 'Contract'
    },
    {
      id: 7,
      name: 'Temporary Project',
      status: 'inactive',
      created_at: '09/11/2022',
      updated_at: '25/06/2025',
      employment_type: 'Temporary Schedule'
    },
    {
      id: 8,
      name: 'Hybrid Mode',
      status: 'active',
      created_at: '18/04/2024',
      updated_at: '25/06/2025',
      employment_type: 'Hybrid'
    },
    {
      id: 9,
      name: 'Flexible Timing',
      status: 'active',
      created_at: '30/05/2023',
      updated_at: '25/06/2025',
      employment_type: 'Flexible Schedule'
    },
    {
      id: 10,
      name: 'Night Shift Backup',
      status: 'inactive',
      created_at: '25/12/2022',
      updated_at: '10/06/2025',
      employment_type: 'Shift Schedule'
    },
    {
      id: 11,
      name: 'Day Shift',
      status: 'active',
      created_at: '01/01/2024',
      updated_at: '25/06/2025',
      employment_type: 'Full-Time'
    },
    {
      id: 12,
      name: 'On-demand Freelance',
      status: 'inactive',
      created_at: '17/06/2023',
      updated_at: '22/06/2025',
      employment_type: 'Freelance'
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
    this.workschaduale = this.workschaduale.sort((a, b) => {
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
