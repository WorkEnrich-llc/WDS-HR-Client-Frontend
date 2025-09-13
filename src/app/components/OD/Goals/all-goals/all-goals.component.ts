import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OverlayFilterBoxComponent } from 'app/components/shared/overlay-filter-box/overlay-filter-box.component';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { TableComponent } from 'app/components/shared/table/table.component';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-all-goals',
  imports: [PageHeaderComponent, OverlayFilterBoxComponent, TableComponent,RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './all-goals.component.html',
  styleUrl: './all-goals.component.css'
})
export class AllGoalsComponent {


  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;


  filterForm!: FormGroup;
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) { }

  searchTerm: string = '';
  goals: any[] = [
  { id: 1, name: 'Goal 1', status: 'Assigned', department: 'HR' },
  { id: 2, name: 'Goal 2', status: 'Unassigned', department: 'IT' },
  { id: 3, name: 'Goal 3', status: 'Assigned', department: 'Finance' },
  { id: 4, name: 'Goal 4', status: 'Unassigned', department: 'Marketing' }
];

  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  loadData: boolean = false;
  sortDirection: string = 'asc';

  private searchSubject = new Subject<string>();
  
  
  // sortting
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.goals = this.goals.sort((a, b) => {
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
  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      // this.getAllDepartment(this.currentPage, value);
    });


    this.filterForm = this.fb.group({
      status: [''],
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  filter(): void {
    if (this.filterForm.valid) {
      const rawFilters = this.filterForm.value;

      const filters = {
        status: rawFilters.status || undefined,
      };

      // console.log('Filters submitted:', filters);
      this.filterBox.closeOverlay();
      // this.getAllDepartment(this.currentPage, '', filters);
    }
  }

  resetFilterForm(): void {
    this.filterForm.reset({
      status: '',
    });
    this.filterBox.closeOverlay();
    // this.getAllDepartment(this.currentPage);
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
