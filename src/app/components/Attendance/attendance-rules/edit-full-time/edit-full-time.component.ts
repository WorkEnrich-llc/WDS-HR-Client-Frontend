import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-full-time',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, FormsModule],
  templateUrl: './edit-full-time.component.html',
  styleUrls: ['./../../../shared/table/table.component.css','./edit-full-time.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EditFullTimeComponent {

  constructor(
    private router: Router
  ) {}
// step 1
  allowGrace: boolean = false;
// step 2
 latenessEntries = [{ value: null }];

addLatenessRow() {
  this.latenessEntries.push({ value: null });
}

removeLatenessRow(index: number) {
  if (this.latenessEntries.length > 1) {
    this.latenessEntries.splice(index, 1);
  }
}

  // step 3
  earlyLeaveRows = [{ deduction: null }];

  addRow() {
    this.earlyLeaveRows.push({ deduction: null });
  }

  removeRow(index: number) {
    if (this.earlyLeaveRows.length > 1) {
      this.earlyLeaveRows.splice(index, 1);
    }
  }
// step 4
absenceEntries = [{ value: null }];

addAbsenceRow() {
  this.absenceEntries.push({ value: null });
}

removeAbsenceRow(index: number) {
  if (this.absenceEntries.length > 1) {
    this.absenceEntries.splice(index, 1);
  }
}
  getOccurrenceLabel(index: number): string {
    const number = index + 1;
    if (number === 1) return '1st time';
    if (number === 2) return '2nd time';
    if (number === 3) return '3rd time';
    return `${number}th time`;
  }

  // steps navigation
  currentStep = 1;

  goNext() {
    this.currentStep++;

  }

  goPrev() {
    this.currentStep--;
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
    this.router.navigate(['/attendance']);
  }
}
