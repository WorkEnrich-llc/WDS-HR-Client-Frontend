import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Marks a string as trusted HTML for use with [innerHTML].
 * Only use with app-generated content – never with user input.
 */
@Pipe({ name: 'safeHtml', standalone: true, pure: true })
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
