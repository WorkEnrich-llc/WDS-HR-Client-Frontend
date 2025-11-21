import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { GoalsService } from 'app/core/services/od/goals/goals.service';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-goal',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, ReactiveFormsModule, SkelatonLoadingComponent],
  providers: [DatePipe],
  templateUrl: './edit-goal.component.html',
  styleUrl: './edit-goal.component.css'
})
export class EditGoalComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  goalData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  goalId: string | null = null;
  loadData: boolean = false;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private goalsService: GoalsService,
    private toasterMessageService: ToasterMessageService,
    private subService: SubscriptionService
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
    this.goalId = this.route.snapshot.paramMap.get('id');
    // this.getGoal(Number(this.goalId));
    if (this.goalId) {
      this.getGoal(Number(this.goalId));
    }
  }

  getGoal(goalId: number) {
    this.loadData = true;

    this.goalsService.showGoal(goalId).subscribe({
      next: (response) => {
        this.goalData = response.data.object_info;
        const created = this.goalData?.created_at;
        const updated = this.goalData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }

        this.goalForm.patchValue({
          code: this.goalData?.code ?? '',
          name: this.goalData?.name ?? '',
          department_type: this.goalData?.goal_type?.id ?? '',
          Priority: this.goalData?.priority ?? ''
        });

        this.goalForm.markAsPristine();

        this.loadData = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.loadData = false;
      }
    });
  }
  goalForm: FormGroup = new FormGroup({
    code: new FormControl('', []),
    name: new FormControl('', [Validators.required]),
    department_type: new FormControl('', [Validators.required]),
    Priority: new FormControl('', [Validators.required]),
  });



  updateGoal() {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const formValue = this.goalForm.value;

    const requestData = {
      request_data: {
        id: Number(this.goalId),
        code: formValue.code || "",
        name: formValue.name,
        goal_type: Number(formValue.department_type),
        priority: Number(formValue.Priority)
      }
    };


    this.goalsService.updateGoal(requestData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errMsg = '';
        this.toasterMessageService.sendMessage("Goal updated successfully");
        this.goalForm.markAsPristine();
        this.router.navigate(['/goals']);
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
