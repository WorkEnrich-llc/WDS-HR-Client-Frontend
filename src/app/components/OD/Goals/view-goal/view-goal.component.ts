import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';

@Component({
  selector: 'app-view-goal',
  imports: [PageHeaderComponent, RouterLink, CommonModule,PopupComponent],
  templateUrl: './view-goal.component.html',
  styleUrl: './view-goal.component.css'
})
export class ViewGoalComponent {
  goalData = {
    id: 1,
    name: "Increase Sales",
    createdAt: "01/09/2025",
    updatedAt: "05/09/2025",
    goalDepartmentType: "Sales",
    priority: 4,
    status: "Assigned",
    assignedDepartments: [
      {
        id: 101,
        name: "Marketing Department"
      },
      {
        id: 102,
        name: "Sales Department"
      }
    ]
  };



  reOpenOpen = false;
  openReopen() {
    this.reOpenOpen = true;
  }

  closeReopen() {
    this.reOpenOpen = false;
  }
  confirmReopen() {
    this.reOpenOpen = false;
    


  }

}
