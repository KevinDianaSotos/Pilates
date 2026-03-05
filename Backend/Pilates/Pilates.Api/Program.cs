using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pilates.Api.Infrastructure.Data;
using Pilates.Api.Services;
using System.Text;
using Npgsql; // 👈 Asegúrate de tener este using

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 👇 CONFIGURACIÓN CORREGIDA PARA POSTGRESQL CON UTC
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);

// Database context con opciones UTC
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    // Agregar Timezone=UTC a la connection string si no existe
    if (!connectionString.Contains("Timezone"))
    {
        connectionString += connectionString.EndsWith(";") ? "Timezone=UTC;" : ";Timezone=UTC;";
    }

    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(3);
        npgsqlOptions.CommandTimeout(30);
        npgsqlOptions.UseRelationalNulls();
    });
});

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            )
        };
    });

// Hosted Service para notificaciones diarias
builder.Services.AddHostedService<NotificacionesDiariasHostedService>();
builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // dbContext.Database.EnsureCreated(); // opcional
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ✅ ÚNICO bloque de ApplicationStarted con todos los timers
app.Lifetime.ApplicationStarted.Register(() =>
{
    // Timer para NOTIFICACIONES DIARIAS (cada hora, solo a las 8 AM UTC)
    var timerNotificaciones = new Timer(async _ =>
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var service = new NotificacionService(context);

        var now = DateTime.UtcNow;
        // Ejecutar solo a las 8 AM UTC
        if (now.Hour == 8 && now.Minute == 0)
        {
            Console.WriteLine("🕒 Ejecutando tareas diarias de notificaciones...");
            await service.ProcesarNotificacionesDiarias();
            Console.WriteLine("✅ Tareas diarias completadas");
        }
    }, null, TimeSpan.Zero, TimeSpan.FromHours(1));

    // Timer para ASISTENCIAS AUTOMÁTICAS (cada hora)
    var timerAsistencias = new Timer(async _ =>
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var service = new AsistenciaService(context);

        Console.WriteLine($"🕒 {DateTime.UtcNow}: Actualizando asistencias automáticas...");
        await service.ActualizarAsistenciasPasadas();
    }, null, TimeSpan.Zero, TimeSpan.FromHours(1));
});

app.Run();