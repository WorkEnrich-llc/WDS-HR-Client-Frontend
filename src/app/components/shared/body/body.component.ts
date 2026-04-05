import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from 'app/core/services/layout/layout.service';

@Component({
  selector: 'app-body',
  imports: [RouterOutlet, NgClass],
  standalone: true,
  templateUrl: './body.component.html',
  styleUrl: './body.component.css'
})
export class BodyComponent {
  private layoutService = inject(LayoutService);

  // Link properties to the centralized layout service signals
  readonly collapsed = this.layoutService.isSidebarCollapsed;
  readonly screenWidth = this.layoutService.screenWidth;

  /**
   * Responsive CSS class calculation based on sidebar state and current viewport.
   */
  getBodyClass(): string {
    let styleClass = '';
    const width = this.screenWidth();
    const isCollapsed = this.collapsed();

    // Desktop: sidebar is large (isSidebarCollapsed = true)
    if (isCollapsed && width > 768) {
      styleClass = 'body-trimmed';
    } 
    // Small screens or narrow mode: sidebar is icons-only or hidden
    else if (!isCollapsed && width > 0) {
      styleClass = 'body-md-screen';
    }

    return styleClass;
  }
}
