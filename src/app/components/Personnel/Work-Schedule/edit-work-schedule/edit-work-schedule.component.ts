import { Component, TemplateRef, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-work-schedule',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, TableComponent, FormsModule, OverlayFilterBoxComponent],
  providers:[DatePipe],
  templateUrl: './edit-work-schedule.component.html',
  styleUrl: './edit-work-schedule.component.css'
})
export class EditWorkScheduleComponent {
 //deparment table
  @ViewChild('departmentTableHeader', { static: true }) departmentTableHeader!: TemplateRef<any>;
  @ViewChild('departmentTableRow', { static: true }) departmentTableRow!: TemplateRef<any>;

  // ِAdd department table
  @ViewChild('AlldepartmentTableHeader', { static: true }) AlldepartmentTableHeader!: TemplateRef<any>;
  @ViewChild('AlldepartmentTableRow', { static: true }) AlldepartmentTableRow!: TemplateRef<any>;

  //  overlay 
  @ViewChild('departmentsOverlay') departmentsOverlay!: OverlayFilterBoxComponent;
  @ViewChild('sectionsOverlay') sectionsOverlay!: OverlayFilterBoxComponent;

  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService,
    private _DepartmentsService: DepartmentsService
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }
  ngOnInit(): void {
    // department added and search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.currentPage = 1;
      this.getAllDepartment(this.currentPage, search);
    });
    this.getAllDepartment(this.currentPage);



  }
  // step 2
  departments: any[] = [];
  addeddepartments: any[] = [];
  selectAll: boolean = false;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  getAllDepartment(pageNumber: number, searchTerm: string = '') {
    this._DepartmentsService.getAllDepartment(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        // console.log(response.data.list_items)
        this.departments = response.data.list_items.map((item: any) => {
          const isSelected = this.addeddepartments.some(dep => dep.id === item.id);

          const sectionsWithSelection = (item.sections || []).map((section: any) => ({
            ...section,
            selected: false
          }));

          return {
            id: item.id,
            name: item.name,
            create: item.created_at,
            sectionsCount: sectionsWithSelection.length,
            sections: sectionsWithSelection,
            selected: isSelected
          };
        });
        this.selectAll = this.departments.length > 0 && this.departments.every(dep => dep.selected);
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

  //checkboxes 
  toggleSelectAll() {
    this.departments.forEach(department => {
      department.selected = this.selectAll;
    });
  }
  toggleDepartment(department: any) {
    // department.selected = !department.selected;
    if (!department.selected) {
      this.selectAll = false;
    } else if (this.departments.length && this.departments.every(dep => dep.selected)) {
      this.selectAll = true;
    }
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllDepartment(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllDepartment(this.currentPage);
  }
  discardDepartment(): void {
    this.departmentsOverlay.closeOverlay();
  }

  addSelectedDepartments(): void {
    const selected = this.departments.filter(dep => dep.selected);

    selected.forEach(dep => {
      const alreadyAdded = this.addeddepartments.some(added => added.id === dep.id);
      if (!alreadyAdded) {
        this.addeddepartments.push({
          id: dep.id,
          name: dep.name,
          create: dep.create,
          selectedSection: 0,
          sectionsCount: dep.sectionsCount,
          sections: dep.sections,
          status: false
        });
      }
    });

    this.addeddepartments = this.addeddepartments.filter(added =>
      selected.some(dep => dep.id === added.id)
    );

    this.departmentsOverlay.closeOverlay();
    // console.log(this.addeddepartments);
  }


  // remove Department from selected departments
  removeDepartment(department: any): void {
    const index = this.addeddepartments.findIndex(dep => dep.id === department.id);
    if (index !== -1) {
      this.addeddepartments.splice(index, 1);
    }

    const deptInList = this.departments.find(dep => dep.id === department.id);
    if (deptInList) {
      deptInList.selected = false;
    }

    this.selectAll = this.departments.length > 0 && this.departments.every(dep => dep.selected);
  }

  // overlays boxes sliders
  openFirstOverlay() {
    this.departmentsOverlay.openOverlay();
  }

  selectedDepartmentSections: any[] = [];
  // added departmets table search
  searchAddedDepartmentTerm: string = '';

  get filteredDepartments() {
    return this.addeddepartments.filter(dept =>
      dept.name?.toLowerCase().includes(this.searchAddedDepartmentTerm.toLowerCase())
    );
  }


  searchDeptSectionsTerm: string = '';






  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.addeddepartments = this.addeddepartments.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }
  toggleStatus(department: any): void {
    department.status = !department.status;
  }



  // select days
  days = [
    { name: 'Sunday', selected: false },
    { name: 'Monday', selected: false },
    { name: 'Tuesday', selected: false },
    { name: 'Wednesday', selected: false },
    { name: 'Thursday', selected: false },
    { name: 'Friday', selected: false },
    { name: 'Saturday', selected: false },
  ];

  toggleDay(index: number): void {
    this.days[index].selected = !this.days[index].selected;
  }

  // next and prev
  currentStep = 1;

  goNext() {
    this.currentStep++;

  }

  goPrev() {
    this.currentStep--;
  }





  // popups
  isModalOpen = false;
  isSuccessModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/schedule/work-schedule']);
  }

}
