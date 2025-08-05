import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-permission',
  imports: [PageHeaderComponent,RouterLink],
  templateUrl: './permission.component.html',
  styleUrl: './permission.component.css'
})
export class PermissionComponent {

}
