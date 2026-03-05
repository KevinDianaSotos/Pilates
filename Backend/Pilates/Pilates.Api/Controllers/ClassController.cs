using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pilates.Api.Domain.Entities;
using Pilates.Api.Infrastructure.Data;
using Pilates.Api.Services;
using System.Security.Claims;

namespace Pilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // requiere token JWT
public class ClassController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClassController(AppDbContext context)
    {
        _context = context;
    }

    // GET: /api/class (obtener todas las clases)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var classes = await _context.Classes
            .Include(c => c.Instructor)
            .Include(c => c.Bookings)
                .ThenInclude(b => b.User)
            .ToListAsync();

        var result = classes.Select(c => new
        {
            id = c.Id,
            date = c.Date,
            maxCapacity = c.MaxCapacity,
            durationMinutes = c.DurationMinutes,
            instructor = c.Instructor != null
                ? new { c.Instructor.Id, c.Instructor.Name }
                : null,
            alumnos = c.Bookings.Select(b => new
            {
                id = b.User.Id,
                name = b.User.Name,
                attended = b.Attended
            }).ToList(),
            occupiedSpots = c.Bookings.Count
        });

        return Ok(result);
    }

    // GET: /api/class/disponibles (para clientes)
    [HttpGet("disponibles")]
    [Authorize(Roles = "Client,Admin")]
    public async Task<IActionResult> GetClasesDisponibles()
    {
        try
        {
            var ahora = DateTime.UtcNow;

            var clases = await _context.Classes
                .Include(c => c.Instructor)
                .Include(c => c.Bookings)
                .Where(c => !c.IsCompleted) 
                .OrderBy(c => c.Date)
                .ToListAsync();

            var result = clases.Select(c => new
            {
                c.Id,
                title = "Pilates",
                fecha = c.Date,
                duracion = c.DurationMinutes,
                instructor = c.Instructor?.Name ?? "Instructor",
                capacidad = c.MaxCapacity,
                reservadas = c.Bookings?.Count ?? 0,
                plazasLibres = (c.MaxCapacity - (c.Bookings?.Count ?? 0)),
                isCompleted = c.IsCompleted,
                isPasada = c.Date < ahora
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener clases", error = ex.Message });
        }
    }

    // POST: /api/class (solo admin)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Class newClass)
    {
        newClass.Id = Guid.NewGuid();

        _context.Classes.Add(newClass);
        await _context.SaveChangesAsync();

        await _context.Entry(newClass)
            .Reference(c => c.Instructor)
            .LoadAsync();

        // Notificar a admin (no a todos los clientes)
        var notificacionService = new NotificacionService(_context);
        await notificacionService.NotificarNuevaClase(newClass.Id);

        return Ok(new
        {
            id = newClass.Id,
            date = newClass.Date,
            durationMinutes = newClass.DurationMinutes,
            maxCapacity = newClass.MaxCapacity,
            instructor = newClass.Instructor != null
                ? new { newClass.Instructor.Id, newClass.Instructor.Name }
                : null
        });
    }

    // PUT: /api/class/{id} (solo admin)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Class updatedClass)
    {
        var existingClass = await _context.Classes
            .Include(c => c.Instructor)
            .Include(c => c.Bookings)
                .ThenInclude(b => b.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (existingClass == null)
            return NotFound();

        // Validar capacidad
        if (updatedClass.MaxCapacity < existingClass.Bookings.Count)
        {
            return BadRequest("La capacidad no puede ser menor al número de alumnos inscritos");
        }



        existingClass.Date = updatedClass.Date;
        existingClass.DurationMinutes = updatedClass.DurationMinutes;
        existingClass.MaxCapacity = updatedClass.MaxCapacity;
        existingClass.InstructorId = updatedClass.InstructorId;

        await _context.SaveChangesAsync();

        var claseGuardada = await _context.Classes
        .AsNoTracking()
        .FirstOrDefaultAsync(c => c.Id == id);
            Console.WriteLine($"Fecha guardada en BD: {claseGuardada.Date}");
            Console.WriteLine($"Kind después de leer: {claseGuardada.Date.Kind}");

        return Ok(new
        {
            id = existingClass.Id,
            date = existingClass.Date,
            durationMinutes = existingClass.DurationMinutes,
            maxCapacity = existingClass.MaxCapacity,
            instructor = existingClass.Instructor != null
                ? new { existingClass.Instructor.Id, existingClass.Instructor.Name }
                : null,
            alumnos = existingClass.Bookings
                .Where(b => b.User != null)
                .Select(b => new
                {
                    id = b.User.Id,
                    name = b.User.Name,
                    attended = b.Attended
                }).ToList(),
            occupiedSpots = existingClass.Bookings.Count
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var clase = await _context.Classes
                .Include(c => c.Bookings)
                .Include(c => c.Instructor)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (clase == null)
                return NotFound(new { message = "Clase no encontrada" });

            // Guardar información para la notificación antes de eliminar
            var fechaClase = clase.Date;
            var instructorNombre = clase.Instructor?.Name ?? "Instructor";

            // Eliminar reservas asociadas (si las hay)
            if (clase.Bookings != null && clase.Bookings.Any())
            {
                _context.Bookings.RemoveRange(clase.Bookings);
            }

            _context.Classes.Remove(clase);
            await _context.SaveChangesAsync();

            // Crear notificación para todos los clientes
            var notificacionService = new NotificacionService(_context);
            await notificacionService.NotificarClaseEliminada(id, fechaClase, instructorNombre);

            return Ok(new
            {
                message = "Clase eliminada correctamente",
                claseId = id
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al eliminar la clase", error = ex.Message });
        }
    }

    [HttpGet("cliente/proximas")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetProximasClasesCliente()
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var ahora = DateTime.UtcNow;

            var reservas = await _context.Bookings
                .Include(b => b.Class)
                    .ThenInclude(c => c.Instructor)
                .Where(b => b.UserId == userId
                    && b.Class.Date >= ahora
                    && !b.Class.IsCompleted)
                .OrderBy(b => b.Class.Date)
                .Take(5)
                .ToListAsync();

            var result = reservas.Select(b => new
            {
                id = b.Id,
                claseId = b.ClassId,
                fecha = b.Class.Date,
                instructor = b.Class.Instructor?.Name ?? "Instructor",
                duracion = b.Class.DurationMinutes,
                plazasLibres = b.Class.MaxCapacity - (b.Class.Bookings?.Count ?? 0)
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener próximas clases", error = ex.Message });
        }
    }

    [HttpGet("cliente/ultimas")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetUltimasClasesCliente()
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var ahora = DateTime.UtcNow;

            var reservas = await _context.Bookings
                .Include(b => b.Class)
                    .ThenInclude(c => c.Instructor)
                .Where(b => b.UserId == userId
                    && b.Class.Date < ahora)
                .OrderByDescending(b => b.Class.Date)
                .Take(5)
                .ToListAsync();

            var result = reservas.Select(b => new
            {
                id = b.Id,
                claseId = b.ClassId,
                fecha = b.Class.Date,
                instructor = b.Class.Instructor?.Name ?? "Instructor",
                duracion = b.Class.DurationMinutes,
                atendio = b.Attended
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener últimas clases", error = ex.Message });
        }
    }

    [HttpGet("cliente/stats")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetStatsCliente()
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var ahora = DateTime.UtcNow;
            var inicioMes = new DateTime(ahora.Year, ahora.Month, 1);

            var reservas = await _context.Bookings
                .Include(b => b.Class)
                .Where(b => b.UserId == userId)
                .ToListAsync();

            var stats = new
            {
                proximasClases = reservas.Count(b => b.Class.Date >= ahora),
                totalClases = reservas.Count,
                // Clases que ya pasaron se cuentan como asistidas
                clasesAsistidas = reservas.Count(b => b.Class.Date < ahora),
                clasesEsteMes = reservas.Count(b => b.Class.Date >= inicioMes),
                diasRestantes = await CalcularDiasRestantes(userId),
                estadoMembresia = await ObtenerEstadoMembresia(userId)
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener estadísticas", error = ex.Message });
        }
    }

    // Métodos auxiliares
    private async Task<int> CalcularDiasRestantes(Guid userId)
    {
        var usuario = await _context.Users
            .Include(u => u.Tarifa)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (usuario?.FechaProximoPago == null)
            return 0;

        var dias = (usuario.FechaProximoPago.Value - DateTime.UtcNow).Days;
        return dias > 0 ? dias : 0;
    }

    private async Task<string> ObtenerEstadoMembresia(Guid userId)
    {
        var usuario = await _context.Users
            .Include(u => u.Tarifa)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (usuario?.Tarifa == null)
            return "Sin membresía";

        if (usuario.FechaProximoPago == null)
            return "Activa";

        if (usuario.FechaProximoPago < DateTime.UtcNow)
            return "Vencida";

        var diasRestantes = (usuario.FechaProximoPago.Value - DateTime.UtcNow).Days;

        if (diasRestantes <= 5)
            return "Por vencer";

        return "Activa";
    }
}