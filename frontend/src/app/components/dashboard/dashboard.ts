import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  borrowers: any[] = [];
  loading = true;
  error = '';
  filterCategory = 'ALL';

  categories = ['ALL', 'CRITICAL', 'HIGH_RISK', 'WATCHLIST', 'LOW'];
  signalLoading: Record<string, boolean> = {};

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.api.getBorrowers().subscribe({
      next: (res) => { this.borrowers = res.data; this.loading = false; },
      error: (e) => { this.error = e.message; this.loading = false; }
    });
  }

  get filtered(): any[] {
    if (this.filterCategory === 'ALL') return this.borrowers;
    return this.borrowers.filter(b => b.riskCategory === this.filterCategory);
  }

  get stats() {
    return {
      critical: this.borrowers.filter(b => b.riskCategory === 'CRITICAL').length,
      highRisk: this.borrowers.filter(b => b.riskCategory === 'HIGH_RISK').length,
      watchlist: this.borrowers.filter(b => b.riskCategory === 'WATCHLIST').length,
      low: this.borrowers.filter(b => b.riskCategory === 'LOW').length,
    };
  }

  getCategoryClass(cat: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'cat-critical', HIGH_RISK: 'cat-high', WATCHLIST: 'cat-watch', LOW: 'cat-low'
    };
    return map[cat] || '';
  }

  getUrgencyClass(urgency: string): string {
    const map: Record<string, string> = {
      IMMEDIATE: 'urgency-immediate', HIGH: 'urgency-high',
      MEDIUM: 'urgency-medium', LOW: 'urgency-low', NONE: 'urgency-none'
    };
    return map[urgency] || '';
  }

  onSignalClick(event: MouseEvent, borrowerId: string): void {
    event.stopPropagation();
    this.fetchSignalAndAction(borrowerId);
  }

  fetchSignalAndAction(borrowerId: string): void {
    if (this.signalLoading[borrowerId]) return;
    // Already cached — no need to call API again
    if (this.api.signalCache[borrowerId]?.aiGenerated) return;
    this.signalLoading[borrowerId] = true;
    this.api.generateSignal(borrowerId).subscribe({
      next: (res) => {
        this.api.signalCache[borrowerId] = res;
        this.signalLoading[borrowerId] = false;
      },
      error: () => {
        this.signalLoading[borrowerId] = false;
      }
    });
  }

  getSignal(borrowerId: string): string {
    return this.api.signalCache[borrowerId]?.signal ?? '';
  }

  getAction(borrowerId: string): string {
    return this.api.signalCache[borrowerId]?.action ?? '';
  }

  isAiGenerated(borrowerId: string): boolean {
    return this.api.signalCache[borrowerId]?.aiGenerated ?? false;
  }
}