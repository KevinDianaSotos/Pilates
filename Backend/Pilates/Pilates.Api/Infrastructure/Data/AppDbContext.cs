using Microsoft.EntityFrameworkCore;
using Pilates.Api.Domain.Entities;
using System.Collections.Generic;

namespace Pilates.Api.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Class> Classes => Set<Class>();
        public DbSet<Booking> Bookings => Set<Booking>();
        public DbSet<AppConfig> AppConfigs => Set<AppConfig>();

        public DbSet<Tarifa> Tarifas => Set<Tarifa>();
        public DbSet<Pago> Pagos => Set<Pago>();

        public DbSet<Notificacion> Notificaciones => Set<Notificacion>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Class>()
               .Property(c => c.Date)
               .HasColumnType("timestamp with time zone") // 👈 Volvemos a timestamptz
               .HasConversion(
                   v => v.ToUniversalTime(), // Asegurar UTC al guardar
                   v => DateTime.SpecifyKind(v, DateTimeKind.Utc) // Mantener UTC al leer
               );



            // Configuración de Notificacion
            modelBuilder.Entity<Notificacion>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Tipo).IsRequired();
                entity.Property(e => e.Mensaje).IsRequired();
                entity.Property(e => e.RolDestino).HasDefaultValue("Admin");
                entity.HasIndex(e => new { e.Leida, e.RolDestino });
                entity.HasIndex(e => e.FechaCreacion);
            });

            // Relación User ↔ Tarifa (opcional)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Tarifa)
                .WithMany()
                .HasForeignKey(u => u.TarifaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Suscripcion>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany(e => e.Suscripciones)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Tarifa)
                    .WithMany()
                    .HasForeignKey(e => e.TarifaId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Relación Booking ↔ User
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación Booking ↔ Class
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Class)
                .WithMany(c => c.Bookings)
                .HasForeignKey(b => b.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación Booking ↔ Pago (opcional)
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Pago)
                .WithMany()
                .HasForeignKey(b => b.PagoId)
                .OnDelete(DeleteBehavior.SetNull);

            // Relación Class ↔ Instructor (User)
            modelBuilder.Entity<Class>()
                .HasOne(c => c.Instructor)
                .WithMany()
                .HasForeignKey(c => c.InstructorId)
                .OnDelete(DeleteBehavior.SetNull);

        }
    }
}