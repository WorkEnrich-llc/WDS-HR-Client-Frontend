import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoalsService {

  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // create goal
  createGoal(goalData: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/goals`;
    return this._HttpClient.post(url, goalData);
  }

  // get all Goals with pagination and filters
  getAllGoals(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
    }
  ): Observable<any> {
    const url = `${this.apiBaseUrl}od/goals`;

    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
    }

    return this._HttpClient.get(url, { params });
  }

  // show Goal by ID
  showGoal(id: number): Observable<any> {
    const url = `${this.apiBaseUrl}od/goals/${id}`;
    return this._HttpClient.get(url);
  }

  // update Goal
  updateGoal(goalData: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/Goals`;
    return this._HttpClient.put(url, goalData);
  }

  // update goal status
  updateGoalStatus(id: number, status: any): Observable<any> {
    const url = `${this.apiBaseUrl}od/goals/${id}/`;
    return this._HttpClient.patch(url, status);
  }
}
