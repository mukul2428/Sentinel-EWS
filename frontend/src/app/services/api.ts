import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

const BASE_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private portfolioCache$: Observable<any> | null = null;
  private borrowersCache$: Observable<any> | null = null;

  // Singleton caches — survive route navigation because the service is never destroyed
  signalCache: Record<string, { signal: string; action: string; aiGenerated: boolean }> = {};
  aiInsightCache: Record<string, any> = {};
  alertCache: Record<string, any> = {};
  private borrowerCache: Record<string, any> = {};

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getBorrowers(): Observable<any> {
    if (!this.borrowersCache$) {
      this.borrowersCache$ = this.http.get(`${BASE_URL}/borrowers`, { headers: this.headers() }).pipe(shareReplay(1));
    }
    return this.borrowersCache$;
  }

  invalidateBorrowersCache(): void {
    this.borrowersCache$ = null;
  }

  getBorrower(id: string): Observable<any> {
    if (!this.borrowerCache[id]) {
      this.borrowerCache[id] = this.http.get(`${BASE_URL}/borrowers/${id}`, { headers: this.headers() }).pipe(shareReplay(1));
    }
    return this.borrowerCache[id];
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

  generateSignal(borrowerId: string): Observable<{ signal: string; action: string; aiGenerated: boolean }> {
    return this.http.get<{ signal: string; action: string; aiGenerated: boolean }>(`${BASE_URL}/borrowers/${borrowerId}/signal`, { headers: this.headers() });
  }

  getAiInsight(borrowerId: string): Observable<any> {
    return this.http.get(`${BASE_URL}/borrowers/${borrowerId}/ai-insight`, { headers: this.headers() });
  }

  invalidatePortfolioCache(): void {
    this.portfolioCache$ = null;
  }

  clearAllCaches(): void {
    this.portfolioCache$ = null;
    this.borrowersCache$ = null;
    this.borrowerCache = {};
    this.signalCache = {};
    this.aiInsightCache = {};
    this.alertCache = {};
  }
}
