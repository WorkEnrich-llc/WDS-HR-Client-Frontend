import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { GoalsService } from 'app/core/services/od/goals/goals.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-edit-goal',
  imports: [PageHeaderComponent, CommonModule, PopupComponent,ReactiveFormsModule],
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
  ) {


    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
    // console.log(this.todayFormatted); 
  }



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

      this.goalForm.patchValue({
        code: this.goalData?.code ?? '',
        name: this.goalData?.name ?? '',
        department_type: this.goalData?.goal_type?.id ?? '',
        Priority: this.goalData?.priority ?? ''
      });

      this.goalForm.markAsPristine();

      // console.log("Goal Data:", this.goalData);

      this.loadData = false;
      },
      error: (err) => {
        console.log(err.error?.details);
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
