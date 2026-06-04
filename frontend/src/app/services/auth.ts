import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  role: 'analyst' | 'manager' | 'borrower';
  token: string;
}

const DEMO_USERS: User[] = [
  { id: 'analyst1', name: 'Ravi Kumar', role: 'analyst', token: 'token-analyst1' },
  { id: 'analyst2', name: 'Sneha Patel', role: 'analyst', token: 'token-analyst2' },
  { id: 'manager1', name: 'Suresh Agarwal', role: 'manager', token: 'token-manager' },
  { id: 'B001', name: 'Arjun Sharma', role: 'borrower', token: 'token-borrower-B001' },
  { id: 'B003', name: 'Rahul Verma', role: 'borrower', token: 'token-borrower-B003' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: User | null = null;

  constructor(private router: Router) {
    const saved = localStorage.getItem('ews_user');
    if (saved) this.currentUser = JSON.parse(saved);
  }

  getDemoUsers(): User[] { return DEMO_USERS; }

  login(user: User): void {
    this.currentUser = user;
    localStorage.setItem('ews_user', JSON.stringify(user));
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('ews_user');
    this.router.navigate(['/login']);
  }

  getUser(): User | null { return this.currentUser; }
  getToken(): string { return this.currentUser?.token || ''; }
  isLoggedIn(): boolean { return !!this.currentUser; }
  isAnalyst(): boolean { return this.currentUser?.role === 'analyst' || this.currentUser?.role === 'manager'; }
  isManager(): boolean { return this.currentUser?.role === 'manager'; }
}
