
import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ManageEmployeeSharedService } from '../services/manage-shared.service';
import { Country } from '../countries-list';

import { Validators } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-main-information-step',
  imports: [ReactiveFormsModule],
  templateUrl: './main-information-step.component.html',
  styleUrls: ['./main-information-step.component.css'],
  // removed viewProviders as using explicit [formGroup] in template
})
export class MainInformationStepComponent {
  sharedService = inject(ManageEmployeeSharedService);

  constructor() {
    // Add pattern validator for full name: at least four parts (words)
    const nameEnglish = this.sharedService.mainInformation.get('name_english');
    if (nameEnglish) {
      nameEnglish.addValidators([
        Validators.pattern(/^(\S+\s+){3,}\S+$/)
      ]);
      nameEnglish.updateValueAndValidity();
    }
    const nameArabic = this.sharedService.mainInformation.get('name_arabic');
    if (nameArabic) {
      nameArabic.addValidators([
        Validators.pattern(/^(\S+\s+){3,}\S+$/)
      ]);
      nameArabic.updateValueAndValidity();
    }
  }

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
