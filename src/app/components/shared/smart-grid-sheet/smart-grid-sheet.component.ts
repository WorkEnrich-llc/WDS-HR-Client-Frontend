import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { PopupComponent } from '../popup/popup.component';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

export interface TableColumn {
  key: string;
  name: string;
  label: string;
  type: 'input' | 'select' | 'date' | 'time';
  validators?: ValidatorFn[];
  options?: { value: any; label: string }[];
  errorMessage?: string;
  reliability?: string;
  rawData?: any[];
  required?: boolean;
  editable?: boolean;
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
  @Input() fileEditable: boolean = true;

  @Output() inputChanged = new EventEmitter<void>();

  @Output() rowsChange = new EventEmitter<any[]>();
  rows = signal<FormGroup[]>([]);
  rowOptions: { [rowIndex: number]: { [colName: string]: { value: any; label: string }[] } } = {};

  private destroy$ = new Subject<void>();
  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) { }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns'] && this.columns.length && this.rows().length === 0) {
      for (let i = 0; i < 30; i++) {
        this.addRow();
      }
    }

    if (changes['rowsInput']) {
      this.rows.update(() => []);
      const rowsLength = this.rowsInput?.length || 0;

      for (const row of this.rowsInput || []) {
        this.addRow(row);
      }

      const remaining = 30 - rowsLength;
      for (let i = 0; i < remaining; i++) {
        this.addRow();
      }
    }
  }

  addRow(rowData: any = {}): void {
    const formGroup = this.fb.group({});
    const rowIndex = this.rows().length;

    this.rowOptions[rowIndex] = {};

    for (const col of this.columns) {
      const isEditable = this.fileEditable && col.editable !== false;

      formGroup.addControl(
        col.name,
        new FormControl(
          { value: rowData[col.name] || '', disabled: !isEditable },
          col.validators || []
        )
      );

      if (col.type === 'select') {
        this.rowOptions[rowIndex][col.name] = col.options ? [...col.options] : [];
      }
    }

    const hasAnyValue = Object.values(rowData).some(v => v !== null && v !== '');
    if (hasAnyValue || rowData.__forceTouched) {
      Object.keys(formGroup.controls).forEach(key => {
        formGroup.get(key)?.markAsTouched({ onlySelf: true });
      });
    }


    for (const col of this.columns) {
      if (col.reliability) {
        const parentControl = formGroup.get(col.reliability);

        if (rowData[col.reliability]) {
          this.updateChildOptions(rowIndex, col, rowData[col.reliability]);
        }

        parentControl?.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((parentValue) => {
            this.updateChildOptions(rowIndex, col, parentValue);
            formGroup.get(col.name)?.setValue('', { emitEvent: false });
            this.cdr.detectChanges();
          });
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
    return ctrl instanceof FormControl && ctrl.invalid && (!!ctrl.value || ctrl.touched || ctrl.dirty);
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

  // =============== select and delete ctrl + z and select one cell with double click ===============

  selectedCells: { row: number; col: string }[] = [];
  isSelecting = false;
  hasMoved = false;
  startRow: number | null = null;
  startCol: number | null = null;
  isDoubleClick = false;

  startSelection(rowIndex: number, colName: string, event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.isContentEditable) {
      this.isSelecting = false;
      this.startRow = rowIndex;
      this.startCol = this.columns.findIndex(c => c.name === colName);

      if (!this.isDoubleClick) {
        (target as HTMLInputElement | HTMLSelectElement).focus();

        this.selectedCells = [];
      }
      return;
    }

    if (event.buttons === 1) {
      this.isSelecting = true;
      this.hasMoved = false;
      this.startRow = rowIndex;
      this.startCol = this.columns.findIndex(c => c.name === colName);
    }
  }

  continueSelection(rowIndex: number, colName: string, event: MouseEvent) {
    if (!this.isSelecting && this.startRow !== null && this.startCol !== null) {
      this.isSelecting = true;
    }
    if (this.isSelecting && event.buttons === 1) {
      this.hasMoved = true;
      this.updateSelection(rowIndex, colName);
    }
  }


  stopSelection() {
    if ((this.hasMoved || this.isDoubleClick) && this.startRow !== null && this.startCol !== null) {
      if (!this.hasMoved) {
        this.selectedCells = [{
          row: this.startRow,
          col: this.columns[this.startCol].name
        }];
      }
    } else {
      this.selectedCells = [];
    }

    this.isSelecting = false;
    this.hasMoved = false;
    this.startRow = null;
    this.startCol = null;
    this.isDoubleClick = false;
  }

  onCellDoubleClick(rowIndex: number, colName: string, event: MouseEvent) {
    event.preventDefault();
    this.isDoubleClick = true;
    this.startRow = rowIndex;
    this.startCol = this.columns.findIndex(c => c.name === colName);
    this.stopSelection();
  }

  updateSelection(rowIndex: number, colName: string) {
    if (this.startRow === null || this.startCol === null) return;

    const endRow = rowIndex;
    const endCol = this.columns.findIndex(c => c.name === colName);

    const rowMin = Math.min(this.startRow, endRow);
    const rowMax = Math.max(this.startRow, endRow);
    const colMin = Math.min(this.startCol, endCol);
    const colMax = Math.max(this.startCol, endCol);

    this.selectedCells = [];

    for (let r = rowMin; r <= rowMax; r++) {
      for (let c = colMin; c <= colMax; c++) {
        this.selectedCells.push({ row: r, col: this.columns[c].name });
      }
    }
  }

  isSelected(rowIndex: number, colName: string) {
    return this.selectedCells.some(c => c.row === rowIndex && c.col === colName);
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.stopSelection();
  }

  @HostListener('document:keydown.delete', ['$event'])
  clearSelectedCells(event: KeyboardEvent) {
    event.preventDefault();
    this.selectedCells.forEach(cell => {
      const control = this.rows()[cell.row].get(cell.col);
      if (control) {
        control.setValue('');
      }
    });
    this.selectedCells = [];
  }
  // =================== move with attows ===================
  handleKeyDown(event: KeyboardEvent, rowIndex: number, colIndex: number) {
  }

  focusCell(row: number, col: number) {
    const selector = `td[data-row="${row}"][data-col="${col}"]`;
    const tdElement = document.querySelector(selector);

    if (!tdElement) return;

    const inputOrSelect = tdElement.querySelector('input, select') as HTMLElement;
    if (inputOrSelect) {
      inputOrSelect.focus();
    }
  }

  // =================== Error Popup ===================
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
  this.errorPopupMessage = col.errorMessage || 'Invalid format numbers only';
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