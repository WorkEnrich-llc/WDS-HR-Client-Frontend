import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { RolesService } from 'app/core/services/roles/roles.service';

@Component({
  selector: 'app-add-role',
  imports: [PageHeaderComponent, PopupComponent, CommonModule],
  templateUrl: './add-role.component.html',
  styleUrl: './add-role.component.css'
})
export class AddRoleComponent {
  constructor(
    private router: Router,
    private rolesService:RolesService
  ) { }

  errMsg = '';
  isLoading: boolean = false;


ngOnInit():void{
  this.getAllRoles();
}
getAllRoles(){
  this.rolesService.getroles().subscribe({
      next: (response) => {
        console.log(response);
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
}


  // next and prev
  currentStep = 1;
  selectAll: boolean = false;

  goNext() {
    this.currentStep++;

  }

  goPrev() {
    this.currentStep--;
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
    this.router.navigate(['/roles']);
  }
}
