import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MonthlyStats {
  alumnosMes: number;
  avgAlumnos: number;
  clasesMes: number;
  avgClases: number;
  ingresosMes: number;
  avgIngresos: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardAdminService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMonthlyStats(): Observable<MonthlyStats> {
    return this.http.get<MonthlyStats>(`${this.apiUrl}/admin/dashboard/monthly-stats`);
  }
}