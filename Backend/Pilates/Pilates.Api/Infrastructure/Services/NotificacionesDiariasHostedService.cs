// Services/NotificacionesDiariasHostedService.cs
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pilates.Api.Infrastructure.Data;

namespace Pilates.Api.Services;

public class NotificacionesDiariasHostedService : IHostedService, IDisposable
{
    private readonly IServiceProvider _services;
    private readonly ILogger<NotificacionesDiariasHostedService> _logger;
    private Timer _timer;

    public NotificacionesDiariasHostedService(
        IServiceProvider services,
        ILogger<NotificacionesDiariasHostedService> logger)
    {
        _services = services;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Servicio de notificaciones diarias iniciado");
        _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromHours(1));
        return Task.CompletedTask;
    }

    private async void DoWork(object state)
    {
        try
        {
            var now = DateTime.UtcNow;

            // Ejecutar solo a las 8:00 AM
            if (now.Hour == 8 && now.Minute < 5)
            {
                _logger.LogInformation("Ejecutando tarea diaria de notificaciones...");

                using var scope = _services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var service = new NotificacionService(context);

                await service.ProcesarNotificacionesDiarias();

                _logger.LogInformation("Tarea diaria completada");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en servicio de notificaciones diarias");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Servicio de notificaciones diarias detenido");
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _timer?.Dispose();
    }
}