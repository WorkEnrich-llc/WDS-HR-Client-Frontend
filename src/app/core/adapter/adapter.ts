import { ActionType, ApiSubModule, ModulePermission, Roles, SubModulePermission } from "../models/roles";


// transform the response from the server to the Roles interface


export function mapRoleResponse(response: any): Roles {
   const main = response?.request_data?.main;
   const createdAt = response?.request_data?.created_at;
   const updatedAt = response?.request_data?.updated_at;
   const permissions = response?.request_data?.permissions || [];

   return {
      id: response?.request_data?.id,
      code: main?.code ?? '',
      name: main?.name ?? '',
      permissions: permissions.map((p: any) => ({
         moduleCode: p.main.code,
         subModules: p.sub_list.map((sub: any) => ({
            code: sub.sub.code,
            subName: sub.sub?.name || '',
            actions: sub.allowed_actions as ActionType[]
         }))
      })),
      createdAt: createdAt,
      updatedAt: updatedAt
   };
}

// transform the Roles interface to the request format expected by the server
export function mapRoleToRequest(role: Roles): any {
   return {
      request_data: {
         ...(role.id && { id: role.id }),
         main: {
            code: role.code,
            name: role.name,
         },
         permissions: role.permissions?.map((p: ModulePermission) => ({
            main: { code: p.moduleCode },
            sub_list: p.subModules?.map((sub: SubModulePermission) => ({
               sub: { code: sub.code },
               allowed_actions: sub.actions
            }))
         }))
      }
   };
}

export function mapRoleAllResponse(item: any): Roles {
   const permissions = item?.permissions?.map((p: any) => ({
      moduleCode: p.main?.code ?? 0,
      moduleName: p.main?.name ?? '',
      subModules: (p.sub_list || [])
         .map((sub: any) => ({
            code: sub.sub?.code,
            subName: sub.sub?.name,
            // actions: (sub.allowed_actions || [])
            //    .filter((a: any) => a.status === true) 
            //    .map((a: any) => a.name),
         }))
      // .filter((sub: any) => sub.actions.length > 0),
   })) || [];

   return {
      id: item.id,
      code: item.code ?? '',
      name: item.name ?? '',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      permissions,
   };
}




