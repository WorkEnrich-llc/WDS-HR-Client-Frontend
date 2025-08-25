import { AbstractControl, ValidationErrors, FormArray } from '@angular/forms';



export function atLeastOnePortionFilled(control: AbstractControl): ValidationErrors | null {
   const formArray = control as FormArray;
   const hasData = formArray.controls.some(group => {
      const enabled = group.get('enabled')?.value;
      const name = group.get('name')?.value;
      const percentage = group.get('percentage')?.value;
      if (percentage === null || percentage === '') return false;
      const validPercentage = !isNaN(percentage);
      return enabled && name && validPercentage;
   });

   return hasData ? null : { noPortion: true };
}

export function totalPercentageValidator() {
   return (control: AbstractControl): ValidationErrors | null => {
      const formControls = control as FormArray;
      if (!formControls?.controls?.length) return null;

      const total = formControls.controls.reduce((sum, group) => {
         const isBasic =
            group.get('default')?.value === true ||
            String(group.get('name')?.value || '').toLowerCase() === 'basic';
         if (isBasic) return sum;
         if (group.get('enabled')?.value !== true) return sum;

         const raw = group.get('percentage')?.value;
         const num = raw === '' || raw === null ? 0 : Number(raw);
         return sum + (isNaN(num) ? 0 : num);
      }, 0);
      return total < 100 ? null : { totalIs100: true };
   };
}

