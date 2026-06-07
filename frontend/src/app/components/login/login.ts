import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  demoUsers: User[];

  constructor(public auth: AuthService, private api: ApiService) {
    this.demoUsers = auth.getDemoUsers();
    if (auth.isLoggedIn()) auth.logout();
  }

  login(user: User): void {
    this.api.clearAllCaches();
    this.auth.login(user);
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = { analyst: '🔍', manager: '📊', borrower: '👤' };
    return icons[role] || '👤';
  }
}
