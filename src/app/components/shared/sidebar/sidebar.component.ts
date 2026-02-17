import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';

import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { OverlayFilterBoxComponent } from '../overlay-filter-box/overlay-filter-box.component';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { NotificationsService } from 'app/core/services/admin-settings/notifications/notifications.service';
import { filter } from 'rxjs/operators';

interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

interface RouteAccordionMapping {
  [accordionId: string]: string[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, OverlayFilterBoxComponent, NgClass],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentRoute: string = '';

  // Map route patterns to accordion IDs
  private routeAccordionMap: RouteAccordionMapping = {
    'collapseOne': ['departments', 'branches', 'jobs', 'organizational-Chart', 'goals', 'dept-check'],
    'collapseTwo': ['personnel-calender', 'employees', 'workflow', 'requests', 'onboarding', 'documents', 'contracts', 'insurance', 'delegation'],
    'collapseThree': ['attendance', 'attendance-rules', 'restricted-days', 'schedule', 'leave-types', 'permissions-control', 'permissions', 'leave-balance', 'summary-report'],
    'collapseFour': ['calendar', 'job-openings', 'archived-openings', 'job-board-setup'],
    'collapseFive': ['payroll-components', 'payroll-runs', 'salary-portions', 'taxes'],
    'collapseSix': ['cloud', 'roles', 'users', 'integrations', 'announcements', 'company-policy', 'company-documents', 'email-settings', 'custom-field']
  };

  constructor(
    private router: Router,
    public subService: SubscriptionService,
    private notificationsService: NotificationsService
  ) { }

  @Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();

  // start notification popup
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;

  isNotificationOpen = false;
  hasNewNotifications = true;
  notifications: any[] = [];
  isLoadingNotifications = false;

  // get logo from local storage
  logo: string | null = null;
  companyName: string | null = null;

