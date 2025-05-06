import { Component, ViewEncapsulation } from '@angular/core';
import { SidebarComponent } from '../../components/shared/sidebar/sidebar.component';
import { BodyComponent } from '../../components/shared/body/body.component';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PopupComponent } from '../../components/shared/popup/popup.component';
interface SideNavToggle{
  screenWidth:number;
  collapsed:boolean;
}
@Component({
  selector: 'app-settings',
  imports: [SidebarComponent,BodyComponent,PageHeaderComponent,RouterLink,RouterLinkActive,PopupComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent {
// handle responsive between sidenav and body components
isSideNavCollapsed=false;
screenWidth=0;

onToggleSideNav(data:SideNavToggle):void{
  this.screenWidth =data.screenWidth;
  this.isSideNavCollapsed=data.collapsed;
}


isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    // logic to logout
  }
}
