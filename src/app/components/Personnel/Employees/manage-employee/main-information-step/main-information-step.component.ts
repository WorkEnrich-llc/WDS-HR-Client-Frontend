
import { Component, ElementRef, HostListener, inject, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
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
  today = new Date();
  minDate = new Date(this.today.setFullYear(this.today.getFullYear() - 70)).toISOString().split('T')[0];
  maxDate = new Date(new Date().setFullYear(new Date().getFullYear() - 15)).toISOString().split('T')[0];
  cdr = inject(ChangeDetectorRef);

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

    const imgControl = this.sharedService.mainInformation.get('profile_image');
    if (imgControl?.value) {
      this.previewUrl = imgControl.value;
    }
    imgControl?.valueChanges.subscribe((val) => {
      if (val) {
        this.previewUrl = val;
      }
    });
  }

  @ViewChild('dropdownContainer') dropdownRef!: ElementRef;

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return;
    }
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



  // image
  previewUrl: string | ArrayBuffer | null = null;
  markLogoTouched() {
    this.sharedService.mainInformation.get('profile_image')?.markAsTouched();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const imgControl = this.sharedService.mainInformation.get('profile_image');

    this.previewUrl = null;
    imgControl?.setErrors(null);
    imgControl?.markAsTouched();
    this.sharedService.mainInformation.updateValueAndValidity();
    this.sharedService.mainInformation.markAsTouched();
    if (!file) {
      imgControl?.setErrors({ required: true });
      return;
    }

    // const isPng = file.type === 'image/png';
    const isUnder16MB = file.size <= 16 * 1024 * 1024;

    // if (!isPng) {
    //   imgControl?.setErrors({ invalidFormat: true });
    //   return;
    // }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      imgControl?.setErrors({ invalidFormat: true });
      return;
    }

    if (!isUnder16MB) {
      imgControl?.setErrors({ maxSize: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
      imgControl?.setValue(reader.result); // Send base64 string instead of file
      imgControl?.setErrors(null);
      this.cdr.detectChanges();

      this.sharedService.mainInformation.updateValueAndValidity();
      this.sharedService.mainInformation.markAsTouched();
      imgControl?.markAsDirty();
      input.value = '';
    };
    reader.readAsDataURL(file);
  }


}
