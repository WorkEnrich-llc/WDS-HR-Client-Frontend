import { Component, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormsModule } from '@angular/forms';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-create-new-branch',
  imports: [PageHeaderComponent, CommonModule, TableComponent, OverlayFilterBoxComponent, FormsModule, PopupComponent],
  templateUrl: './create-new-branch.component.html',
  styleUrl: './create-new-branch.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class CreateNewBranchComponent {
  //deparment table
  @ViewChild('departmentTableHeader', { static: true }) departmentTableHeader!: TemplateRef<any>;
  @ViewChild('departmentTableRow', { static: true }) departmentTableRow!: TemplateRef<any>;

  // ِAdd department table
  @ViewChild('AlldepartmentTableHeader', { static: true }) AlldepartmentTableHeader!: TemplateRef<any>;
  @ViewChild('AlldepartmentTableRow', { static: true }) AlldepartmentTableRow!: TemplateRef<any>;

  //  overlay 
  @ViewChild('departmentsOverlay') departmentsOverlay!: OverlayFilterBoxComponent;
  @ViewChild('sectionsOverlay') sectionsOverlay!: OverlayFilterBoxComponent;

  currentStep = 1;
  selectAll: boolean = false;

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

  Alldepartments: any[] = [
    { id: 1, name: 'Human Resources' },
    { id: 2, name: 'Finance' },
    { id: 3, name: 'Marketing' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'Information Technology' },
    { id: 6, name: 'Customer Support' },
    { id: 7, name: 'Logistics' },
    { id: 8, name: 'Legal' },
  ];


  departments: any[] = [
    { id: 3, name: 'Marketing', sectionFrom: 4, sectionTo: 8 },
    { id: 5, name: 'Information Technology', sectionFrom: 4, sectionTo: 8 },
  ];


  sections: any[] = [
    { id: 4, name: 'Section 4', selected: true },
    { id: 5, name: 'Section 5', selected: false },
    { id: 6, name: 'Section 6', selected: true },
    { id: 7, name: 'Section 7', selected: false },
  ];

  sortDirection: string = 'asc';
  currentSortColumn: string = '';

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.departments = this.departments.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }



  //checkboxes 
  toggleSelectAll() {
    this.Alldepartments.forEach(department => {
      department.selected = this.selectAll;
    });
  }

  toggleDepartment(department: any) {
    if (!department.selected) {
      this.selectAll = false;
    } else if (this.Alldepartments.every(dep => dep.selected)) {
      this.selectAll = true;
    }
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
    // logic to deactivate
  }


  // overlays boxes sliders
  openFirstOverlay() {
    this.departmentsOverlay.openOverlay();
  }

  openSecondOverlay() {
    this.sectionsOverlay.openOverlay();
  }



  // toggle section selected
  toggleSectionSelection(section: any): void {
    section.selected = !section.selected;
  }
}
