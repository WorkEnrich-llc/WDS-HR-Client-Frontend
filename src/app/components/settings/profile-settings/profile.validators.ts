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
      if (parts.length !== 4) {
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