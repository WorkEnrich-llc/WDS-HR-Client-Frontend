import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appDateInput]'
})
export class DateInputDirective {
  constructor(private el: ElementRef<HTMLInputElement>) { }

  @HostListener('focusin')
  onFocusIn() {
    this.el.nativeElement.type = 'date';
    this.el.nativeElement.showPicker?.();
  }

  @HostListener('blur')
  onBlur() {
    this.el.nativeElement.type = this.el.nativeElement.value ? 'date' : 'text';
  }
}