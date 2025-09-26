
import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appTimeInput]'
})
export class TimeInputDirective {
  constructor(private el: ElementRef<HTMLInputElement>) { }

  @HostListener('focusin')
  onFocusIn() {
    this.el.nativeElement.type = 'time';
    this.el.nativeElement.showPicker?.();
  }

  @HostListener('blur')
  onBlur() {
    if (!this.el.nativeElement.value) {
      this.el.nativeElement.type = 'text';
    }
  }
}