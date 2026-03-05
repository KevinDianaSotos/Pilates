# Pilates App

Sistema de gestión para estudio de Pilates con roles de Admin y Cliente.

## ✨ Características

- ✅ Gestión de clases (admin)
- ✅ Reservas de clases (clientes)
- ✅ Sistema de pagos y membresías
- ✅ Notificaciones en tiempo real
- ✅ Perfiles de usuario
- ✅ Dashboard con estadísticas

## 🛠️ Tecnologías

### Backend
- .NET 8 / C#
- Entity Framework Core
- PostgreSQL
- JWT Authentication

### Frontend
- Angular 17
- FullCalendar
- SCSS
- RxJS

## 📦 Instalación

### Backend
1. Restaurar paquetes: `dotnet restore`
2. Configurar `appsettings.json`
3. Ejecutar migraciones: `dotnet ef database update`
4. Iniciar: `dotnet run`

### Frontend
1. Instalar dependencias: `npm install`
2. Configurar `src/environments/environment.ts`
3. Iniciar: `ng serve`

## 🔑 Credenciales por defecto

- Admin: admin@pilates.com / admin123
- Cliente: cliente@email.com / cliente123

## 📱 Próximamente

- Versión móvil con Capacitor
- Notificaciones push
- Pagos online