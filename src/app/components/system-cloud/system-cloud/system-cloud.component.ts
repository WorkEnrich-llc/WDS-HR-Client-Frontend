import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../../shared/popup/popup.component';

@Component({
  selector: 'app-system-cloud',
  imports: [PageHeaderComponent,CommonModule,PopupComponent],
  templateUrl: './system-cloud.component.html',
  styleUrl: './system-cloud.component.css',
  encapsulation:ViewEncapsulation.None
})
export class SystemCloudComponent {
  isExpanded=true;
  toggleCollapse(){
    this.isExpanded=!this.isExpanded;
  }

    selectedView: 'grid' | 'list' = 'grid';

  setView(view: 'grid' | 'list') {
    this.selectedView = view;
  }

    // upload file
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // send it here
    }
  }

    createFolderPop = false;

  openModal() {
    this.createFolderPop = true;
  }

  closeModal() {
    this.createFolderPop = false;
  }
}
