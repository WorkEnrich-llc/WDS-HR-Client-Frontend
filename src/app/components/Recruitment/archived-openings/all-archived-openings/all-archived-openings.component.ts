import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { TableComponent } from '../../../shared/table/table.component';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-all-archived-openings',
  imports: [PageHeaderComponent,TableComponent,CommonModule, OverlayFilterBoxComponent, RouterLink, FormsModule],
  providers: [DatePipe],
  templateUrl: './all-archived-openings.component.html',
  styleUrl: './all-archived-openings.component.css'
})
export class AllArchivedOpeningsComponent {
 constructor(private route: ActivatedRoute, private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private fb: FormBuilder) { }

  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  loadData:boolean =false;
  filterForm!: FormGroup;
  approvalRequests = [
    {
      jobId: 101,
      jobName: 'Job Name',
      branchId: 20,
      branchName:'Brach Name',
      empType: 'Full-Time',
      numApplicant:100,
      numApply:47,
      numSchadule:12,
      numRejected:10,
      numAccepted:2
    },
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
