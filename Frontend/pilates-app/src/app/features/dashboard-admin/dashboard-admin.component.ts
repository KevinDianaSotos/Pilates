import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardAdminService, MonthlyStats } from '../../core/services/dashboardadmin.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CalendarComponent } from '../../shared/components/calendar/calendar.component';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule,CalendarComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss']
})
export class DashboardAdminComponent implements OnInit {
  stats?: MonthlyStats;
  loading = true;
  error?: string;

  constructor(private dashboardadminService: DashboardAdminService) {}

  ngOnInit(): void {
    this.dashboardadminService.getMonthlyStats()
      .pipe(
        catchError(err => {
          this.error = 'No se pudieron cargar las estadísticas.';
          return of(null);
        })
      )
      .subscribe(data => {
        this.stats = data ?? undefined;
        this.loading = false;
      });
  }
}