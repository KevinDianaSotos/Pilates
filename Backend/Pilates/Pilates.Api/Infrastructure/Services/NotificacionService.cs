using Microsoft.EntityFrameworkCore;
using Pilates.Api.Infrastructure.Data;
using Pilates.Api.Domain.Entities;
using Pilates.Api.Domain.Enums;
using System.Text.Json;

namespace Pilates.Api.Services;

public class NotificacionService
{
    private readonly AppDbContext _context;

    public NotificacionService(AppDbContext context)
    {
        _context = context;
    }

    // ========== NOTIFICACIONES DE ADMIN (solo para admins) ==========

    public async Task NotificarNuevaClase(Guid classId)
    {
        var clase = await _context.Classes
            .Include(c => c.Instructor)
            .FirstOrDefaultAsync(c => c.Id == classId);

        if (clase == null) return;

        // Obtener todos los clientes
        var clientes = await _context.Users
            .Where(u => u.Role == UserRole.Client)
            .ToListAsync();

        // Notificaciones para CADA cliente (sin notificación para admin)
        foreach (var cliente in clientes)
        {
            var notificacionCliente = new Notificacion
            {
                Id = Guid.NewGuid(),
                Tipo = "nueva_clase",
                Mensaje = $"📢 Nueva clase disponible: {clase.Date:dd/MM HH:mm} con {clase.Instructor?.Name ?? "Instructor"}",
                ReferenciaId = classId.ToString(),
                RolDestino = "Client",
                UsuarioId = cliente.Id,
                Datos = JsonSerializer.Serialize(new
                {
                    claseId = clase.Id,
                    fecha = clase.Date,
                    instructor = clase.Instructor?.Name,
                    duracion = clase.DurationMinutes
                })
            };

            _context.Notificaciones.Add(notificacionCliente);
        }

        await _context.SaveChangesAsync();
    }

    public async Task NotificarClaseEliminada(Guid classId, DateTime fechaClase, string instructorNombre)
    {
        // Obtener todos los clientes
        var clientes = await _context.Users
            .Where(u => u.Role == UserRole.Client)
            .ToListAsync();

        // Notificaciones para CADA cliente (sin notificación para admin)
        foreach (var cliente in clientes)
        {
            var notificacionCliente = new Notificacion
            {
                Id = Guid.NewGuid(),
                Tipo = "clase_eliminada",
                Mensaje = $"❌ Clase cancelada: La clase del {fechaClase:dd/MM HH:mm} con {instructorNombre} ha sido cancelada.",
                ReferenciaId = classId.ToString(),
                RolDestino = "Client",
                UsuarioId = cliente.Id,
                Datos = JsonSerializer.Serialize(new
                {
                    claseId = classId,
                    fecha = fechaClase,
                    instructor = instructorNombre
                })
            };

            _context.Notificaciones.Add(notificacionCliente);
        }

        await _context.SaveChangesAsync();
    }

    // Verificar clases llenas (solo admin)
    public async Task VerificarClasesLlenas(Guid classId)
    {
        var clase = await _context.Classes
            .Include(c => c.Bookings)
            .Include(c => c.Instructor)
            .FirstOrDefaultAsync(c => c.Id == classId);

        if (clase == null) return;

        var ocupadas = clase.Bookings?.Count ?? 0;

        if (ocupadas >= clase.MaxCapacity && clase.MaxCapacity > 0)
        {
            var existe = await _context.Notificaciones
                .AnyAsync(n => n.ReferenciaId == classId.ToString()
                    && n.Tipo == "clase_llena");

            if (!existe)
            {
                var notificacion = new Notificacion
                {
                    Id = Guid.NewGuid(),
                    Tipo = "clase_llena",
                    Mensaje = $"⚠️ Clase completa: {clase.Date:dd/MM HH:mm} con {clase.Instructor?.Name ?? "Instructor"}",
                    ReferenciaId = classId.ToString(),
                    RolDestino = "Admin",
                    Datos = JsonSerializer.Serialize(new
                    {
                        clase.Date,
                        clase.MaxCapacity,
                        instructor = clase.Instructor?.Name
                    })
                };

                _context.Notificaciones.Add(notificacion);
                await _context.SaveChangesAsync();
            }
        }
    }

    // ========== NOTIFICACIONES INDIVIDUALES PARA CLIENTES ==========

