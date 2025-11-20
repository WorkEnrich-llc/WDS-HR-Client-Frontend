import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class DateRangeValidators {

   static futureDateRange(minDate: string = new Date().toISOString().split('T')[0]): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
         const dateRange = control.value;

         if (!dateRange || !dateRange.startDate) {
            return null;
         }

         const selectedStartDate = dateRange.startDate.toDate ? dateRange.startDate.toDate() : new Date(dateRange.startDate);
         const min = new Date(minDate);

         selectedStartDate.setHours(0, 0, 0, 0);
         min.setHours(0, 0, 0, 0);

         if (selectedStartDate < min) {
            return { pastDateRange: true };
         }

         return null;
      };
   }
}