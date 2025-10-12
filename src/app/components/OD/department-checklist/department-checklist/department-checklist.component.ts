import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { DepartmentChecklistService } from 'app/core/services/od/departmentChecklist/department-checklist.service';
interface CheckItem {
  name: string;
  completed: boolean;
}
@Component({
  selector: 'app-department-checklist',
  imports: [PageHeaderComponent,RouterLink,PopupComponent,SkelatonLoadingComponent],
  templateUrl: './department-checklist.component.html',
  styleUrl: './department-checklist.component.css',
  encapsulation:ViewEncapsulation.None
})
export class DepartmentChecklistComponent {

 checks: CheckItem[] = [];
  checkForm: FormGroup;
  constructor(
    private router: Router, 
    private fb: FormBuilder, 
    private departmentChecklistService: DepartmentChecklistService) {
    this.checkForm = this.fb.group({
      checkName: ['', Validators.required]
    });
  }
  loadData:boolean=false;
  ngOnInit() {

    this.getDepartmetCheck();
  }

  getDepartmetCheck() {
    this.loadData=true;
  this.departmentChecklistService.getDepartmetChecks().subscribe({
    next: (response) => {
      const list = response.data.list_items || [];

      const sortedList = list.sort((a: any, b: any) => a.ranking - b.ranking);

      // console.log(sortedList);

      this.checks = sortedList.map((item: any) => ({
        name: item.name,  
        completed: false,
        editing: false
      }));
      this.loadData=false;
    },
    error: (err) => {
      console.log(err.error?.details);
      this.loadData=false;
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

    const deptStatus = {
      request_data: {
        status: false
      }
    };


  }

  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }
  confirmActivate() {
    this.activateOpen = false;
    const deptStatus = {
      request_data: {
        status: true
      }
    };


  }
}
