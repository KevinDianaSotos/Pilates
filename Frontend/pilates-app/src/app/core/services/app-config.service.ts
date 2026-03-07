import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface AppConfig {
  id: string;
  appName: string;
  primaryColor: string;
  logoUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<AppConfig> {
    return this.http.get<AppConfig>(`${this.apiUrl}/Appconfig`);
  }
}
