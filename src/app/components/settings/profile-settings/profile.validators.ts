import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// export function fourPartsValidator(): ValidatorFn {
//    return (control: AbstractControl): ValidationErrors | null => {
//       if (!control.value) return null;
//       const parts = control.value.trim().split(/\s+/);
//       if (parts.length !== 4) {
//          return { fourParts: true };
//       }
//       const invalid: boolean = parts.some((w: string) => w.length < 3);
//       if (invalid) {
//          return { wordTooShort: true };
//       }
//       return null;
//    };
// }

export function fourPartsValidator(): ValidatorFn {
   return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const parts = control.value.trim().split(/\s+/);
      if (parts.length < 4) {
         return { fourParts: true };
      }
      if (parts.some((w: string) => w.length < 3)) {
         return { wordTooShort: true };
      }
      const specialCharPattern = /^[A-Za-z0-9]+$/;
      if (parts.some((w: string) => !specialCharPattern.test(w))) {
         return { invalidCharacters: true };
      }

      return null;
   };
}

export function arabicNameValidator(): ValidatorFn {
   return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
         return null;
      }

      const value = control.value.trim();

      const arabicPattern = /^[\u0621-\u064A\s]+$/;
      if (!arabicPattern.test(value)) {
         return { invalidCharacters: true };
      }

      const parts = value.split(/\s+/).filter((part: string | any[]) => part.length > 0);
      if (parts.length < 4) {
         return { fourParts: true };
      }

      if (parts.some((part: string) => part.length < 3)) {
         return { wordTooShort: true };
      }

      return null;
   };
}