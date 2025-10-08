import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {

   static futureDate(minDate: string = new Date().toISOString().split('T')[0]): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
         if (!control.value) return null;

         const selected = new Date(control.value);
         const min = new Date(minDate);

         return selected < min ? { pastDate: true } : null;
      };
   }
}