  ngOnInit(): void {
    // Load logo from local storage
    this.loadLogoFromLocalStorage();

    // Listen to storage changes
    window.addEventListener('storage', this.onLocalStorageChange.bind(this));

    // supscription all feature supported 
    this.subService.allFeatures$.subscribe(features => {
      if (features && Object.keys(features).length > 0) {
        this.features = features;
      }
    });

    // Set initial route
    this.currentRoute = this.router.url;

    // Listen to route changes using NavigationEnd event
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects;
      this.openActiveAccordion();
    });

    // open responsive
    this.screenWidth = window.innerWidth;
    if (this.screenWidth <= 768) {
      this.collapsed = false;
    } else if (this.screenWidth > 768) {
      this.collapsed = true;
    }
  }

  ngOnDestroy(): void {
    // Remove event listener when component is destroyed
    window.removeEventListener('storage', this.onLocalStorageChange.bind(this));
  }

  /**
   * Load logo from local storage
   */
  private loadLogoFromLocalStorage(): void {
    try {
      const companyInfo = localStorage.getItem('company_info');
      if (companyInfo) {
        const parsedCompanyInfo = JSON.parse(companyInfo);
        this.logo = parsedCompanyInfo?.logo || null;
        this.companyName = parsedCompanyInfo?.name || null;
      }
    } catch (error) {
      console.error('Error loading logo from local storage:', error);
      this.logo = null;
      this.companyName = null;
    }
  }

  /**
   * Handle storage changes from other tabs/windows
   */
  private onLocalStorageChange(event: StorageEvent): void {
    if (event.key === 'company_info' || event.key === null) {
      this.loadLogoFromLocalStorage();
    }
  }


  handleNotificationClick() {
    this.closeAllAccordions();

    if (this.isNotificationOpen) {
      this.overlay.closeOverlay();
    } else {
      this.overlay.openOverlay();
      this.isNotificationOpen = true;
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.isLoadingNotifications = true;
    this.notificationsService.getNotifications().subscribe({
      next: (response) => {
        // Extract notifications from response.data.object_info.list_items
        this.notifications = response?.data?.object_info?.list_items || [];
        this.isLoadingNotifications = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.notifications = [];
        this.isLoadingNotifications = false;
      }
    });
  }

  /**
   * Parse ISO-like timestamps into a local Date using the numeric components.
   * Handles strings with or without timezone offset. If parsing fails, returns null.
   *
   * Examples handled:
   * - 2026-01-31T12:29:01.580243
   * - 2026-01-31T12:29:01.580Z
   * - 2026-01-31T12:29:01+02:00
   */
  private parseIsoToLocal(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    try {
      const s = String(dateString).trim();
      // If string has no timezone, treat as UTC (common API format)
      const toParse = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : s.replace(/\.(\d+)$/, (_, frac) => '.' + frac.slice(0, 3)) + 'Z';
      const d = new Date(toParse);
      if (!isNaN(d.getTime())) return d;
      return null;
    } catch (e) {
      return null;
    }
  }

  getTimeAgo(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    const date = this.parseIsoToLocal(dateString);
    if (!date) return 'N/A';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'Just now';
    if (diffInSeconds < 60) return 'Just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  // end notification popup




  collapsed = true;
  screenWidth = 0;
  showText = false;
  features: any = {};
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;

    if (this.screenWidth <= 768) {
      this.collapsed = false;
    } else {
      this.collapsed = true;
    }

    this.onToggleSideNav.emit({
      collapsed: this.collapsed,
      screenWidth: this.screenWidth,
    });
  }
  // close accourdions opens when click one out accourdion 
  @ViewChild('accordionWrapper') accordionWrapper!: ElementRef;

  closeAllAccordions(): void {
    const accordions = this.accordionWrapper.nativeElement.querySelectorAll('.accordion-collapse.show');

    accordions.forEach((el: HTMLElement) => {
      el.classList.remove('show'); // Bootstrap collapse class
    });

    const buttons = this.accordionWrapper.nativeElement.querySelectorAll('.accordion-button');
    buttons.forEach((btn: HTMLElement) => {
      btn.classList.add('collapsed');
      btn.setAttribute('aria-expanded', 'false');
    });
  }
  // screen responsive in start page
  ngAfterViewInit(): void {
    // Open active accordion after view is initialized
    this.openActiveAccordion();

    // Setup notification overlay
    this.overlay.onClose.subscribe(() => {
      this.isNotificationOpen = false;
    });
  }

  /**
   * Open accordion that contains the active route
   */
  private openActiveAccordion(): void {
    if (!this.accordionWrapper) {
      return;
    }

    // Find which accordion should be open based on current route
    const targetAccordionId = this.getAccordionIdForRoute(this.currentRoute);

    if (targetAccordionId) {
      // Close all accordions first
      this.closeAllAccordions();

      // Open the target accordion
      const accordionElement = this.accordionWrapper.nativeElement.querySelector(`#${targetAccordionId}`);
      const buttonElement = this.accordionWrapper.nativeElement.querySelector(`[data-bs-target="#${targetAccordionId}"]`);

      if (accordionElement && buttonElement) {
        accordionElement.classList.add('show');
        buttonElement.classList.remove('collapsed');
        buttonElement.setAttribute('aria-expanded', 'true');
      }
    }
  }

  /**
   * Get accordion ID based on current route
   */
  private getAccordionIdForRoute(route: string): string | null {
    for (const [accordionId, routePatterns] of Object.entries(this.routeAccordionMap)) {
      if (routePatterns.some(pattern => route.includes(pattern))) {
        return accordionId;
      }
    }
    return null;
  }
  // toggle sidenav, hidden texts in small side and small pages
  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.onToggleSideNav.emit({ collapsed: this.collapsed, screenWidth: this.screenWidth });

    if (!this.collapsed) {

      setTimeout(() => {
        this.showText = true;
      }, 300);
    } else {

      this.showText = false;
    }
  }
  // close sidenav 
  closeSidenav(): void {
    this.collapsed = false;
    this.onToggleSideNav.emit({ collapsed: this.collapsed, screenWidth: this.screenWidth });


    setTimeout(() => {
      this.showText = true;
    }, 300);
  }
}
