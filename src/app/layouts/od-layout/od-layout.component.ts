import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/compo/sidebar/sidebar.component';
import { BodyComponent } from '../../components/compo/body/body.component';
interface SideNavToggle{
  screenWidth:number;
  collapsed:boolean;
}
@Component({
  selector: 'app-od-layout',
  imports: [SidebarComponent,BodyComponent],  
  templateUrl: './od-layout.component.html',
  styleUrl: './od-layout.component.css'
})
export class OdLayoutComponent {

  // handle responsive between sidenav and body components
  isSideNavCollapsed=false;
  screenWidth=0;

  onToggleSideNav(data:SideNavToggle):void{
    this.screenWidth =data.screenWidth;
    this.isSideNavCollapsed=data.collapsed;
  }
}
