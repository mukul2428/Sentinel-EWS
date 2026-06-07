import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { BorrowerDetailComponent } from './components/borrower-detail/borrower-detail';
import { AnalystQueryComponent } from './components/analyst-query/analyst-query';
import { PortfolioSummaryComponent } from './components/portfolio-summary/portfolio-summary';
import { inject } from '@angular/core';
import { AuthService } from './services/auth';
import { Router } from '@angular/router';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/login']); return false; }
  return true;
};

const analystGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/login']); return false; }
  if (!auth.isAnalyst()) { router.navigate(['/dashboard']); return false; }
  return true;
};

const managerGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/login']); return false; }
  if (!auth.isManager()) { router.navigate(['/dashboard']); return false; }
  return true;
};

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'borrower/:id', component: BorrowerDetailComponent, canActivate: [authGuard] },
  { path: 'query', component: AnalystQueryComponent, canActivate: [analystGuard] },
  { path: 'portfolio', component: PortfolioSummaryComponent, canActivate: [managerGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
