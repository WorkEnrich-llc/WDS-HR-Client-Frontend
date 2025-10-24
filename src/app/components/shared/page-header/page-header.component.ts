
import { AfterContentInit, Component, ContentChild, Input, TemplateRef, OnInit, ViewEncapsulation, ContentChildren, ElementRef, QueryList } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkelatonLoadingComponent } from '../skelaton-loading/skelaton-loading.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink, SkelatonLoadingComponent ,CommonModule],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PageHeaderComponent {

 @Input() breadcrumbs: { label: string; link?: string }[] = [];
  @Input() title: string = '';
  @Input() create?: string;
  @Input() update?: string;
  @Input() isApplied?: boolean;
  @Input() isLoading: boolean = false;

  @ContentChildren('actions', { read: ElementRef }) actionButtons!: QueryList<ElementRef>;

  hasActions = false;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.hasActions = this.actionButtons && this.actionButtons.length > 0;
    });
  }
}
