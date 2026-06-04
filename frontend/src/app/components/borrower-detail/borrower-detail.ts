import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-borrower-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MarkdownPipe],
  templateUrl: './borrower-detail.html',
  styleUrl: './borrower-detail.scss'
})
export class BorrowerDetailComponent implements OnInit {
  borrowerId = '';
  borrowerData: any = null;
  riskData: any = null;
  alertData: any = null;
  loading = true;
  alertLoading = false;
  error = '';
  activeTab = 'overview';

  question = '';
  queryResult: any = null;
  queryLoading = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.borrowerId = this.route.snapshot.params['id'];
    this.api.getBorrower(this.borrowerId).subscribe({
      next: (res) => {
        this.borrowerData = res.borrower;
        this.riskData = res.riskAssessment;
        this.loading = false;
      },
      error: (e) => { this.error = e.message; this.loading = false; }
    });
  }

  loadAlert(): void {
    this.activeTab = 'alert';
    this.error = '';
    if (this.alertData) return;
    this.alertLoading = true;
    this.api.getBorrowerAlert(this.borrowerId).subscribe({
      next: (res) => { this.alertData = res; this.alertLoading = false; },
      error: (e) => { this.error = e.message; this.alertLoading = false; }
    });
  }

  submitQuery(): void {
    if (!this.question.trim()) return;
    this.queryLoading = true;
    this.api.queryBorrower(this.borrowerId, this.question).subscribe({
      next: (res) => { this.queryResult = res; this.queryLoading = false; },
      error: (e) => { this.error = e.message; this.queryLoading = false; }
    });
  }

  getCategoryClass(cat: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'cat-critical', HIGH_RISK: 'cat-high', WATCHLIST: 'cat-watch', LOW: 'cat-low'
    };
    return map[cat] || '';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PAID: 'status-paid', PARTIAL: 'status-partial', MISSED: 'status-missed'
    };
    return map[status] || '';
  }

  getTransactionClass(type: string): string {
    const map: Record<string, string> = { CREDIT: 'tx-credit', DEBIT: 'tx-debit', FAILED: 'tx-failed' };
    return map[type] || '';
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = { HIGH: 'sev-high', MEDIUM: 'sev-medium', LOW: 'sev-low' };
    return map[severity] || '';
  }

  get scoreBreakdownItems() {
    if (!this.riskData) return [];
    const sb = this.riskData.scoreBreakdown;
    return [
      { label: 'Days Past Due', value: sb.daysPassDue, max: 30 },
      { label: 'Failed Auto-Debits', value: sb.failedAutoDebits, max: 20 },
      { label: 'Income Inflow Drop', value: sb.incomeInflowDrop, max: 20 },
      { label: 'Credit Utilization', value: sb.creditUtilization, max: 15 },
      { label: 'Payment Behavior', value: sb.paymentBehavior, max: 15 }
    ];
  }

  getTrendWidth(daysDelayed: number): number {
    return Math.min((daysDelayed / 45) * 100, 100);
  }
}
