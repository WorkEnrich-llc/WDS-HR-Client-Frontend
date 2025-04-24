import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-departments',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, TableComponent, PopupComponent, CommonModule],
  templateUrl: './view-departments.component.html',
  styleUrls: ['./view-departments.component.css']
})
export class ViewDepartmentsComponent {
  
  sections: any[] = [
    { id: 1, name: 'Recruitment', status: 'Active' },
    { id: 2, name: 'Payroll', status: 'Not Active' },
    { id: 3, name: 'Employee Relations', status: 'Active' },
 ];
  


  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sections = this.sections.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }




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
}
