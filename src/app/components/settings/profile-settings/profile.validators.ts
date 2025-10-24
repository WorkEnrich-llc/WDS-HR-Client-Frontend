import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';



export function fourPartsValidator(): ValidatorFn {
   return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
         return null;
      }
      const parts = control.value.trim().split(/\s+/).filter((p: string | any[]) => p.length > 0);
      const arabicCharPattern = /[\u0621-\u064A]/;
      const englishOnlyPattern = /^[a-zA-Z]+$/;
      const numbersPattern = /^[0-9]+$/;
      for (const part of parts) {
         if (arabicCharPattern.test(part)) {
            return { containsArabic: true };
         }
         if (numbersPattern.test(part)) {
            return { numbersPattern: true };
         }
         if (!englishOnlyPattern.test(part)) {
            return { containsSpecialChars: true };
         }

      }

      if (parts.some((w: string) => w.length < 2)) {
         return { wordTooShort: true };
      }
      if (parts.length < 4) {
         return { fourParts: true };
      }
      return null;
   };
}



export function arabicNameValidator(): ValidatorFn {
   return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
         return null;
      }

      const parts = control.value.trim().split(/\s+/).filter((p: string | any[]) => p.length > 0);

      const englishCharPattern = /[a-zA-Z]/;
      const arabicOnlyPattern = /^[\u0621-\u064A]+$/;
      const numbersPattern = /^[0-9]+$/;

      for (const part of parts) {
         if (englishCharPattern.test(part)) {
            return { containsEnglish: true };
         }
         if (numbersPattern.test(part)) {
            return { numbersPattern: true };
         }
         if (!arabicOnlyPattern.test(part)) {
            return { containsSpecialChars: true };
         }
      }
      if (parts.some((part: string) => part.length < 2)) {
         return { wordTooShort: true };
      }
      if (parts.length < 4) {
         return { fourParts: true };
      }
      return null;
   };
}