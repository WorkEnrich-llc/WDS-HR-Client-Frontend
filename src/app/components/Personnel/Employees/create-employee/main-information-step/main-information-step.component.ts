import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateEmployeeSharedService } from '../services/create-employee-shared.service';
import { Country } from '../countries-list';

@Component({
  standalone: true,
  selector: 'app-main-information-step',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './main-information-step.component.html',
  styleUrls: ['./main-information-step.component.css'],
  // removed viewProviders as using explicit [formGroup] in template
})
export class MainInformationStepComponent {
  sharedService = inject(CreateEmployeeSharedService);

  @ViewChild('dropdownContainer') dropdownRef!: ElementRef;

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(target)) {
      this.sharedService.dropdownOpen.set(false);
    }
  }

  selectCountry(country: Country) {
    this.sharedService.selectCountry(country);
  }

  getSelectedCountry(): Country {
    return this.sharedService.getSelectedCountry();
  }

  goNext() {
    this.sharedService.goNext();
  }
}
