import { AbstractControl, ValidationErrors, FormArray } from '@angular/forms';

export function atLeastOnePortionFilled(control: AbstractControl): ValidationErrors | null {
   const formArray = control as FormArray;

   const hasData = formArray.controls.some(group => {
      const enabled = group.get('enabled')?.value;
      const portion = group.get('portion')?.value.trim();
      const percentage = group.get('percentage')?.value.trim();
      const validPercentage = percentage !== null && percentage !== '' && !isNaN(percentage);

      return enabled && portion && validPercentage;
   });

   return hasData ? null : { noPortion: true };
}


export function totalPercentageValidator(control: AbstractControl): ValidationErrors | null {
   const formArray = control as FormArray;

   const total = formArray.controls
      .filter(group => group.get('enabled')?.value)
      .reduce((sum, group) => sum + (Number(group.get('percentage')?.value) || 0), 0);

   return total >= 100 ? { totalIs100: true } : null;
}