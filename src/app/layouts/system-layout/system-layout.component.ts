import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/shared/sidebar/sidebar.component';
import { BodyComponent } from '../../components/shared/body/body.component';
interface SideNavToggle{
  screenWidth:number;
  collapsed:boolean;
}
@Component({
  selector: 'app-system-layout',
  imports: [SidebarComponent,BodyComponent],
  templateUrl: './system-layout.component.html',
  styleUrl: './system-layout.component.css'
})
export class SystemLayoutComponent {

  // handle responsive between sidenav and body components
  isSideNavCollapsed=false;
  screenWidth=0;

  onToggleSideNav(data:SideNavToggle):void{
    this.screenWidth =data.screenWidth;
    this.isSideNavCollapsed=data.collapsed;
  }
}
