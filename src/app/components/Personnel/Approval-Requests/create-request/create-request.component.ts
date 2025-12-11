
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { MainInformationStepComponent } from './main-information-step/main-information-step.component';
import { RequestDetailsStepComponent } from './request-details-step/request-details-step.component';
import { CreateRequestSharedService } from './services/create-request-shared.service';
import { StepperNavigationComponent } from './stepper-navigation/stepper-navigation.component';


@Component({
  standalone: true,
  selector: 'app-create-request',
  imports: [
    PageHeaderComponent,
    ReactiveFormsModule,
    PopupComponent,
    StepperNavigationComponent,
    MainInformationStepComponent,
    RequestDetailsStepComponent
],
  templateUrl: './create-request.component.html',
  styleUrls: ['./create-request.component.css'],
})
export class CreateRequestComponent implements OnInit {
  // Dependency Injection
  private router = inject(Router);
  private toasterMessageService = inject(ToasterMessageService);
  public sharedService = inject(CreateRequestSharedService);

  ngOnInit(): void {
    // Reset the form when component initializes
    this.sharedService.resetForm();
  }

  // Modal handlers
  openModal() {
    this.sharedService.isModalOpen.set(true);
  }

  closeModal() {
    this.sharedService.isModalOpen.set(false);
  }

  confirmAction() {
    this.sharedService.isModalOpen.set(false);
    this.router.navigate(['/requests']);
  }

  openSuccessModal() {
    this.sharedService.isSuccessModalOpen.set(true);
  }

  closeSuccessModal() {
    this.sharedService.isSuccessModalOpen.set(false);
  }

  viewRequests() {
    this.closeSuccessModal();
    this.router.navigate(['/requests']);
  }

  createAnother() {
    this.closeSuccessModal();
    this.sharedService.resetForm();
  }

  // Form submission
  onSubmit() {
    if (this.sharedService.requestForm.valid) {
      this.sharedService.isLoading.set(true);
      this.sharedService.errMsg.set('');

      const formData = this.sharedService.requestForm.value;

      // Simulate API call for now
      setTimeout(() => {
        this.sharedService.isLoading.set(false);
        this.sharedService.errMsg.set('');
        this.toasterMessageService.showSuccess('Request created successfully');
        this.router.navigate(['/requests']);
      }, 2000);

    } else {
      this.sharedService.requestForm.markAllAsTouched();
      this.sharedService.errMsg.set('Please fill in all required fields');

      // Scroll to first invalid field
      const firstInvalidField = document.querySelector('.is-invalid');
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}
