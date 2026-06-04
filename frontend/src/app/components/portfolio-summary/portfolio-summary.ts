import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-portfolio-summary',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownPipe],
  templateUrl: './portfolio-summary.html',
  styleUrl: './portfolio-summary.scss'
})
export class PortfolioSummaryComponent implements OnInit {
  data: any = null;
  loading = true;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getPortfolioSummary().subscribe({
      next: (res) => { this.data = res; this.loading = false; },
      error: (e) => { this.error = e.message; this.loading = false; }
    });
  }

  get riskDistribution() {
    if (!this.data) return [];
    const b = this.data.breakdown;
    const total = b.total || 1;
    return [
      { label: 'Critical', count: b.critical.length, pct: Math.round((b.critical.length / total) * 100), cls: 'cat-critical' },
      { label: 'High Risk', count: b.highRisk.length, pct: Math.round((b.highRisk.length / total) * 100), cls: 'cat-high' },
      { label: 'Watchlist', count: b.watchlist.length, pct: Math.round((b.watchlist.length / total) * 100), cls: 'cat-watch' },
      { label: 'Low Risk', count: b.low.length, pct: Math.round((b.low.length / total) * 100), cls: 'cat-low' },
    ];
  }
}
