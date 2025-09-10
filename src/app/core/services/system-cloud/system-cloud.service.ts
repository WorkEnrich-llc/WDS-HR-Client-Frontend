import { HttpClient, HttpEvent, HttpParams, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SystemCloudService {
    private apiBaseUrl: string;

    constructor(private _HttpClient: HttpClient) {
        this.apiBaseUrl = environment.apiBaseUrl;
    }

    // get all system templates
    getAllTemplates(): Observable<any> {
        const url = `${this.apiBaseUrl}cloud/system-templates`;
        return this._HttpClient.get(url);
    }

    // get Folder and files
    getFoldersFiles(): Observable<any> {
        const url = `${this.apiBaseUrl}cloud/files`;
        return this._HttpClient.get(url);
    }

    // create folder
    createFolder(folderData: any): Observable<any> {
        const url = `${this.apiBaseUrl}cloud/files/`;
        return this._HttpClient.post(url, folderData);
    }

    // create system File
    createSystemFile(folderData: any): Observable<any> {
        const url = `${this.apiBaseUrl}cloud/files/`;
        return this._HttpClient.post(url, folderData);
    }

    // create upload file
    createUploadFile(fileData: FormData): Observable<HttpEvent<any>> {
        const url = `${this.apiBaseUrl}cloud/files/`;

        const req = new HttpRequest('POST', url, fileData, {
            reportProgress: true
        });
        return this._HttpClient.request(req);
    }

    // delete file and folder
    deleteFile(id: string): Observable<any> {
        const url = `${this.apiBaseUrl}cloud/files/${id}/`;
        return this._HttpClient.delete(url);
    }

    // rename file
    renameFile(id: string, folderData: any): Observable<any> {
        const url = `${this.apiBaseUrl}cloud/files/${id}/`;
        //   console.log('🌐 PATCH request from service:', { url, folderData });
        return this._HttpClient.patch(url, folderData);
    }


    // get system file data 
    getSystemFileData(id: string): Observable<any> {
        const url = `${this.apiBaseUrl}cloud/system-file-data/${id}/`;
        return this._HttpClient.get(url);
    }


    // save system file
    updateSheet(id: string, fileData: any): Observable<any> {
        const url = `${this.apiBaseUrl}cloud/system-file-data/${id}/`;
        return this._HttpClient.put(url, fileData);
    }

}