import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';
import { AuthService } from './auth';

const BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private portfolioCache$: Observable<any> | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getBorrowers(): Observable<any> {
    return this.http.get(`${BASE_URL}/borrowers`, { headers: this.headers() });
  }

  getBorrower(id: string): Observable<any> {
    return this.http.get(`${BASE_URL}/borrowers/${id}`, { headers: this.headers() });
  }

  getBorrowerAlert(id: string): Observable<any> {
    return this.http.get(`${BASE_URL}/borrowers/${id}/alert`, { headers: this.headers() });
  }

  queryBorrower(borrowerId: string, question: string): Observable<any> {
    return this.http.post(`${BASE_URL}/query`, { borrowerId, question }, { headers: this.headers() });
  }

  getPortfolioSummary(): Observable<any> {
    if (!this.portfolioCache$) {
      this.portfolioCache$ = this.http.get(`${BASE_URL}/portfolio/summary`, { headers: this.headers() }).pipe(shareReplay(1));
    }
    return this.portfolioCache$;
  }

  invalidatePortfolioCache(): void {
    this.portfolioCache$ = null;
  }
}
