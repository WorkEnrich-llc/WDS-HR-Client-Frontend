import { IUser } from "./users";

export interface RoleUser {
   id: number;
}
export interface Roles {
   id?: number;
   code: string;
   name: string;
   createdAt?: string;
   updatedAt?: string;
   permissions: ModulePermission[];
   users?: IUser[];
   total_users?: number;
}


export interface ModulePermission {
   name?: string;
   moduleCode: number;
   moduleName?: string;
   subModules: SubModulePermission[];
}

export interface SubModulePermission {
   id?: number;
   code: number;
   subName?: string;
   actions: ActionType[];
   activeActions: Action[];
}

export interface UpdateRoleRequest {
   request_data: {
      id: number;
      main: {
         code?: string;
         name?: string;
      };
      permissions?: ModulePermission[];
      users?: number[];
   };
}

export interface ApiSubModule {
   sub: { code: number; name: string };
   allowed_actions: { name: ActionType; status: boolean }[];
}

export interface Action {
   name: ActionType;
   status: boolean;
   count?: number;
   usage?: {
      active: number;
      inactive: number;
   };
   infinity?: boolean;
}

export interface IUserRole {
   id: number;
   code?: string;
   email?: string;
   name: string;
   added_date?: string;
   status?: string;
   is_active?: boolean;
   isSelected?: boolean;
}

export type ActionType = 'create' | 'update' | 'delete';