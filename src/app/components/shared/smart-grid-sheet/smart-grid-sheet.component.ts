import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
export interface TableColumn {
  name: string;
  type: 'input' | 'select';
  options?: string[];
  validators?: ValidatorFn[];
}
@Component({
  selector: 'app-smart-grid-sheet',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './smart-grid-sheet.component.html',
  styleUrl: './smart-grid-sheet.component.css'
})


export class SmartGridSheetComponent {
  @Input() columns: TableColumn[] = [];
  rows = signal<FormGroup[]>([]);

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    for (let i = 0; i < 50; i++) {
      this.addRow();
    }
  }

  addRow() {
    const group: any = {};
    for (const col of this.columns) {
      group[col.name] = new FormControl('', col.validators || []);
    }
    this.rows.update(r => [...r, this.fb.group(group)]);
  }

  isCellInvalid(form: FormGroup, col: TableColumn): boolean {
    const ctrl = form.get(col.name);
    return ctrl instanceof FormControl && ctrl.touched && ctrl.invalid;
  }

  getFormControl(form: FormGroup, col: TableColumn): FormControl {
    return form.get(col.name) as FormControl;
  }

  paste(event: ClipboardEvent, startRow: number, startColName: string) {
    event.preventDefault();
    const startColIndex = this.columns.findIndex(c => c.name === startColName);
    const clipboardData = event.clipboardData?.getData('text/plain');
    if (!clipboardData) return;

    const parsedRows = clipboardData.trim().split(/\r?\n/).map(row => row.split('\t'));

    parsedRows.forEach((cells, rIndex) => {
      const targetRowIndex = startRow + rIndex;

      while (targetRowIndex >= this.rows().length) {
        this.addRow();
      }

      const targetRow = this.rows()[targetRowIndex];

      cells.forEach((cellValue, cIndex) => {
        const targetColIndex = startColIndex + cIndex;
        const targetCol = this.columns[targetColIndex];

        if (targetCol) {
          targetRow.get(targetCol.name)?.setValue(cellValue.trim());
        }
      });
    });
  }

}
