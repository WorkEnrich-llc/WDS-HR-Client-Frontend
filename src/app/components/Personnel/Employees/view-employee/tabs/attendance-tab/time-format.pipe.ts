import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
  standalone: true
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || value === '-') return '-';

    let t = value as string;

    // If value contains a date-time (ISO), extract time portion
    if (t.includes('T')) t = t.split('T')[1];
    // Remove fractional seconds if present
    if (t.includes('.')) t = t.split('.')[0];

    // Expect formats like '21:28:46' or '09:28:46' or '21:28'
    const parts = t.split(':');
    if (parts.length < 2) return value as string;

    const hh = parseInt(parts[0], 10);
    const mm = parts[1];

    if (isNaN(hh)) return value as string;

    const isPM = hh >= 12;
    let hour = hh % 12;
    if (hour === 0) hour = 12;
    const hourStr = hour < 10 ? '0' + hour : '' + hour;

    return `${hourStr}:${mm} ${isPM ? 'PM' : 'AM'}`;
  }
}
