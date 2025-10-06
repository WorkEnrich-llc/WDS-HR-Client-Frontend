import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appCloseDropdown]',
  standalone: true
})
export class CloseDropdownDirective {

  @Output() appCloseDropdown = new EventEmitter<void>();

  constructor(private el: ElementRef) { }

  @HostListener('document:click', ['$event.target'])
  public onClick(target: HTMLElement) {
    const clickedInside = this.el.nativeElement.contains(target);
    if (!clickedInside) {
      this.appCloseDropdown.emit();
    }
  }

}
