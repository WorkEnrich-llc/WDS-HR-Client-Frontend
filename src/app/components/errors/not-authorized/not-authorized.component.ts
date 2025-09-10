import { Component, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-authorized',
  imports: [],
  templateUrl: './not-authorized.component.html',
  styleUrl: './not-authorized.component.css',
  encapsulation:ViewEncapsulation.None
})
export class NotAuthorizedComponent {
 constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }
}
