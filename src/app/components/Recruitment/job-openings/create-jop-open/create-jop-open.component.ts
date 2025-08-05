import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-create-jop-open',
  imports: [PageHeaderComponent, CommonModule, RouterOutlet, PopupComponent],
  providers: [DatePipe],
  templateUrl: './create-jop-open.component.html',
  styleUrl: './create-jop-open.component.css'
})
export class CreateJopOpenComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;
  activeRoute = '';

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private route: ActivatedRoute
  ) {


    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }



  ngOnInit() {
  this.updateActiveRoute();

  this.router.events.pipe(
    filter(event => event instanceof NavigationEnd)
  ).subscribe(() => {
    this.updateActiveRoute();
  });
}

private updateActiveRoute(): void {
  const urlSegments = this.router.url.split('/');
  this.activeRoute = urlSegments[urlSegments.length - 1];
}

  isActive(path: string): boolean {
    return this.activeRoute === path;
  }

  isCompleted(path: string): boolean {
    const order = ['main-information', 'required-details', 'attachments'];
    return order.indexOf(this.activeRoute) > order.indexOf(path);
  }
getStepIconType(path: string): 'active' | 'completed' | 'upcoming' {
  if (this.isActive(path)) return 'active';
  if (this.isCompleted(path)) return 'completed';
  return 'upcoming';
}




  // discard popup
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/job-openings']);
  }
}
