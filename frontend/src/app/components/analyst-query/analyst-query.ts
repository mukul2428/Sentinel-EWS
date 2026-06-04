import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-analyst-query',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  templateUrl: './analyst-query.html',
  styleUrl: './analyst-query.scss'
})
export class AnalystQueryComponent {
  borrowerId = '';
  question = '';
  result: any = null;
  loading = false;
  error = '';
  history: any[] = [];

  borrowerIds = ['B001','B002','B003','B004','B005','B006','B007','B008','B009','B010'];
  borrowers: { id: string; name: string }[] = [];

  constructor(private api: ApiService, public auth: AuthService) {
    this.api.getBorrowers().subscribe({
      next: (res: any) => {
        this.borrowers = (res.data || []).map((b: any) => ({ id: b.borrowerId, name: b.borrowerName }));
      },
      error: () => {}
    });
  }

  submit(): void {
    if (!this.borrowerId || !this.question.trim()) return;
    this.loading = true;
    this.error = '';
    this.api.queryBorrower(this.borrowerId, this.question).subscribe({
      next: (res) => {
        this.result = res;
        this.history.unshift(res);
        this.loading = false;
      },
      error: (e) => { this.error = e.message; this.loading = false; }
    });
  }

  setQuestion(q: string): void { this.question = q; }
}
