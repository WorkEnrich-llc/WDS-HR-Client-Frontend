import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [CommonModule,RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input() breadcrumbs: { label: string; link?: string }[] = [];
  @Input() title: string = '';
}
