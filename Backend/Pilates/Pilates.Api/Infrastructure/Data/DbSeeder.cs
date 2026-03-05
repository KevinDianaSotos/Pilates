using Pilates.Api.Domain.Entities;
using Pilates.Api.Domain.Enums;

namespace Pilates.Api.Infrastructure.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        // Si la DB ya tiene datos, no hacemos nada
        if (context.Users.Any() || context.AppConfigs.Any())
            return;

        // Crear usuario admin
        var admin = new User
        {
            Id = Guid.NewGuid(),
            Name = "Admin",
            Phone = "605328980",
            Email = "admin@pilates.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"), // contraseña por defecto
            Role = UserRole.Admin
        };

        // Crear configuración base
        var config = new AppConfig
        {
            Id = Guid.NewGuid(),
            AppName = "StudiosRyM",
            PrimaryColor = "#C9A14A",
            LogoUrl = "/assets/logoBlanco.png"
        };

        context.Users.Add(admin);
        context.AppConfigs.Add(config);

        context.SaveChanges();
    }
}
