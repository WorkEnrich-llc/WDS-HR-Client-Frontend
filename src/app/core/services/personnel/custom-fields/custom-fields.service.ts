import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateFieldRequest, CustomField, CustomFieldDetailResponse, CustomFieldFilters, CustomFieldObject, CustomFieldValuesParams, CustomFieldValuesResponse, TargetModelItem, TargetModelResponse, UpdateCustomValueRequest, UpdateFieldRequest, UpdateStatusRequest } from 'app/core/models/custom-field';
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
  private readonly valuesUrl = `${this.baseUrl}main/admin-settings/custom-field/values`;


  constructor() { }


  // create custom field
  createCustomField(data: CreateFieldRequest): Observable<CustomFieldDetailResponse> {
    return this.http.post<CustomFieldDetailResponse>(this.url, data);
  }

  // update component
  updateCustomField(data: UpdateFieldRequest): Observable<CustomFieldDetailResponse> {
    // const fieldId = data.request_data.id;
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



  // Get custom field values
  getCustomFieldValues(params: CustomFieldValuesParams, pageNumber: number,
    perPage: number): Observable<CustomFieldValuesResponse> {

    let httpParams = new HttpParams()
      .set('app_name', params.app_name)
      .set('model_name', params.model_name)
      .set('object_id', params.object_id.toString())
      .set('page', pageNumber.toString())
      .set('per_page', perPage.toString());

    return this.http.get<CustomFieldValuesResponse>(this.valuesUrl, { params: httpParams });
  }

  // Update custom field value
  updateCustomFieldValue(payload: UpdateCustomValueRequest): Observable<CustomFieldValuesResponse> {
    return this.http.put<CustomFieldValuesResponse>(this.valuesUrl, payload);
  }

  // delete custom field
  deleteCustomFieldValue(payload: UpdateFieldRequest): Observable<void> {
    const fieldId = payload.request_data.id;
    return this.http.delete<void>(`${this.url}/${fieldId}/`, { body: payload });
  }


  // get target models
  getTargetModels(): Observable<TargetModelResponse> {
    return this.http.get<TargetModelResponse>(this.modalUrl);
  }

  getTargetModelItems(): Observable<TargetModelItem[]> {
    return this.getTargetModels().pipe(map(response => response.data.list_items));
  }


}
