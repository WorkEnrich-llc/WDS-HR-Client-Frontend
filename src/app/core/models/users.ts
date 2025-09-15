export interface CreateUser {
   id?: number;
   email: string;
   code: string;
   name: string;
   permissions: number[];
};
