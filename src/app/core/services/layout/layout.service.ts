import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  /**
   * Screen width signal to handle responsive logic globally.
   */
  readonly screenWidth = signal(window.innerWidth);

  /**
   * Sidebar state signal.
   * 
   * True: Expanded (Large, shows text labels).
   * False: Narrow/Icons-only (Medium/Tablet) OR Hidden/Drawer (Mobile).
   */
  readonly isSidebarCollapsed = signal(this.getDefaultSidebarState(window.innerWidth));

  /**
   * Helper signal for mobile detection. below 768px.
   */
  readonly isMobile = computed(() => this.screenWidth() <= 768);

  /**
   * Helper signal for tablet detection. 768px to 1024px.
   */
  readonly isTablet = computed(() => {
    const w = this.screenWidth();
    return w > 768 && w <= 1024;
  });

  constructor() {
    // Shared window resize coordinator
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const prevWidth = this.screenWidth();
      this.screenWidth.set(width);

      // Handle automatic state transitions when passing through breakpoints
      if (width > 1200 && prevWidth <= 1200) {
        this.isSidebarCollapsed.set(true); // Auto-expand on large screens
      } else if (width <= 1200 && width > 768 && (prevWidth > 1200 || prevWidth <= 768)) {
        this.isSidebarCollapsed.set(false); // Auto-collapse to icons-only on tablets
      } else if (width <= 768 && prevWidth > 768) {
        this.isSidebarCollapsed.set(false); // Hide on mobile transition
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(state => !state);
  }

  closeSidebar(): void {
    this.isSidebarCollapsed.set(false);
  }

  openSidebar(): void {
    this.isSidebarCollapsed.set(true);
  }

  private getDefaultSidebarState(width: number): boolean {
    // Only expand by default on full desktop screens
    return width > 1200;
  }
}
