import { UserStatus } from "@app/enums";

export interface IUser {
   id: number;
   email: string;
   code: string;
   name: string;
   created_at?: string;
   updated_at?: string;
   status?: UserStatus;
   // permissions: string[];
   permissions: { id: number; name: string }[];
};

export interface IUserApi {
   id: number;
   user: { name: string; email: string; code: string };
   is_active: boolean;
   status: string;
   permissions: IPermission[];
   created_at: string;
   updated_at: string;
}

export interface IUserResponse {
   data: {
      list_items: {
         id: number;
         user: {
            name: string;
            email: string;
            code: string;
         };
         is_active: boolean;
         status: string;
         created_at: string;
         updated_at: string;
         permissions: any[];
      }[];
      page: number;
      total_items: number;
      total_pages: number;
   };
}



export interface IRole {
   id: number;
   name: string;
}

export interface IMain {
   id: number;
   code: number;
   name: string;
}

export interface ISubAction {
   name: string;
   count: number;
   usage: { active: number; inactive: number };
   status: boolean;
   infinity: boolean;
}

export interface ISubList {
   sub: { id: number; code: number; name: string };
   is_support: boolean;
   allowed_actions: ISubAction[];
   error: string;
}

export interface IPermission {
   role: IRole;
   main: IMain;
   is_support: boolean;
   sub_list: ISubList[];
}