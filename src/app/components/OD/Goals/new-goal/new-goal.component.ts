import { DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { SystemSetupTourComponent } from 'app/components/shared/system-setup-tour/system-setup-tour.component';
import { GoalsService } from 'app/core/services/od/goals/goals.service';
import { SystemSetupService } from 'app/core/services/main/system-setup.service';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-new-goal',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule, SystemSetupTourComponent],
  providers: [DatePipe],
  templateUrl: './new-goal.component.html',
  styleUrl: './new-goal.component.css'
})
export class NewGoalComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  //  System Setup Tour
  @ViewChild(SystemSetupTourComponent) systemSetupTour!: SystemSetupTourComponent;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private goalsService: GoalsService,
    private toasterMessageService: ToasterMessageService,
    private subService: SubscriptionService,
    private systemSetupService: SystemSetupService
  ) {


    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  GoalsSub: any;
  ngOnInit(): void {
    // subscription data
    this.subService.subscription$.subscribe(sub => {
      this.GoalsSub = sub?.Goals;
      // if (this.GoalsSub) {
      //   console.log("info:", this.GoalsSub.info);
      //   console.log("create:", this.GoalsSub.create);
      //   console.log("update:", this.GoalsSub.update);
      //   console.log("delete:", this.GoalsSub.delete);
      // }
    });
  }


  goalForm: FormGroup = new FormGroup({
    code: new FormControl('', []),
    name: new FormControl('', [Validators.required]),
    department_type: new FormControl('', [Validators.required]),
    Priority: new FormControl('', [Validators.required]),
  });


  createGoal() {
    this.isLoading = true;

    const formValue = this.goalForm.value;

    const requestData = {
      request_data: {
        code: formValue.code || "",
        name: formValue.name,
        goal_type: Number(formValue.department_type),
        priority: Number(formValue.Priority)
      }
    };
    this.goalsService.createGoal(requestData).subscribe({

      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        // create success
        this.router.navigate(['/goals']);
        this.toasterMessageService.showSuccess("Goal created successfully", "Created Successfully");
        // Notify system setup tour
        this.systemSetupService.notifyModuleItemCreated('goals');

        // Show celebration animation
        if (this.systemSetupTour) {
          setTimeout(() => {
            this.systemSetupTour.showCelebration('goals');
          }, 500); // Small delay to ensure data is refreshed
        }

      },
      error: (err) => {
        this.isLoading = false;
        const statusCode = err?.status;
        const errorHandling = err?.error?.data?.error_handling;

        if (statusCode === 400) {
          if (Array.isArray(errorHandling) && errorHandling.length > 0) {
            this.errMsg = errorHandling[0].error;
          } else if (err?.error?.details) {
            this.errMsg = err.error.details;
          } else {
            this.errMsg = "An unexpected error occurred. Please try again later.";
          }
        } else {
          this.errMsg = "An unexpected error occurred. Please try again later.";
        }
      }

    });
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
    this.router.navigate(['/goals']);
  }
}
