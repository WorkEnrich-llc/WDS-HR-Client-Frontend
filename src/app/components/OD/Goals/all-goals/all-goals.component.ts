import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { TableComponent } from 'app/components/shared/table/table.component';
import { GoalsService } from 'app/core/services/od/goals/goals.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-all-goals',
  imports: [PageHeaderComponent, OverlayFilterBoxComponent, TableComponent, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './all-goals.component.html',
  styleUrl: './all-goals.component.css'
})
export class AllGoalsComponent {


  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


  filterForm!: FormGroup;
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService,
    private goalsService: GoalsService
  ) { }

  searchTerm: string = '';
 

  // ✅ Component variables
currentPage: number = 1;
totalpages: number = 0;
totalItems: number = 0;
itemsPerPage: number = 10;
loadData: boolean = false;
sortDirection: string = 'asc';
Goals: any[] = [];

private searchSubject = new Subject<string>();
private toasterSubscription!: Subscription;

ngOnInit(): void {
  this.getAllGoals(this.currentPage);

  this.toasterSubscription = this.toasterMessageService.currentMessage$
    .pipe(filter(msg => !!msg && msg.trim() !== ''))
    .subscribe(msg => {
      this.toastr.clear();
      this.toastr.success(msg, '', { timeOut: 3000 });
      this.toasterMessageService.clearMessage();
    });

  this.searchSubject
    .pipe(debounceTime(300))
    .subscribe(value => {
      this.currentPage = 1; // ✅ reset للصفحة أول لما تعمل بحث جديد
      this.getAllGoals(this.currentPage, value);
    });

  this.filterForm = this.fb.group({
    status: [''],
  });
}

getAllGoals(pageNumber: number = 1, searchTerm: string = ''): void {
  this.loadData = true;

  this.goalsService.getAllGoals(pageNumber, this.itemsPerPage, {
    search: searchTerm || undefined,
  }).subscribe({
    next: (response) => {
      const data = response?.data;

      this.currentPage = Number(data?.page ?? 1);
      this.totalItems = data?.total_items ?? 0;
      this.totalpages = data?.total_pages ?? 0;
      this.Goals = data?.list_items ?? [];

      console.log("Goals:", this.Goals);

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

ngOnDestroy(): void {
  if (this.toasterSubscription) {
    this.toasterSubscription.unsubscribe();
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
    this.searchSubject.next(this.searchTerm);
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      // const filters = {
      //   status: rawFilters.status || undefined,
      // };

      // console.log('Filters submitted:', filters);

      this.filterBox.closeOverlay();
      this.getAllGoals(this.currentPage, '');
    }
  }

  resetFilterForm(): void {
    this.filterForm.reset({
      status: '',
    });
    this.filterBox.closeOverlay();
    this.getAllGoals(this.currentPage);
  }



  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllGoals(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllGoals(this.currentPage);
  }
}
