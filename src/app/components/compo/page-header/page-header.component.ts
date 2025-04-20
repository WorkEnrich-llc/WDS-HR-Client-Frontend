import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, ContentChild, Input, TemplateRef, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PageHeaderComponent implements OnInit {
  @Input() breadcrumbs: { label: string; link?: string }[] = [];
  @Input() title: string = '';
  @Input() create!: string;
  @Input() update!: string;
  ngOnInit(): void {

  }

}
