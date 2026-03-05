using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pilates.Api.Domain.Entities;
using Pilates.Api.Domain.Enums;
using Pilates.Api.Infrastructure.Data;
using Pilates.Api.Services;
using System.Security.Claims;

namespace Pilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // requiere token JWT
public class BookingController : ControllerBase
{
    private readonly AppDbContext _context;

    public BookingController(AppDbContext context)
    {
        _context = context;
    }

    // GET: /api/booking/mis-reservas (ver mis reservas como cliente)
    [HttpGet("mis-reservas")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetMisReservas()
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var ahora = DateTime.UtcNow;

            var reservas = await _context.Bookings
                .Include(b => b.Class)
                    .ThenInclude(c => c.Instructor)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.Class.Date)
                .ToListAsync();

            var result = reservas.Select(b => new
            {
                b.Id,
                b.ClassId,
                fecha = b.Class.Date,
                instructor = b.Class.Instructor?.Name ?? "Instructor",
                duracion = b.Class.DurationMinutes,
                // Si la clase ya pasó y el cliente estaba apuntado, asistió automáticamente
                atendio = b.Class.Date <= ahora ? true : b.Attended,
                puedeCancelar = b.Class.Date > ahora && !b.Attended
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener reservas", error = ex.Message });
        }
    }

    [HttpPost("actualizar-asistencias")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ActualizarAsistencias()
    {
        try
        {
            var service = new AsistenciaService(_context);
            await service.ActualizarAsistenciasPasadas();
            return Ok(new { message = "Asistencias actualizadas correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al actualizar asistencias", error = ex.Message });
        }
    }

    // GET: /api/booking 
    [HttpGet]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var bookings = await _context.Bookings
            .Where(b => b.UserId == userId)
            .Include(b => b.Class)
            .ToListAsync();

        return Ok(bookings);
    }

    // POST: /api/booking (crear reserva)
    [HttpPost]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> Create([FromBody] CreateBookingDto dto)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Comprobar que la clase existe
            var clase = await _context.Classes
                .Include(c => c.Bookings)
                .FirstOrDefaultAsync(c => c.Id == dto.ClassId);

            if (clase == null)
                return BadRequest(new { message = "La clase no existe" });

            // Comprobar capacidad
            var reservasCount = clase.Bookings?.Count ?? 0;
            if (reservasCount >= clase.MaxCapacity)
                return BadRequest(new { message = "La clase ya está completa" });

            // Comprobar que el usuario no tiene ya una reserva para esta clase
            var reservaExistente = await _context.Bookings
                .AnyAsync(b => b.UserId == userId && b.ClassId == dto.ClassId);

            if (reservaExistente)
                return BadRequest(new { message = "Ya tienes una reserva para esta clase" });

            // Verificar límite de clases según su tarifa
            var usuario = await _context.Users
                .Include(u => u.Tarifa)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (usuario?.Tarifa != null)
            {
                var clasesEsteMes = await _context.Bookings
                    .CountAsync(b => b.UserId == userId
                        && b.Class.Date.Month == DateTime.UtcNow.Month
                        && b.Class.Date.Year == DateTime.UtcNow.Year);

                if (clasesEsteMes >= usuario.Tarifa.MaxClasesMes)
                    return BadRequest(new { message = "Has alcanzado el límite de clases este mes" });
            }

            var newBooking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ClassId = dto.ClassId,
                Attended = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(newBooking);
            await _context.SaveChangesAsync();

            // Generar notificación si la clase se llena
            var notificacionService = new NotificacionService(_context);
            await notificacionService.VerificarClasesLlenas(dto.ClassId);

            return Ok(new
            {
                message = "Reserva creada correctamente",
                bookingId = newBooking.Id,
                classId = newBooking.ClassId,
                date = clase.Date
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al crear la reserva", error = ex.Message });
        }
    }

    // POST: /api/booking/reservar (alias)
    [HttpPost("reservar")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> ReservarClase([FromBody] CreateBookingDto dto)
    {
        return await Create(dto);
    }

    // DELETE: /api/booking/{id} (cancelar reserva)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var booking = await _context.Bookings
                .Include(b => b.Class)
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

            if (booking == null)
                return NotFound(new { message = "Reserva no encontrada" });

            // Verificar que la clase no ha pasado
            if (booking.Class.Date <= DateTime.UtcNow)
                return BadRequest(new { message = "No puedes cancelar una clase que ya pasó" });

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Reserva cancelada correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al cancelar la reserva", error = ex.Message });
        }
    }

    // ADMIN: Asignar cliente a una clase
    [HttpPost("admin/asignar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AsignarCliente([FromBody] AdminAssignBookingDto dto)
    {
        try
        {
            // Verificar que la clase existe
            var clase = await _context.Classes
                .Include(c => c.Bookings)
                .FirstOrDefaultAsync(c => c.Id == dto.ClassId);

            if (clase == null)
                return NotFound(new { message = "La clase no existe" });

            // Verificar que el cliente existe
            var cliente = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == dto.UserId && u.Role == UserRole.Client);

            if (cliente == null)
                return NotFound(new { message = "El cliente no existe" });

            // Verificar capacidad
            if (clase.Bookings.Count >= clase.MaxCapacity)
                return BadRequest(new { message = "La clase ya está completa" });

            // Verificar que el cliente no tiene ya reserva
            var reservaExistente = await _context.Bookings
                .AnyAsync(b => b.UserId == dto.UserId && b.ClassId == dto.ClassId);

            if (reservaExistente)
                return BadRequest(new { message = "El cliente ya tiene reserva para esta clase" });

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                ClassId = dto.ClassId,
                Attended = dto.Attended,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Verificar si la clase se llenó
            var notificacionService = new NotificacionService(_context);
            await notificacionService.VerificarClasesLlenas(dto.ClassId);

            return Ok(new
            {
                message = "Cliente asignado correctamente",
                bookingId = booking.Id
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al asignar cliente", error = ex.Message });
        }
    }

    // ADMIN: Obtener clientes por clase
    [HttpGet("admin/clientes-por-clase/{classId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetClientesPorClase(Guid classId)
    {
        try
        {
            var bookings = await _context.Bookings
                .Include(b => b.User)
                .Where(b => b.ClassId == classId)
                .Select(b => new
                {
                    b.Id,
                    b.UserId,
                    Cliente = b.User.Name,
                    b.Attended,
                    b.CreatedAt
                })
                .ToListAsync();

            return Ok(bookings);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener clientes", error = ex.Message });
        }
    }

    // ADMIN: Marcar asistencia
    [HttpPut("admin/marcar-asistencia/{bookingId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarcarAsistencia(Guid bookingId, [FromBody] bool attended)
    {
        try
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null)
                return NotFound(new { message = "Reserva no encontrada" });

            booking.Attended = attended;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Asistencia actualizada" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al actualizar asistencia", error = ex.Message });
        }
    }


}