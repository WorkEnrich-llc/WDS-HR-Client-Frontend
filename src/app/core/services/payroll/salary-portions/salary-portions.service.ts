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
    data: { portions: { enabled: boolean; name: string; percentage: number }[] }
  ): Observable<any> {
    const requestData = {
      request_data: {
        settings: data.portions
          .filter((p: any) => p.enabled)
          .map((p: any) => ({
            name: p.name,
            percentage: Number(p.percentage)
          }))
      }
    };
    return this.http.put<any>(`${this.url}`, requestData);
  }



  single() {
    return this.http.get<SalaryPortion>(`${this.url}`).pipe(
      map((res: any) => res.data?.object_info ?? null)
    );
  }



}
