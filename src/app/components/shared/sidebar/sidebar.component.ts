import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, RouterLink, RouterLinkActive, OverlayFilterBoxComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  currentRoute: string = '';

  // Map route patterns to accordion IDs
  private routeAccordionMap: RouteAccordionMapping = {
    'collapseOne': ['departments', 'branches', 'jobs', 'organizational-Chart', 'goals', 'dept-check'],
    'collapseTwo': ['personnel-calender', 'employees', 'workflow', 'requests', 'onboarding', 'documents', 'contracts', 'insurance', 'delegation'],
    'collapseThree': ['attendance', 'attendance-rules', 'restricted-days', 'schedule', 'leave-types', 'permissions-control', 'permissions', 'leave-balance'],
    'collapseFour': ['calendar', 'job-openings', 'archived-openings', 'job-board-setup'],
    'collapseFive': ['payroll-components', 'payroll-runs', 'salary-portions'],
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
  companyInfo = localStorage.getItem('company_info');
  parsedCompanyInfo = this.companyInfo ? JSON.parse(this.companyInfo) : null;
  logo = this.parsedCompanyInfo ? this.parsedCompanyInfo.logo : null;
  companyName = this.parsedCompanyInfo ? this.parsedCompanyInfo.name : null;


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

  getTimeAgo(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
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
  ngOnInit(): void {
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
