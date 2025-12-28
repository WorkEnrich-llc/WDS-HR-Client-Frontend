
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.css'
})
export class PopupComponent {
  @Input() title: string = '';
  @Input() paragraph1: string = '';
  @Input() paragraph2: string = '';

  @Input() isOpen: boolean = false;

  @Output() close = new EventEmitter<void>();
}
