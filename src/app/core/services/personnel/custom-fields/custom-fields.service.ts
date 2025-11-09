import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateFieldRequest, CustomField, CustomFieldDetailResponse, CustomFieldFilters, CustomFieldObject, TargetModelItem, TargetModelResponse, UpdateFieldRequest, UpdateStatusRequest } from 'app/core/models/custom-field';
import { environment } from 'environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomFieldsService {

  http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}`;
  private readonly url = `${this.baseUrl}main/admin-settings/custom-fields`;
  private readonly modalUrl = `${this.baseUrl}main/admin-settings/custom-fields/target-models`;


  constructor() { }


  // create custom field
  createCustomField(data: CreateFieldRequest): Observable<CustomFieldDetailResponse> {
    return this.http.post<CustomFieldDetailResponse>(this.url, data);
  }

  // update component
  updateCustomField(data: UpdateFieldRequest): Observable<CustomFieldDetailResponse> {
    const fieldId = data.request_data.id;
    return this.http.put<CustomFieldDetailResponse>(`${this.url}`, data);
  }

  // get custom field by id
  getCustomFieldById(fieldId: number): Observable<CustomFieldDetailResponse> {
    return this.http.get<CustomFieldDetailResponse>(`${this.url}/${fieldId}/`);
  }
  getCustomFieldObject(fieldId: number): Observable<CustomFieldObject> {
    return this.getCustomFieldById(fieldId).pipe(
      map(response => response.data.object_info)
    );
  }

  // update status custom field
  updateCustomFieldStatus(fieldId: number, newStatus: boolean): Observable<CustomFieldDetailResponse> {
    const data: UpdateStatusRequest = {
      request_data: {
        status: newStatus
      }
    };
    return this.http.put<CustomFieldDetailResponse>(`${this.url}/${fieldId}/`, data);
  }

  // delete custom field
  deleteCustomField(fieldId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${fieldId}/`);
  }


  // Get all custom fields
  getAllCustomFields(
    pageNumber: number,
    perPage: number,
    filters?: CustomFieldFilters
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.is_active !== undefined) {
        params = params.set('is_active', filters.is_active.toString());
      }
    }

    return this.http.get(this.url, { params });
  }


  // get target models
  getTargetModels(): Observable<TargetModelResponse> {
    return this.http.get<TargetModelResponse>(this.modalUrl);
  }

  getTargetModelItems(): Observable<TargetModelItem[]> {
    return this.getTargetModels().pipe(map(response => response.data.list_items));
  }


}
