import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { TableComponent } from '../../../shared/table/table.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-departments',
  imports: [PageHeaderComponent,CommonModule,PopupComponent,TableComponent,FormsModule],
  templateUrl: './edit-departments.component.html',
  styleUrl: './edit-departments.component.css'
})
export class EditDepartmentsComponent {


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


  sections: any[] = [
    { id: 4, name: 'Section 4', selected: true ,status:'deactivate'},
    { id: 5, name: 'Section 5', selected: false ,status:'activate'},
    
  ];


  toggleSectionStatus(section: any) {
    section.status = section.status === 'activate' ? 'deactivate' : 'activate';
  }
  

  addSection() {
    this.sections.push({ id: '', name: '' });
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


}
