import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { OverlayFilterBoxComponent } from '../overlay-filter-box/overlay-filter-box.component';

interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, OverlayFilterBoxComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  currentRoute: string = '';
  constructor(private router: Router) { }



  @Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();

  // start notification popup
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;

  isNotificationOpen = false;
hasNewNotifications = true;

  handleNotificationClick() {
    this.closeAllAccordions();

    if (this.isNotificationOpen) {
      this.overlay.closeOverlay();
    } else {
      this.overlay.openOverlay();
      this.isNotificationOpen = true;
    }
  }

  ngAfterViewInit() {
    this.overlay.onClose.subscribe(() => {
      this.isNotificationOpen = false;
    });
  }
  // end notification popup




  collapsed = true;
  screenWidth = 0;
  showText = false;

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
    // route contain to active icon 
    this.currentRoute = this.router.url;
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
    // open responsive
    this.screenWidth = window.innerWidth;
    if (this.screenWidth <= 768) {
      this.collapsed = false;
    } else if (this.screenWidth > 768) {
      this.collapsed = true;
    }
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
