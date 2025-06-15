import { Component, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { Router } from '@angular/router';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-create-new-branch',
  imports: [PageHeaderComponent, CommonModule, TableComponent, OverlayFilterBoxComponent, FormsModule, PopupComponent, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './create-new-branch.component.html',
  styleUrl: './create-new-branch.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class CreateNewBranchComponent implements OnInit {
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
    private _BranchesService: BranchesService,
    private toasterMessageService: ToasterMessageService,
    private _DepartmentsService: DepartmentsService
  ) {


    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
    // console.log(this.todayFormatted); 
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

  // form step 1
  branchStep1: FormGroup = new FormGroup({
    code: new FormControl(''),
    name: new FormControl('', [Validators.required]),
    location: new FormControl(''),
    maxEmployee: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
  });


  // form step 2
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

        this.departments = response.data.list_items.map((item: any) => {
          const isSelected = this.addeddepartments.some(dep => dep.id === item.id);

          const sectionsWithSelection = (item.sections || []).map((section: any) => ({
            ...section,
            selected: false
          }));

          return {
            id: item.id,
            name: item.name,
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
          selectedSection: 0,
          sectionsCount: dep.sectionsCount,
          sections: dep.sections,
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







  // discard popup
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/branches/all-branches']);
  }


  // overlays boxes sliders
  openFirstOverlay() {
    this.departmentsOverlay.openOverlay();
  }

  selectedDepartmentSections: any[] = [];

  openSecondOverlay(department: any): void {
    this.selectedDepartmentId = department.id;

    this.tempSections = (department.sections || []).map((section: any) => ({
      ...section
    }));

    this.selectedDepartmentSections = this.tempSections;
    this.sectionsOverlay.openOverlay();
  }


  selectedDepartmentId: number | null = null;
  tempSections: any[] = [];
  toggleSectionSelection(section: any): void {
    section.selected = !section.selected;
  }
  confirmSectionChanges(): void {
    const department = this.addeddepartments.find(dep => dep.id === this.selectedDepartmentId);
    if (!department) return;

    department.sections = this.tempSections.map(section => ({ ...section }));

    const selectedCount = department.sections.filter((section: any) => section.selected).length;

    department.selectedSection = selectedCount;

    this.sectionsOverlay.closeOverlay();
  }
  discardSectionChanges(): void {
    this.selectedDepartmentId = null;
    this.tempSections = [];
    this.selectedDepartmentSections = [];
    this.sectionsOverlay.closeOverlay();
  }


  // create branch
  createBranch(): void {
    if (this.branchStep1.invalid) {
      console.warn('Form is invalid');
      return;
    }

    const formData = this.branchStep1.value;

    const departments = this.addeddepartments.map((dep, depIndex) => {
      return {
        id: dep.id,
        record_type: 'add',
        index: depIndex + 1,
        sections: (dep.sections || [])
          .filter((section: any) => section.selected)
          .map((section: any, secIndex: number) => ({
            id: section.id,
            record_type: 'add',
            index: secIndex + 1
          }))
      };
    });

    const requestPayload = {
      request_data: {
        code: formData.code,
        name: formData.name,
        location: formData.location,
        max_employee: Number(formData.maxEmployee),
        departments: departments
      }
    };

    // console.log(requestPayload);
    this._BranchesService.createBranch(requestPayload).subscribe({

      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/branches/all-branches']);
        this.toasterMessageService.sendMessage("Branch created successfully");

      },
      error: (err) => {
        this.isLoading = false;
        const errorHandling = err?.error?.data?.error_handling;
        if (Array.isArray(errorHandling) && errorHandling.length > 0) {
          this.currentStep = errorHandling[0].tap;
          this.errMsg = errorHandling[0].error;
        } else {
          this.errMsg = "An unexpected error occurred Please try again later.";
        }
      }
    });
  }


  // steps
  currentStep = 1;

  goNext() {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  goPrev() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }


  // added departmets table search
  searchAddedDepartmentTerm: string = '';

  get filteredDepartments() {
    return this.addeddepartments.filter(dept =>
      dept.name?.toLowerCase().includes(this.searchAddedDepartmentTerm.toLowerCase())
    );
  }


  searchDeptSectionsTerm: string = '';

  get filteredSections() {
    return this.selectedDepartmentSections.filter(dept =>
      dept.name?.toLowerCase().includes(this.searchDeptSectionsTerm.toLowerCase())
    );
  }
}
