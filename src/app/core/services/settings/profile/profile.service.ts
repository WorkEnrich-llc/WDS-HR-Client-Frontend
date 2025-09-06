import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Profile } from 'app/core/models/profile';
import { environment } from 'environments/environment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}main/profile`;
  constructor() { }

  getProfile() {
    return this.http.get<Profile>(`${this.url}`).pipe(
      map((res: any) => res.data?.object_info ?? null)
    );
  }


  updateProfile(profileData: FormData) {
    return this.http.put<any>(`${this.url}`, profileData).pipe(
      map((res: any) => res.data?.object_info ?? null)
    );
  }

}
