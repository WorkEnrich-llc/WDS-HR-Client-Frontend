import { Directive, HostListener, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appTimeDisplay]'
})
export class AppTimeDisplayDirective implements OnInit {
  constructor(private el: ElementRef<HTMLInputElement>) { }

  ngOnInit(): void {
    // If there's an initial value in 24-hour format like "14:30", format it to 12-hour for display.
    const val = this.el.nativeElement.value;
    if (val && this.is24HourFormat(val)) {
      this.el.nativeElement.value = this.to12Hour(val);
    }
  }

  @HostListener('focusin')
  onFocusIn() {
    // Ensure the input value is in 24-hour format when switching to a time picker so the picker shows the correct time.
    const current = this.el.nativeElement.value;
    if (current) {
      // If current is 12-hour (e.g., "2:30 PM"), convert to 24-hour before switching to type=time
      if (this.is12HourFormat(current)) {
        const as24 = this.to24Hour(current);
        if (as24) {
          this.el.nativeElement.value = as24;
          this.dispatchInput();
        }
      }
    }

    this.el.nativeElement.type = 'time';
    this.el.nativeElement.showPicker?.();
  }

  @HostListener('blur')
  onBlur() {
    const val = this.el.nativeElement.value;
    if (!val) {
      this.el.nativeElement.type = 'text';
      return;
    }

    // If value is in 24-hour format, convert it to 12-hour display after blur
    if (this.is24HourFormat(val)) {
      const as12 = this.to12Hour(val);
      if (as12) {
        this.el.nativeElement.type = 'text';
        this.el.nativeElement.value = as12;
        this.dispatchInput();
      }
    }
  }

  private dispatchInput(): void {
    const ev = new Event('input', { bubbles: true });
    this.el.nativeElement.dispatchEvent(ev);
  }

  private is24HourFormat(value: string): boolean {
    // matches HH:mm (00:00 - 23:59)
    return /^([01]?\d|2[0-3]):[0-5]\d$/.test(value.trim());
  }

  private is12HourFormat(value: string): boolean {
    // matches h:mm AM/PM or hh:mm am/pm
    return /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM|am|pm)$/.test(value.trim());
  }

  private to12Hour(value24: string): string {
    const parts = value24.split(':');
    if (parts.length !== 2) return value24;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  private to24Hour(value12: string): string | null {
    const m = value12.trim().match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/);
    if (!m) return null;
    let hour = parseInt(m[1], 10);
    const minute = m[2];
    const ampm = m[3].toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    const hh = hour < 10 ? `0${hour}` : `${hour}`;
    return `${hh}:${minute}`;
  }
}
