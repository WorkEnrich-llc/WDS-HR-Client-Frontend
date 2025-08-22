import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { OnboardingService } from 'app/core/services/personnel/onboarding/onboarding.service';

interface CheckItem {
  name: string;
  completed: boolean;
  editing?: boolean;
}
@Component({
  selector: 'app-onboarding',
  imports: [PageHeaderComponent, ReactiveFormsModule, CommonModule,RouterLink],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
  encapsulation:ViewEncapsulation.None
})
export class OnboardingComponent {
  checks: CheckItem[] = [];
  checkForm: FormGroup;
  constructor(private router: Router, private fb: FormBuilder, private onboardingService: OnboardingService) {
    this.checkForm = this.fb.group({
      checkName: ['', Validators.required]
    });
  }
  ngOnInit() {

    this.getOnboarding();
  }


  getOnboarding() {
    this.onboardingService.getOnboarding().subscribe({
      next: (response) => {
        const list = response.data.object_info.onboarding_list || [];

        this.checks = list.map((item: any) => ({
          name: item.title,
          completed: false,
          editing: false
        }));
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

}
