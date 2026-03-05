using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pilates.Api.Infrastructure.Data;
using Pilates.Api.Domain.Entities;
using System.Security.Claims;
using System.Text.Json;

namespace Pilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificacionController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificacionController(AppDbContext context)
    {
        _context = context;
    }

    // Para admin - ver notificaciones de admin
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetNotificacionesAdmin([FromQuery] bool soloNoLeidas = false)
    {
        try
        {
            IQueryable<Notificacion> query = _context.Notificaciones
                .Where(n => n.RolDestino == "Admin")
                .OrderByDescending(n => n.FechaCreacion);

            if (soloNoLeidas)
            {
                query = query.Where(n => !n.Leida);
            }

            var notificaciones = await query.Take(50).ToListAsync();

            return Ok(notificaciones.Select(n => new
            {
                n.Id,
                n.Tipo,
                n.Mensaje,
                n.Leida,
                n.FechaCreacion,
                n.ReferenciaId,
                Datos = n.Datos != null ? JsonSerializer.Deserialize<object>(n.Datos) : null
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener notificaciones", error = ex.Message });
        }
    }

    // Para cliente - ver sus notificaciones individuales
    [HttpGet("cliente")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetNotificacionesCliente([FromQuery] bool soloNoLeidas = false)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            IQueryable<Notificacion> query = _context.Notificaciones
                .Where(n => n.UsuarioId == userId)
                .OrderByDescending(n => n.FechaCreacion);

            if (soloNoLeidas)
            {
                query = query.Where(n => !n.Leida);
            }

            var notificaciones = await query.Take(50).ToListAsync();

            return Ok(notificaciones.Select(n => new
            {
                n.Id,
                n.Tipo,
                n.Mensaje,
                n.Leida,
                n.FechaCreacion,
                n.ReferenciaId,
                Datos = n.Datos != null ? JsonSerializer.Deserialize<object>(n.Datos) : null
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener notificaciones", error = ex.Message });
        }
    }

    // Marcar como leída (funciona para ambos roles)
    [HttpPost("{id}/leer")]
    public async Task<IActionResult> MarcarComoLeida(Guid id)
    {
        try
        {
            var notificacion = await _context.Notificaciones.FindAsync(id);
            if (notificacion == null)
                return NotFound();

            notificacion.Leida = true;
            notificacion.FechaLectura = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al marcar notificación", error = ex.Message });
        }
    }

    // Marcar todas como leídas (para admin o cliente según su rol)
    [HttpPost("leer-todas")]
    public async Task<IActionResult> MarcarTodasComoLeidas()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            IQueryable<Notificacion> query;

            if (userRole == "Admin")
            {
                query = _context.Notificaciones.Where(n => n.RolDestino == "Admin" && !n.Leida);
            }
            else
            {
                var guid = Guid.Parse(userId!);
                query = _context.Notificaciones.Where(n => n.UsuarioId == guid && !n.Leida);
            }

            var noLeidas = await query.ToListAsync();

            foreach (var n in noLeidas)
            {
                n.Leida = true;
                n.FechaLectura = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { count = noLeidas.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al marcar notificaciones", error = ex.Message });
        }
    }

    // Endpoint de prueba (opcional)
    [HttpPost("test")]
    [AllowAnonymous]
    public async Task<IActionResult> CrearNotificacionTest()
    {
        try
        {
            var notificacion = new Notificacion
            {
                Id = Guid.NewGuid(),
                Tipo = "test",
                Mensaje = "🔔 NOTIFICACIÓN DE PRUEBA",
                RolDestino = "Admin",
                FechaCreacion = DateTime.UtcNow,
                Leida = false
            };

            _context.Notificaciones.Add(notificacion);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notificación de prueba creada", id = notificacion.Id });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al crear notificación", error = ex.Message });
        }
    }
}