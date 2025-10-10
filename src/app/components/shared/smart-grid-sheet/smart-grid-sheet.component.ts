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

  isCopyPasteActive = false;

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
  @HostListener('document:keydown', ['$event'])
  handleKeyDownGlobal(event: KeyboardEvent) {
    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      this.onCopy(event);
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'v') {
      this.onPaste(event as unknown as ClipboardEvent);
    }
  }


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
    // console.log('addRow rowData:', JSON.stringify(rowData, null, 2));
    const formGroup = this.fb.group({});
    const rowIndex = this.rows().length;
    this.rowOptions[rowIndex] = {};

    const hasAnyValue = Object.values(rowData).some(v => v !== null && v !== '');

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

      if (hasAnyValue) {
        formGroup.get(col.name)?.markAsTouched({ onlySelf: true });
      }
    }

    if (rowData.__errors) {
      // console.log(`Backend errors for row ${rowIndex}:`, rowData.__errors);

      setTimeout(() => {
        Promise.resolve().then(() => {
          this.applyBackendErrors(rowIndex, rowData.__errors);
        });
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
          .subscribe(parentValue => {
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
    return (
      ctrl instanceof FormControl &&
      ctrl.invalid &&
      (!!ctrl.value || ctrl.dirty)
    );
  }


  getFormControl(form: FormGroup, col: TableColumn): FormControl {
    return form.get(col.name) as FormControl;
  }


  private copyArea: HTMLTextAreaElement | null = null;

  async onCopy(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.selectedCells || this.selectedCells.length === 0) return;

    const rowsMap: { [row: number]: { [col: string]: string } } = {};
    this.selectedCells.forEach(cell => {
      if (!rowsMap[cell.row]) rowsMap[cell.row] = {};
      const value = this.rows()[cell.row]?.get(cell.col)?.value ?? '';
      rowsMap[cell.row][cell.col] = value;
    });

    const rowIndices = [...new Set(this.selectedCells.map(c => c.row))].sort((a, b) => a - b);
    const colIndices = [...new Set(this.selectedCells.map(c => this.columns.findIndex(cc => cc.name === c.col)!))].sort((a, b) => a - b);

    const copiedText = rowIndices
      .map(r =>
        colIndices.map(cIndex => {
          const colName = this.columns[cIndex].name;
          return rowsMap[r][colName] ?? '';
        }).join('\t')
      )
      .join('\n');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copiedText);
        this.showCopyToast('✅ Copied');
      } else {
        if (!this.copyArea) {
          this.copyArea = document.createElement('textarea');
          this.copyArea.style.position = 'fixed';
          this.copyArea.style.left = '-9999px';
          this.copyArea.style.opacity = '0';
          document.body.appendChild(this.copyArea);
        }

        this.copyArea.value = copiedText;
        document.body.appendChild(this.copyArea);
        this.copyArea.focus();
        this.copyArea.select();

        const success = document.execCommand('copy');
        if (success) {
          this.showCopyToast('✅ Copied');
        } else {
          throw new Error('Copy failed');
        }

        this.copyArea.blur();
        window.getSelection()?.removeAllRanges();
      }
    } catch (err) {
      console.error('Copy error:', err);
      this.showCopyToast('⚠️ Copy failed');
    }

    this.selectedCells = [];
    this.cdr.detectChanges();
  }


  private showCopyToast(message: string) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = '#3f9870';
    toast.style.color = 'white';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    toast.style.zIndex = '9999';
    toast.style.fontSize = '16px';
    toast.style.fontWeight = '600';
    toast.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 1000);
  }

  onPaste(event: ClipboardEvent) {
    if (this.selectedCells.length === 0) return;

    this.isCopyPasteActive = true;
    setTimeout(() => this.isCopyPasteActive = false, 100);

    const startCell = this.selectedCells[0];
    this.paste(event, startCell.row, startCell.col);
  }


  paste(event: ClipboardEvent, startRow: number, startColName: string) {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData('text/plain');
    if (!clipboardData) return;

    const parsedRows = clipboardData.trim().split(/\r?\n/);

    const selectedCols = [...new Set(this.selectedCells.map(c => c.col))];
    if (selectedCols.length === 1) {
      const colName = selectedCols[0];
      const startIndex = Math.min(...this.selectedCells.map(c => c.row));

      parsedRows.forEach((value, i) => {
        const targetRowIndex = startIndex + i;
        while (targetRowIndex >= this.rows().length) {
          this.addRow();
        }
        this.rows()[targetRowIndex].get(colName)?.setValue(value.trim());
      });

      this.emitUpdatedRows();
      return;
    }

    const parsedCells = parsedRows.map(row => row.split('\t'));
    const startColIndex = this.columns.findIndex(c => c.name === startColName);

    parsedCells.forEach((cells, rIndex) => {
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

    this.emitUpdatedRows();
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

    if (target.closest('option')) {
      return;
    }

    if (target.closest('svg') || target.closest('.tooltip-popup-danger')) {
      return;
    }

    if (target.tagName === 'SELECT') {
      this.isSelecting = false;
      return;
    }

    if (event.buttons === 1) {
      this.isSelecting = true;
      this.hasMoved = false;
      this.startRow = rowIndex;
      this.startCol = this.columns.findIndex(c => c.name === colName);
    }

    if (target.tagName === 'INPUT' || target.isContentEditable) {
      this.isSelecting = false;
      return;
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

    // 🧩 أضف هذا الجزء هنا
    const active = document.activeElement as HTMLElement | null;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.isContentEditable)) {
      active.blur(); // إزالة الفوكس من أي حقل
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
  @HostListener('document:keydown.backspace', ['$event'])
  clearSelectedCells(event: KeyboardEvent) {
    const active = document.activeElement as HTMLElement | null;

    const focusedIsInput =
      !!active &&
      (
        active.tagName === 'INPUT' ||
        active.tagName === 'SELECT' ||
        active.tagName === 'TEXTAREA' ||
        (active as HTMLElement).isContentEditable
      );

    let focusedCellRow: number | null = null;
    let focusedCellCol: string | null = null;

    if (active && (active as any).closest) {
      const td = (active as HTMLElement).closest('td[data-row][data-col]') as HTMLElement | null;
      if (td) {
        const dr = td.getAttribute('data-row');
        const dc = td.getAttribute('data-col');
        focusedCellRow = dr !== null ? Number(dr) : null;
        focusedCellCol = dc;
      }
    }

    if (this.selectedCells.length === 0) return;

    if (
      this.selectedCells.length === 1 &&
      focusedIsInput &&
      focusedCellRow === this.selectedCells[0].row &&
      focusedCellCol === this.selectedCells[0].col
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.selectedCells.forEach(cell => {
      const control = this.rows()[cell.row].get(cell.col);
      if (control) {
        control.setValue('');
        control.markAsPristine();
        control.markAsUntouched();
        control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      }
    });


    this.emitUpdatedRows();
    this.selectedCells = [];
    this.ErrorPopup = false;
    this.errorPopupMessage = '';

    try {
      (active as HTMLElement | null)?.blur();
    } catch {

    }
  }


  // =================== move with arrows ===================
  
 handleKeyDown(event: KeyboardEvent, rowIndex: number, colIndex: number) {
  const target = event.target as HTMLElement;

  const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

  switch (event.key) {
    case 'ArrowUp':
      if (!isEditable && rowIndex > 0) {
        this.focusCell(rowIndex - 1, colIndex);
        event.preventDefault();
      }
      break;

    case 'ArrowDown':
      if (!isEditable && rowIndex < this.rows().length - 1) {
        this.focusCell(rowIndex + 1, colIndex);
        event.preventDefault();
      }
      break;

    case 'ArrowLeft':
      if (!isEditable && colIndex > 0) {
        this.focusCell(rowIndex, colIndex - 1);
        event.preventDefault();
      }
      break;

    case 'ArrowRight':
      if (!isEditable && colIndex < this.columns.length - 1) {
        this.focusCell(rowIndex, colIndex + 1);
        event.preventDefault();
      }
      break;
  }
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
  applyBackendErrors(rowIndex: number, errors: { [key: string]: string }): void {
    // console.log(`applyBackendErrors called for row ${rowIndex} with errors:`, JSON.stringify(errors, null, 2));
    const formGroup = this.rows()[rowIndex];
    if (!formGroup) {
      // console.warn(`No formGroup found for row ${rowIndex}`);
      return;
    }

    const keyMap: { [key: string]: string } = {
      'validate_contract_dates': 'start_contract',
    };

    Object.entries(errors).forEach(([originalColName, errMsg]) => {
      const colName = keyMap[originalColName] || originalColName;
      const control = formGroup.get(colName);
      if (!control) {
        // console.warn(`No control found for column ${colName} in row ${rowIndex}`);
        return;
      }

      const existingErrors = control.errors || {};
      control.setErrors({ ...existingErrors, backend: errMsg }, { emitEvent: false });


      control.markAsTouched({ onlySelf: true });
      // control.updateValueAndValidity({ emitEvent: false });
    });

    this.cdr.detectChanges();
  }


  showErrorPopup(form: FormGroup, col: TableColumn) {
    const control = form.get(col.name);
    if (!control?.errors) return;

    const errors = control.errors;
    if (errors['backend']) {
      this.errorPopupMessage = errors['backend'];
    } else if (errors['required']) {
      this.errorPopupMessage = col.errorMessage || 'This field is required';
    } else if (errors['email']) {
      this.errorPopupMessage = 'Please enter a valid email address';
    } else if (errors['pattern']) {
      this.errorPopupMessage = col.errorMessage || 'Invalid format numbers only';
    } else {
      this.errorPopupMessage = 'Invalid input';
    }

    this.ErrorPopup = true;
  }

  onFieldChange(form: FormGroup, colName: string): void {
    const control = form.get(colName);
    if (!control) return;

    if (control.errors?.['backend']) {
      const { backend, ...rest } = control.errors;
      control.setErrors(Object.keys(rest).length ? rest : null);
    }
  }


  closeErrorPOP() {
    this.ErrorPopup = false;
    this.errorPopupMessage = '';
  }


  // tooltip error
  activeTooltip: { rowIndex: number; colKey: string } | null = null;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (this.isSelecting || this.selectedCells.length > 1) return;

    if (!target.closest('.tooltip-popup-danger') && !target.closest('svg')) {
      this.activeTooltip = null;
    }
  }

  toggleTooltip(event: MouseEvent, rowIndex: number, colKey: string) {
    // event.preventDefault();

    const form = this.rows()[rowIndex];
    const col = this.columns.find(c => c.name === colKey);
    if (!form || !col) return;

    const errorMessage = this.getErrorMessage(form, col);
    if (!errorMessage) {
      this.activeTooltip = null;
      return;
    }

    if (this.activeTooltip && this.activeTooltip.rowIndex === rowIndex && this.activeTooltip.colKey === colKey) {
      this.activeTooltip = null;
    } else {
      this.activeTooltip = { rowIndex, colKey };
    }
  }

  getErrorMessage(form: FormGroup, col: TableColumn): string {
    const ctrl = form.get(col.name);
    if (!ctrl) return '';

    // backend error
    const backendError = ctrl.errors?.['backend'];
    if (backendError && typeof backendError === 'string') return backendError;

    // validator error
    if (ctrl.invalid && (!!ctrl.value || ctrl.touched || ctrl.dirty)) {
      return col.errorMessage || '';
    }

    return '';
  }



}