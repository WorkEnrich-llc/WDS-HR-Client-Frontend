import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';

@Component({
  selector: 'app-edit-salary-portions',
  imports: [PageHeaderComponent, CommonModule, ReactiveFormsModule, PopupComponent],
  templateUrl: './edit-salary-portions.component.html',
  styleUrls: ['./edit-salary-portions.component.css']
})
export class EditSalaryPortionsComponent implements OnInit {
  portionsForm!: FormGroup;
  isLoading = false;

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.portionsForm = this.fb.group({
      portions: this.fb.array([])
    });

    for (let i = 0; i < 3; i++) {
      this.addPortion();
    }
  }

  get portions(): FormArray {
    return this.portionsForm.get('portions') as FormArray;
  }

  addPortion(): void {
    const portionGroup = this.fb.group({
      enabled: new FormControl(false),
      portion: new FormControl({ value: '', disabled: true }),
      percentage: new FormControl({ value: '', disabled: true })
    });


    portionGroup.get('enabled')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        portionGroup.get('portion')?.enable();
        portionGroup.get('percentage')?.enable();
      } else {
        portionGroup.get('portion')?.disable();
        portionGroup.get('percentage')?.disable();
      }
    });

    this.portions.push(portionGroup);
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
    this.router.navigate(['/salary-portions']);
  }
}
