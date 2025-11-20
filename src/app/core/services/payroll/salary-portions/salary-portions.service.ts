import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SalaryPortion } from 'app/core/models/salary-portions';
import { environment } from 'environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SalaryPortionsService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}payroll/salary-portions`;
  datePipe: any;


  updateSalaryPortion(
    data: { default_name: string; settings: { name: string; percentage: number }[] }
  ): Observable<any> {
    const requestData = {
      request_data: {
        default_name: data.default_name,
        settings: data.settings.map((p: any) => ({
          name: p.name,
          percentage: Number(p.percentage)
        }))
      }
    };
    return this.http.put<any>(`${this.url}`, requestData);
  }



  single(params?: { request_in?: string }) {
    let url = `${this.url}`;
    if (params?.request_in) {
      url += `?request_in=${params.request_in}`;
    }
    return this.http.get<SalaryPortion>(url).pipe(
      map((res: any) => res.data?.object_info ?? null)
    );
  }



}