    // Notificar pago próximo a un cliente específico
    public async Task NotificarPagoProximoCliente(Guid userId)
    {
        var cliente = await _context.Users
            .Include(u => u.Tarifa)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (cliente?.FechaProximoPago == null) return;

        var diasRestantes = (cliente.FechaProximoPago.Value.Date - DateTime.UtcNow.Date).Days;

        if (diasRestantes == 1)
        {
            var existe = await _context.Notificaciones
                .AnyAsync(n => n.UsuarioId == userId
                    && n.Tipo == "pago_proximo"
                    && n.FechaCreacion.Date == DateTime.UtcNow.Date);

            if (!existe)
            {
                var notificacion = new Notificacion
                {
                    Id = Guid.NewGuid(),
                    Tipo = "pago_proximo",
                    Mensaje = $"⏰ {cliente.Name}, tu pago de {cliente.Tarifa?.Nombre ?? "membresía"} vence MAÑANA",
                    ReferenciaId = userId.ToString(),
                    RolDestino = "Client",
                    UsuarioId = userId,
                    Datos = JsonSerializer.Serialize(new
                    {
                        clienteId = userId,
                        fechaVencimiento = cliente.FechaProximoPago,
                        tarifa = cliente.Tarifa?.Nombre,
                        monto = cliente.Tarifa?.Precio
                    })
                };

                _context.Notificaciones.Add(notificacion);
                await _context.SaveChangesAsync();
            }
        }
    }

    // Notificar pago vencido a un cliente específico
    public async Task NotificarPagoVencidoCliente(Guid userId)
    {
        var cliente = await _context.Users
            .Include(u => u.Tarifa)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (cliente?.FechaProximoPago == null) return;

        if (cliente.FechaProximoPago.Value.Date < DateTime.UtcNow.Date)
        {
            var existe = await _context.Notificaciones
                .AnyAsync(n => n.UsuarioId == userId
                    && n.Tipo == "pago_vencido"
                    && n.FechaCreacion.Date == DateTime.UtcNow.Date);

            if (!existe)
            {
                var notificacion = new Notificacion
                {
                    Id = Guid.NewGuid(),
                    Tipo = "pago_vencido",
                    Mensaje = $"⚠️ {cliente.Name}, tu pago de {cliente.Tarifa?.Nombre ?? "membresía"} está VENCIDO",
                    ReferenciaId = userId.ToString(),
                    RolDestino = "Client",
                    UsuarioId = userId,
                    Datos = JsonSerializer.Serialize(new
                    {
                        clienteId = userId,
                        fechaVencimiento = cliente.FechaProximoPago,
                        diasVencido = (DateTime.UtcNow.Date - cliente.FechaProximoPago.Value.Date).Days,
                        tarifa = cliente.Tarifa?.Nombre
                    })
                };

                _context.Notificaciones.Add(notificacion);
                await _context.SaveChangesAsync();
            }
        }
    }

    // ========== JOBS DIARIOS ==========

    // Verificar pagos próximos de todos los clientes
    public async Task VerificarPagosProximosClientes()
    {
        var manana = DateTime.UtcNow.Date.AddDays(1);

        var clientes = await _context.Users
            .Where(u => u.Role == UserRole.Client
                && u.FechaProximoPago != null
                && u.FechaProximoPago.Value.Date == manana
                && u.EstadoPago == "al_dia")
            .ToListAsync();

        foreach (var cliente in clientes)
        {
            await NotificarPagoProximoCliente(cliente.Id);
        }
    }

    // Verificar pagos vencidos de todos los clientes
    public async Task VerificarPagosVencidosClientes()
    {
        var hoy = DateTime.UtcNow.Date;

        var clientes = await _context.Users
            .Where(u => u.Role == UserRole.Client
                && u.FechaProximoPago != null
                && u.FechaProximoPago.Value.Date < hoy
                && u.EstadoPago != "vencido")
            .ToListAsync();

        foreach (var cliente in clientes)
        {
            await NotificarPagoVencidoCliente(cliente.Id);
            cliente.EstadoPago = "vencido";
        }

        await _context.SaveChangesAsync();
    }

    // Método para el job diario (llama a todas las verificaciones)
    public async Task ProcesarNotificacionesDiarias()
    {
        await VerificarPagosProximosClientes();
        await VerificarPagosVencidosClientes();
    }
}