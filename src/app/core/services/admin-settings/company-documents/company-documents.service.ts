import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompanyDocumentsService {
    private http = inject(HttpClient);
    private apiBaseUrl = environment.apiBaseUrl;

    /**
     * Get company documents list
     */
    getCompanyDocuments(): Observable<any> {
        return this.http.get(`${this.apiBaseUrl}main/admin-settings/company-documents`);
    }

    /**
     * Get company document by ID
     */
    getCompanyDocumentById(id: number): Observable<any> {
        return this.http.get(`${this.apiBaseUrl}main/admin-settings/company-documents/${id}/`);
    }

    /**
     * Update company document (upload file)
     */
    updateCompanyDocument(companyDocumentId: number, fileName: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('company_document_id', companyDocumentId.toString());
        formData.append('file_name', fileName);
        formData.append('file', file);
        
        return this.http.put(`${this.apiBaseUrl}main/admin-settings/company-documents`, formData);
    }

    /**
     * Delete company document
     */
    deleteCompanyDocument(id: number): Observable<any> {
        return this.http.delete(`${this.apiBaseUrl}main/admin-settings/company-documents/${id}/`);
    }

    /**
     * Create company document
     */
    createCompanyDocument(fileName: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file_name', fileName);
        formData.append('file', file);
        
        return this.http.post(`${this.apiBaseUrl}main/admin-settings/company-documents`, formData);
    }
}

