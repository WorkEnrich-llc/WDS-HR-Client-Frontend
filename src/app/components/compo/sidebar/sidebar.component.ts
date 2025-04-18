import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  currentRoute: string = '';
  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  @Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();
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

// screen responsive in start page
  ngOnInit(): void {
   console.log(this.currentRoute)
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
