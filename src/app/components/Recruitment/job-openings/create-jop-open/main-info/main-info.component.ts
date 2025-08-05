import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-main-info',
   standalone: true,
  imports: [CommonModule,RouterLink, FormsModule],
  providers:[DatePipe],
  templateUrl: './main-info.component.html',
  styleUrl: './main-info.component.css'
})
export class MainInfoComponent {
selectedWorkMode: string = '';

isHybridOrOnsite(): boolean {
  return this.selectedWorkMode === 'onsite' || this.selectedWorkMode === 'hypred';
}
}
