import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { mapRoleAllResponse, mapRoleResponse, mapRoleToRequest } from 'app/core/adapter/adapter';
import { ActionType, Roles, UpdateRoleRequest } from 'app/core/models/roles';
import { environment } from 'environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminRolesService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}main/admin-settings/roles`;


  constructor() { }

  createRole(role: Roles): Observable<Roles> {
    const requestBody = mapRoleToRequest(role);
    return this.http.post<any>(this.url, requestBody).pipe(
      map(response => mapRoleResponse(response))
    );
  }


  getAllRoles(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      status?: string;
      role_id?: number;
      activeModules?: string;
      activeServices?: string;
    }
  ): Observable<{
    // data?: any;
    roles: Roles[];
    page: number;
    total_items: number;
    total_pages: number;
  }> {
    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.role_id != null) params = params.set('role_id', filters.role_id.toString());
      if (filters.activeModules) {
        params = params.set('active_module', filters.activeModules);
      }
      if (filters.activeServices) {
        params = params.set('active_service', filters.activeServices);
      }
    }

    return this.http.get<any>(this.url, { params }).pipe(
      map((response: any) => {
        const items = response?.data?.list_items || [];
        const roles: Roles[] = items.map((item: any) => ({
          id: item.id,
          code: item.code ?? '',
          name: item.name ?? '',
          status: item.is_active ? 'Active' : 'Inactive',
          permissions: (item.permissions || []).map((p: any) => ({
            moduleCode: p.main?.code ?? '',
            moduleName: p.main?.name ?? '',
            subModules: (p.sub_list || []).map((sub: any) => ({
              code: sub.sub?.code ?? '',
              subName: sub.sub?.name || '',
              activeActions: (sub.allowed_actions || []),
              actions: (sub.allowed_actions || []).map((a: any) =>
                typeof a === 'string' ? a : a?.name ?? ''
              )
            }))
          }))
        }));

        return {
          roles,
          page: response.data.page,
          total_items: response.data.total_items,
          total_pages: response.data.total_pages
        };
      })
    );
  }



  //update role

  updateRole(role: Roles): Observable<Roles> {
    const requestBody = mapRoleToRequest(role);
    return this.http.put<any>(this.url, requestBody).pipe(
      map(response => mapRoleResponse(response))
    );
  }

  // updateRole status
  updateRoleStatus(id: number, status: any): Observable<any> {
    const url = `${this.url}/${id}/`;
    return this.http.patch(url, status);
  }


  getRoleById(id: number) {
    return this.http.get<any>(`${this.url}/${id}`).pipe(
      map((res: any) => {
        const item = res.data?.object_info;
        if (!item) return null;
        return {
          id: item.id,
          code: item.code ?? '',
          name: item.name ?? '',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          permissions: (item.permissions || []).map((p: any) => ({
            moduleCode: p.main?.code,
            subModules: (p.sub_list || []).map((sub: any) => ({
              code: sub.sub?.code,
              subName: sub.sub?.name ?? '',
              actions: (sub.allowed_actions || [])
                .filter((a: any) => a.status) // active only
                .map((a: any) => a.name as ActionType)
            }))
          }))
        } as Roles;
      })
    );
  }

  // Get all Roles
  // getAllRoles(): Observable<Roles[]> {
  //   return this.http.get<any>(this.url).pipe(
  //     map(response => {
  //       const roles = response.data?.list_info || [];
  //       return roles.map((role: any) => mapRoleResponse(role));
  //     })
  //   );
  // }

  // getAllRoles(): Observable<any> {
  //   return this.http.get<any>(`${this.allRolesUrl}`);
  // }
}
