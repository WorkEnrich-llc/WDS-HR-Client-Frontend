import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Employee } from 'app/core/interfaces/employee';

interface CustomField {
  label: string;
  value: string;
}

interface EditState {
  isEditing: boolean;
  editValue: string;
}

@Component({
  selector: 'app-custom-info',
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-info.component.html',
  styleUrl: './custom-info.component.css'
})
export class CustomInfoComponent implements OnInit {
  @Input() employee: Employee | null = null;
  @Output() fieldsUpdated = new EventEmitter<CustomField[]>();
  editStates: EditState[] = [];

  fields: CustomField[] = [
    { label: 'License ID', value: '12345-ABC' },
    { label: 'License Expiry Date', value: '24/5/2026' },
    { label: 'Date of Birth', value: '1/8/1992' }
  ];

  ngOnInit(): void {
    this.resetEditStates();
  }

  resetEditStates(): void {
    this.editStates = this.fields.map(field => ({
      isEditing: false,
      editValue: field.value
    }));
  }


  onEdit(i: number) {
    this.editStates[i].isEditing = true;
    setTimeout(() => {
      const input = document.querySelectorAll('.edit-input')[i] as HTMLInputElement;
      input?.focus();
    });
  }


  onRemove(index: number): void {
    this.fields.splice(index, 1);
    this.editStates.splice(index, 1);

    this.fieldsUpdated.emit(this.fields);
  }


  onConfirm(index: number): void {
    this.fields[index].value = this.editStates[index].editValue;
    this.editStates[index].isEditing = false;

    this.fieldsUpdated.emit(this.fields);

  }


  onCancel(index: number): void {
    this.editStates[index].isEditing = false;
  }

}
