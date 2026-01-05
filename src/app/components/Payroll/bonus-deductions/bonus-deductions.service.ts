import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})

export class BonusDeductionsService {
    constructor(private http: HttpClient) { }

    getBonusDeductions(page: number = 1, itemsPerPage: number = 10): Observable<any> {
        const url = environment.apiBaseUrl + 'payroll/bonus-deductions';
        const params = { page: page.toString(), itemsPerPage: itemsPerPage.toString() };
        return this.http.get<any>(url, { params });
    }

    getBonusDeductionById(id: string | number): Observable<any> {
        const url = `${environment.apiBaseUrl}payroll/bonus-deductions/${id}/`;
        return this.http.get<any>(url);
    }

    createBonusDeduction(data: any): Observable<any> {
        const url = environment.apiBaseUrl + 'payroll/bonus-deductions/';
        return this.http.post<any>(url, data);
    }

    updateBonusDeduction(id: string | number, data: any): Observable<any> {
        const url = `${environment.apiBaseUrl}payroll/bonus-deductions/${id}/`;
        return this.http.put<any>(url, data);
    }

    deleteBonusDeduction(id: string | number): Observable<any> {
        const url = `${environment.apiBaseUrl}payroll/bonus-deductions/${id}/`;
        return this.http.delete<any>(url);
    }
}
