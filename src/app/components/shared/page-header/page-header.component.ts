import { Component, input, computed, contentChildren, ViewEncapsulation, ElementRef, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkelatonLoadingComponent } from '../skelaton-loading/skelaton-loading.component';
import { LayoutService } from 'app/core/services/layout/layout.service';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-header',
  imports: [RouterLink, SkelatonLoadingComponent],
  standalone: true,
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PageHeaderComponent {
  // --- Injections ---
  private layoutService = inject(LayoutService);

  // --- Signals & Inputs ---
  readonly breadcrumbs = input<BreadcrumbItem[]>([]);
  readonly title = input<string>('');
  readonly create = input<string | undefined>();
  readonly update = input<string | undefined>();
  readonly isApplied = input<boolean>(false);
  readonly isLoading = input<boolean>(false);

  // --- Events ---
  readonly toggleMenu = output<void>();

  // Content children for actions (replaces @ContentChildren QueryList)
  readonly actionButtons = contentChildren<ElementRef>('actions');

  // Computed state for better reactivity
  readonly hasActions = computed(() => this.actionButtons().length > 0);

  /**
   * Helper for menu toggle.
   * On mobile, this will toggle the sidebar visibility through the shared layout service.
   */
  onMenuToggle(): void {
    this.layoutService.toggleSidebar();
    this.toggleMenu.emit();
  }
}
