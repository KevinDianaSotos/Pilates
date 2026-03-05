import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRouter } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
bootstrapApplication(AppComponent, {
  providers: [
    appRouter,
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
})
