import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { PopupComponent } from '../popup/popup.component';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

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
  rowOptions: { [rowIndex: number]: { [colName: string]: { value: any; label: string }[] } } = {};

  private destroy$ = new Subject<void>();
  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) { }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns'] && this.columns.length && this.rows().length === 0 && !this.rowsInput?.length) {
      for (let i = 0; i < 30; i++) {
        this.addRow();
      }
    }

    if (changes['rowsInput'] && this.rowsInput) {
      this.rows.update(() => []);

      const rowsLength = this.rowsInput.length;

      for (const row of this.rowsInput) {
        this.addRow(row);
      }

      const remaining = 30 - rowsLength;
      for (let i = 0; i < remaining; i++) {
        this.addRow();
      }

      setTimeout(() => {
        this.rows().forEach((formGroup, rowIndex) => {
          this.columns.forEach(col => {
            if (col.reliability && formGroup.get(col.reliability)?.value) {
              const parentValue = formGroup.get(col.reliability)?.value;

              const filteredOptions = (col.rawData || []).filter(item => {
                const parentField = item[col.reliability!];
                return Array.isArray(parentField)
                  ? parentField.some((b: any) => +b.id === +parentValue)
                  : +parentField === +parentValue;
              });

              this.rowOptions[rowIndex][col.name] = filteredOptions.map(opt => ({
                value: opt.id,
                label: opt.name
              }));

              const currentValue = formGroup.get(col.name)?.value;
              const existsInList = this.rowOptions[rowIndex][col.name].some(o => +o.value === +currentValue);
              if (!existsInList) {
                formGroup.get(col.name)?.setValue('', { emitEvent: false });
              }
            }
          });
        });

        this.cdr.detectChanges();
      });
    }
  }


  addRow(rowData: any = {}): void {
    const formGroup = this.fb.group({});
    const rowIndex = this.rows().length;

    this.rowOptions[rowIndex] = {};

    for (const col of this.columns) {
      // formGroup.addControl(col.name, new FormControl(rowData[col.name] || ''));
      formGroup.addControl(col.name, new FormControl(rowData[col.name] || '', col.validators || []));

        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.emitUpdatedRows());

      if (col.type === 'select') {

      if (col.reliability) {
        this.rowOptions[rowIndex][col.name] = [];
      } else {
        this.rowOptions[rowIndex][col.name] = col.options ? [...col.options] : [];
      }
    }

    for (const col of this.columns) {
      if (col.reliability) {
        const parentControl = formGroup.get(col.reliability);
        const updateOptions = (parentValue: any, initialLoad = false) => {
          if (!parentValue) {
            this.rowOptions[rowIndex][col.name] = [];
            formGroup.get(col.name)?.setValue('', { emitEvent: false });
            this.cdr.detectChanges();
            return;
          }
          const filteredOptions = (col.rawData || []).filter(item => {
            const parentField = item[col.reliability!];
            return Array.isArray(parentField)
              ? parentField.some((b: any) => +b.id === +parentValue)
              : +parentField === +parentValue;
          });

          this.rowOptions[rowIndex][col.name] = filteredOptions.map(opt => ({
            value: opt.id,
            label: opt.name
          }));
          if (this.rowOptions[rowIndex][col.name].length === 0) {
            this.rowOptions[rowIndex][col.name] = [];
            formGroup.get(col.name)?.setValue('', { emitEvent: false });
          }

          const currentValue = formGroup.get(col.name)?.value;
          const existsInList = this.rowOptions[rowIndex][col.name].some(o => +o.value === +currentValue);

          if (!existsInList) {
            formGroup.get(col.name)?.setValue('', { emitEvent: false });
          }

          this.cdr.detectChanges();
        };


        parentControl?.valueChanges.subscribe(value => updateOptions(value, false));

        if (initialData[col.reliability]) {
          updateOptions(initialData[col.reliability], true);
      }
    }

    this.rows.update(rows => [...rows, formGroup]);
  }

  private updateChildOptions(rowIndex: number, childCol: TableColumn, parentValue: any) {
    const filteredOptions = (childCol.rawData || []).filter((item: any) => {
      const parentField = item[childCol.reliability!];
      return Array.isArray(parentField)
        ? parentField.some((p: any) => +p.id === +parentValue)
        : +parentField === +parentValue;
    });

    this.rowOptions[rowIndex][childCol.name] = filteredOptions.map((opt: any) => ({
      value: opt.id,
      label: opt.name
    }));
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

  // delete and selection handling
  selectedCells = new Set<string>();
  isMouseDown = false;
  ignoreNextClick = false;
  startCell: { row: number; col: number } | null = null;

  ngOnInit() {
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('click', this.onDocumentClick.bind(this));

  }

  ngOnDestroy() {
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }





  onCellMouseDown(event: MouseEvent, row: number, col: number) {
    this.isMouseDown = true;
    this.ignoreNextClick = true;
    this.clearSelection();
    this.startCell = { row, col };
    this.selectCell(row, col);

    const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
      const input = cell.querySelector('input, select') as HTMLElement | null;
      if (input) {
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    }

    event.preventDefault();
  }

  onCellMouseOver(event: MouseEvent, row: number, col: number) {
    if (!this.isMouseDown || !this.startCell) return;

    this.clearSelection();

    const startRow = Math.min(this.startCell.row, row);
    const endRow = Math.max(this.startCell.row, row);
    const startCol = Math.min(this.startCell.col, col);
    const endCol = Math.max(this.startCell.col, col);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        this.selectCell(r, c);
      }
    }
  }

  onMouseUp() {
    this.isMouseDown = false;
    this.startCell = null;
    setTimeout(() => this.ignoreNextClick = false, 0);
  }


  selectCell(row: number, col: number) {
    const key = `${row}-${col}`;
    if (!this.selectedCells.has(key)) {
      this.selectedCells.add(key);
      const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
      if (cell) cell.classList.add('selected');
    }
  }

  clearSelection() {
    this.selectedCells.forEach(key => {
      const [row, col] = key.split('-').map(Number);
      const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
      if (cell) cell.classList.remove('selected');
    });
    this.selectedCells.clear();
  }

  onKeyDown(event: KeyboardEvent) {
    const ctrl = event.ctrlKey || event.metaKey;

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();


      this.selectedCells.forEach(key => {
        const [row, col] = key.split('-').map(Number);
        const formGroup = this.rows()[row];
        const colName = this.columns[col].name;

        const control = formGroup?.get(colName);
        if (control) {
          control.setValue(null);
          control.markAsDirty();
          control.markAsTouched();
        }
      });
    }
  }




  onDocumentClick(event: MouseEvent) {
    if (this.ignoreNextClick) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!target.closest('td[data-row][data-col]')) {
      this.clearSelection();
    }
  }



  //move with arrows
  onArrowKey(event: KeyboardEvent, rowIndex: number, colIndex: number) {
    this.clearSelection();  // تلغي التحديد عند بداية التنقل

    const rows = document.querySelectorAll('.table-row');
    const currentRow = rows[rowIndex] as HTMLElement;
    if (!currentRow) return;

    let targetInput: HTMLElement | null = null;

    switch (event.key) {
      case 'ArrowUp':
        if (rowIndex > 0) {
          const prevRow = rows[rowIndex - 1];
          targetInput = prevRow.querySelectorAll('input, select')[colIndex] as HTMLElement;
        }
        break;
      case 'ArrowDown':
        if (rowIndex < rows.length - 1) {
          const nextRow = rows[rowIndex + 1];
          targetInput = nextRow.querySelectorAll('input, select')[colIndex] as HTMLElement;
        }
        break;
      case 'ArrowLeft':
        if (colIndex > 0) {
          targetInput = currentRow.querySelectorAll('input, select')[colIndex - 1] as HTMLElement;
        } else {
          (event.target as HTMLElement).blur();
        }
        break;
      case 'ArrowRight':
        const inputs = currentRow.querySelectorAll('input, select');
        if (colIndex < inputs.length - 1) {
          targetInput = inputs[colIndex + 1] as HTMLElement;
        }
        break;
    }

    if (targetInput) {
      targetInput.focus();
      event.preventDefault();
    }
  }



  // Error handling for form validation
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
