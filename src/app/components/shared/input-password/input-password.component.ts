import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input-password',
  imports: [],
  templateUrl: './input-password.component.html',
  styleUrl: './input-password.component.css'
})
export class InputPasswordComponent {

  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() id!: string;

  isVisible = false;

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

}
