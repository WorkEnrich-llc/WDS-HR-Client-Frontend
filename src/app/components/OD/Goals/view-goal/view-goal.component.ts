import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { GoalsService } from 'app/core/services/od/goals/goals.service';

@Component({
  selector: 'app-view-goal',
  imports: [PageHeaderComponent, RouterLink, CommonModule, PopupComponent],
  providers: [DatePipe],
  templateUrl: './view-goal.component.html',
  styleUrl: './view-goal.component.css'
})
export class ViewGoalComponent {

  constructor(
    private goalsService: GoalsService,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) { }
  goalData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  goalId: string | null = null;
  loadData: boolean = false;


  ngOnInit(): void {
    this.goalId = this.route.snapshot.paramMap.get('id');
    // this.getDepartment(Number(this.goalId));
    if (this.goalId) {
      this.getDepartment(Number(this.goalId));
    }
  }

  getDepartment(goalId: number) {
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
  // goalData = {
  //   id: 1,
  //   name: "Increase Sales",
  //   createdAt: "01/09/2025",
  //   updatedAt: "05/09/2025",
  //   goalDepartmentType: "Sales",
  //   priority: 4,
  //   status: "Assigned",
  //   assignedDepartments: [
  //     {
  //       id: 101,
  //       name: "Marketing Department"
  //     },
  //     {
  //       id: 102,
  //       name: "Sales Department"
  //     }
  //   ]
  // };



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
