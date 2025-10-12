import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skelaton-loading',
  imports: [CommonModule],
  templateUrl: './skelaton-loading.component.html',
  styleUrl: './skelaton-loading.component.css'
})
export class SkelatonLoadingComponent {
   @Input() labelHeight: number = 14;
  @Input() valueHeight: number = 20;
  @Input() rows: number = 3;
  @Input() hasLabel: boolean = false;
}
