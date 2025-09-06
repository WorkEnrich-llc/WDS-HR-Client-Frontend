export interface Profile {
   id?: number,
   code?: string | null;
   name: string,
   email: string,
   mobile: {
      phone_prefix: string,
      phone_number: number
   },
   department: {
      id: number,
      name: string
   }
}