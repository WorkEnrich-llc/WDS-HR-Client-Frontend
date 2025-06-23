import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { PageHeaderComponent } from './../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { FormsModule } from '@angular/forms';
import { COUNTRIES, Country } from './countries-list';
import { PopupComponent } from '../../../shared/popup/popup.component';
@Component({
  selector: 'app-create-employee',
  imports: [PageHeaderComponent, CommonModule,FormsModule,PopupComponent],
  providers:[DatePipe],
  templateUrl: './create-employee.component.html',
  styleUrl: './create-employee.component.css'
})
export class CreateEmployeeComponent {

  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  
  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }


  @ViewChild('dropdownContainer') dropdownRef!: ElementRef;
  dropdownOpen = false;

  countries: Country[] = COUNTRIES;
  selectedCountry: Country = COUNTRIES[0];

  selectCountry(country: any) {
    this.selectedCountry = country;
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(target)) {
      this.dropdownOpen = false;
    }
  }

  



  // next and prev
  currentStep = 1;
  selectAll: boolean = false;

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
  this.router.navigate(['/employees/all-employees']);
}

openSuccessModal() {
  this.isSuccessModalOpen = true;
}

closeSuccessModal() {
  this.isSuccessModalOpen = false;
}

viewEmployees() {
  this.closeSuccessModal();
  this.router.navigate(['/employees/all-employees']);
}

createAnother() {
  this.closeSuccessModal();
  // Reset form or navigate to create again
}

}
