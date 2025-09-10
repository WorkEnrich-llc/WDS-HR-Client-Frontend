
export interface PayrollComponent {
   id?: string;
   code: string;
   name: string;
   component_type: number;
   classification: number;
   portion: number;
   calculation: number;
   show_in_payslip: boolean;
   created_at?: string;
   updated_at?: string;
   is_active: boolean;

}


