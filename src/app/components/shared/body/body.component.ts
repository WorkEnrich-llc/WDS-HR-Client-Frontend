import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-body',
  imports: [RouterOutlet, NgClass],
  templateUrl: './body.component.html',
  styleUrl: './body.component.css'
})
export class BodyComponent {
  @Input() collapsed = true;
  @Input() screenWidth = 0;

  // responsive with sidenav
  getBodyClass(): string {
    let styleClass = '';
    if (this.collapsed && this.screenWidth > 768) {
      styleClass = 'body-trimmed';
    } else if (!this.collapsed && this.screenWidth > 0) {
      styleClass = 'body-md-screen';
    }

    return styleClass;
  }
}
