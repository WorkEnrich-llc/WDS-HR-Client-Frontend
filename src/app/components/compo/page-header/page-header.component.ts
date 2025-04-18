import { CommonModule } from '@angular/common';
import { Component, ContentChild, ElementRef, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input() breadcrumbs: { label: string; link?: string }[] = [];
  @Input() title: string = '';
  @ContentChild('subinfo', { static: false }) subinfoContent!: ElementRef;

  hasSubinfo: boolean = false;

  ngAfterContentInit() {
    this.hasSubinfo = this.subinfoContent?.nativeElement?.innerHTML.trim().length > 0;
  }
}
