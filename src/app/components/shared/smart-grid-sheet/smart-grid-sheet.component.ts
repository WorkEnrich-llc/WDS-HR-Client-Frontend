import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { PopupComponent } from '../popup/popup.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface TableColumn {
  key: string;
  name: string;
  label: string;
  type: 'input' | 'select' | 'date';
  validators?: ValidatorFn[];
  options?: { value: any; label: string }[];
  errorMessage?: string;
  reliability?: string;
  rawData?: any[];
}

@Component({
  selector: 'app-smart-grid-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopupComponent],
  templateUrl: './smart-grid-sheet.component.html',
  styleUrl: './smart-grid-sheet.component.css'
})
export class SmartGridSheetComponent {
  @Input() columns: TableColumn[] = [];
  @Input() initialRows: any[] = [];
  @Input() rowsInput: any[] = [];

  @Output() inputChanged = new EventEmitter<void>();

  @Output() rowsChange = new EventEmitter<any[]>();

  rows = signal<FormGroup[]>([]);

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
  if (changes['columns'] && this.columns.length && this.rows().length === 0) {
    for (let i = 0; i < 20; i++) {
      this.addRow();
    }
  }

  if (changes['rowsInput']) {
    this.rows.update(() => []);
    const rowsLength = this.rowsInput?.length || 0;

    for (const row of this.rowsInput || []) {
      this.addRow(row);
    }

    const remaining = 20 - rowsLength;
    for (let i = 0; i < remaining; i++) {
      this.addRow();
    }
  }
}

  addRow(initialData: any = {}) {
    const group: any = {};
    for (const col of this.columns) {
      const control = new FormControl(
        initialData[col.name] ?? '',
        col.validators || []
      );

      control.valueChanges
        .pipe(
          debounceTime(3000),
          distinctUntilChanged()
        )
        .subscribe(() => {
          this.emitUpdatedRows();
        });

      group[col.name] = control;
    }

    const formGroup = this.fb.group(group);

    for (const col of this.columns) {
      if (col.reliability) {
        const parentControl = formGroup.get(col.reliability);
        const colIndex = this.columns.findIndex(c => c.name === col.name);
        if (colIndex !== -1) {
          this.columns[colIndex] = { ...this.columns[colIndex], options: [] };
        }

        if (parentControl) {
          parentControl.valueChanges.subscribe(parentValue => {
            const filteredOptions = (col.rawData || []).filter(item => {
              const parentField = item[col.reliability!];
              return Array.isArray(parentField)
                ? parentField.some((b: any) => +b.id === +parentValue)
                : +parentField === +parentValue;
            });

            const newOptions = filteredOptions.map(opt => ({
              value: opt.id,
              label: opt.name
            }));

            const colIndex = this.columns.findIndex(c => c.name === col.name);
            if (colIndex !== -1) {
              this.columns[colIndex] = {
                ...this.columns[colIndex],
                options: [...newOptions]
              };
            }

            formGroup.get(col.name)?.setValue('', { emitEvent: false });
            this.cdr.detectChanges();
          });
        }
      }
    }

    this.rows.update(r => [...r, formGroup]);
  }


  onCellValueChanged(rowIndex: number, columnKey: string, value: any) {
    const rowForm = this.rows()[rowIndex];
    if (rowForm?.controls[columnKey]) {
      rowForm.get(columnKey)?.setValue(value);
      this.rowsChange.emit(this.rows().map(form => form.getRawValue()));
    }
  }

  emitUpdatedRows() {
    this.rowsChange.emit(this.rows().map(row => row.getRawValue()));
  }

  handleFocus(rowIndex: number, colName: string) {
    if (rowIndex === this.rows().length - 1) {
      this.addRow();
    }
  }

isCellInvalid(form: FormGroup, col: TableColumn): boolean {
  const ctrl = form.get(col.name);
  return ctrl instanceof FormControl && ctrl.invalid && !!ctrl.value;
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

  ErrorPopup: boolean = false;
  errorPopupMessage: string = '';

  showErrorPopup(form: FormGroup, col: TableColumn) {
    const control = form.get(col.name);
    if (control?.errors) {
      if (control.errors['required']) {
        this.errorPopupMessage = col.errorMessage || 'This field is required';
      } else if (control.errors['email']) {
        this.errorPopupMessage = 'Please enter a valid email address';
      } else if (control.errors['pattern']) {
        this.errorPopupMessage = 'Invalid format numbers only';
      } else {
        this.errorPopupMessage = 'Invalid input';
      }

      this.ErrorPopup = true;
    }
  }

  closeErrorPOP() {
    this.ErrorPopup = false;
    this.errorPopupMessage = '';
  }
}
