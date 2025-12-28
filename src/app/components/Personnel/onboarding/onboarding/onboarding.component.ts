
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { OnboardingService } from 'app/core/services/personnel/onboarding/onboarding.service';

interface CheckItem {
  name: string;
  completed: boolean;
  editing?: boolean;
}
@Component({
  selector: 'app-onboarding',
  imports: [PageHeaderComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
  encapsulation: ViewEncapsulation.None
})
export class OnboardingComponent {
  checks: CheckItem[] = [];
  checkForm: FormGroup;
  loadingData: boolean = false;
  constructor(private router: Router, private fb: FormBuilder, private onboardingService: OnboardingService) {
    this.checkForm = this.fb.group({
      checkName: ['', Validators.required]
    });
  }
  ngOnInit() {

    this.getOnboarding();
  }


  getOnboarding() {
    this.loadingData = true;
    this.onboardingService.getOnboarding().subscribe({
      next: (response) => {
        const list = response.data?.list_items || [];
        this.checks = list.map((item: any) => ({
          name: item.title,
          completed: false,
          editing: false
        }));
        this.loadingData = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.loadingData = false;
      }
    });
  }

}
