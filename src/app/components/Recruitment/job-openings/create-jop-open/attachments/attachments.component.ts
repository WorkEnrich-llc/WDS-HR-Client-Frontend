import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-attachments',
  imports: [RouterLink,FormsModule,CommonModule],
  templateUrl: './attachments.component.html',
  styleUrls: ['./../../../../shared/table/table.component.css','./attachments.component.css']
})
export class AttachmentsComponent {
 links = [{ value: null }];
 Documents = [{ value: null }];

addLink() {
  this.links.push({ value: null });
}

removeLink(index: number) {
  if (this.links.length > 1) {
    this.links.splice(index, 1);
  }
}
addDocument() {
  this.Documents.push({ value: null });
}

removeDocument(index: number) {
  if (this.Documents.length > 1) {
    this.Documents.splice(index, 1);
  }
}

}
