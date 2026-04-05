import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/shared/sidebar/sidebar.component';
import { BodyComponent } from '../../components/shared/body/body.component';
import { SystemSetupTourComponent } from '../../components/shared/system-setup-tour/system-setup-tour.component';

@Component({
  selector: 'app-system-layout',
  imports: [SidebarComponent, BodyComponent, SystemSetupTourComponent],
  templateUrl: './system-layout.component.html',
  styleUrl: './system-layout.component.css',
  standalone: true
})
export class SystemLayoutComponent {}
