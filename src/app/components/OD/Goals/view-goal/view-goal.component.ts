import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { GoalsService } from 'app/core/services/od/goals/goals.service';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';

@Component({
  selector: 'app-view-goal',
  imports: [PageHeaderComponent, RouterLink, CommonModule, PopupComponent,SkelatonLoadingComponent],
  providers: [DatePipe],
  templateUrl: './view-goal.component.html',
  styleUrl: './view-goal.component.css'
})
export class ViewGoalComponent {

  constructor(
    private goalsService: GoalsService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private subService: SubscriptionService
  ) { }
  goalData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  goalId: string | null = null;
  loadData: boolean = false;

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
        console.log(this.goalData);

        this.loadData = false;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }

  deactivateOpen = false;
  activateOpen = false;
  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  confirmDeactivate() {
    this.deactivateOpen = false;

    const goalStatus = {
      request_data: {
        status: false
      }
    };

    this.goalsService.updateGoalStatus(this.goalData.id, goalStatus).subscribe({
      next: (response) => {
        this.goalData = response.data.object_info;
        // console.log(this.departmentData);

      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }
  confirmActivate() {
    this.activateOpen = false;
    const goalStatus = {
      request_data: {
        status: true
      }
    };

    this.goalsService.updateGoalStatus(this.goalData.id, goalStatus).subscribe({
      next: (response) => {
        this.goalData = response.data.object_info;
        // console.log(this.departmentData);
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

}
