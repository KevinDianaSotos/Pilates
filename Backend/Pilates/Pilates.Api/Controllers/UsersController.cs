using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pilates.Api.Infrastructure.Data;
using Pilates.Api.Domain.Entities;
using Pilates.Api.Domain.Enums;
using System.Security.Claims;

namespace Pilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound();

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            Role = user.Role.ToString()
        });
    }

    // ==================== ENDPOINTS PARA CLIENTES ====================

    // GET: api/users/clientes
    [HttpGet("clientes")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetClientes()
    {
        try
        {
            var clientes = await _context.Users
                .Include(u => u.Tarifa)
                .Include(u => u.Bookings)
                    .ThenInclude(b => b.Class)
                .Include(u => u.Pagos) // 👈 AÑADIR PARA CARGAR PAGOS
                .Where(u => u.Role == UserRole.Client)
                .OrderBy(u => u.Name)
                .ToListAsync();

            var result = clientes.Select(u => {
                // Obtener el último pago para información adicional si es necesario
                var ultimoPago = u.Pagos?
                    .OrderByDescending(p => p.FechaPago)
                    .FirstOrDefault();

                return new
                {
                    id = u.Id,
                    name = u.Name,
                    email = u.Email,
                    phone = u.Phone,
                    tarifa = u.Tarifa != null ? new
                    {
                        id = u.Tarifa.Id,
                        nombre = u.Tarifa.Nombre,
                        precio = u.Tarifa.Precio,
                        maxClasesMes = u.Tarifa.MaxClasesMes,
                        descripcion = u.Tarifa.Descripcion
                    } : null,
                    status = u.Status ?? ObtenerEstado(u),
                    fechaBajaSolicitada = u.FechaBajaSolicitada,
                    fechaBajaEfectiva = u.FechaBajaEfectiva,
                    // 👇 AÑADIR INFORMACIÓN DE PAGO
                    fechaUltimoPago = u.FechaUltimoPago,
                    fechaProximoPago = u.FechaProximoPago,
                    estadoPago = u.EstadoPago ?? "pendiente",
                    totalBookings = u.Bookings?.Count ?? 0,
                    lastVisit = u.Bookings?
                        .Where(b => b.Class.Date <= DateTime.UtcNow)
                        .OrderByDescending(b => b.Class.Date)
                        .Select(b => b.Class.Date)
                        .FirstOrDefault()
                };
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener clientes", error = ex.Message });
        }
    }

    // GET: api/users/clientes/{id}
    [HttpGet("clientes/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetClienteById(Guid id)
    {
        try
        {
            var cliente = await _context.Users
                .Include(u => u.Tarifa)
                .Include(u => u.Bookings)
                    .ThenInclude(b => b.Class)
                .Include(u => u.Pagos) // ✅ CORRECTO - Solo incluir la colección
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Client);

            if (cliente == null)
                return NotFound(new { message = "Cliente no encontrado" });

            // LOG PARA DEPURAR - Ver cuántos pagos tiene
            Console.WriteLine($"Cliente: {cliente.Name}, Pagos: {cliente.Pagos?.Count ?? 0}");

            // Obtener el último pago
            var ultimoPago = cliente.Pagos?
                .OrderByDescending(p => p.FechaPago)
                .FirstOrDefault();

            var result = new
            {
                id = cliente.Id,
                name = cliente.Name,
                email = cliente.Email,
                phone = cliente.Phone,
                tarifa = cliente.Tarifa != null ? new
                {
                    id = cliente.Tarifa.Id,
                    nombre = cliente.Tarifa.Nombre,
                    precio = cliente.Tarifa.Precio,
                    maxClasesMes = cliente.Tarifa.MaxClasesMes,
                    descripcion = cliente.Tarifa.Descripcion
                } : null,
                status = cliente.Status ?? ObtenerEstado(cliente),
                fechaBajaSolicitada = cliente.FechaBajaSolicitada,
                fechaBajaEfectiva = cliente.FechaBajaEfectiva,
                totalBookings = cliente.Bookings?.Count ?? 0,
                lastVisit = cliente.Bookings?
                    .Where(b => b.Class.Date <= DateTime.UtcNow)
                    .OrderByDescending(b => b.Class.Date)
                    .Select(b => b.Class.Date)
                    .FirstOrDefault(),
                bookings = cliente.Bookings?
                    .OrderByDescending(b => b.Class.Date)
                    .Select(b => new
                    {
                        id = b.Id,
                        classId = b.ClassId,
                        className = $"Clase del {b.Class.Date:dd/MM/yyyy HH:mm}",
                        date = b.Class?.Date,
                        attended = b.Attended
                    }),
                infoPago = new
                {
                    estadoPago = cliente.EstadoPago ?? "pendiente",
                    fechaUltimoPago = cliente.FechaUltimoPago,
                    fechaProximoPago = cliente.FechaProximoPago,
                    ultimoPago = ultimoPago != null ? new
                    {
                        id = ultimoPago.Id,
                        monto = ultimoPago.Monto,
                        fechaPago = ultimoPago.FechaPago,
                        metodoPago = ultimoPago.MetodoPago,
                        periodo = ultimoPago.Periodo
                    } : null
                }
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener el cliente", error = ex.Message });
        }
    }

    // POST: api/users/clientes
    [HttpPost("clientes")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCliente([FromBody] CreateClienteDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Verificar si ya existe un usuario con el mismo email
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (existingUser != null)
                return BadRequest(new { message = "Ya existe un usuario con este email" });

            // Verificar que la tarifa existe
            if (dto.TarifaId.HasValue)
            {
                var tarifa = await _context.Tarifas.FindAsync(dto.TarifaId);
                if (tarifa == null)
                    return BadRequest(new { message = "La tarifa seleccionada no existe" });
            }

            var cliente = new User
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                Role = UserRole.Client,
                TarifaId = dto.TarifaId,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Status = dto.TarifaId.HasValue ? "active" : "pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(cliente);
            await _context.SaveChangesAsync();

            var result = new
            {
                id = cliente.Id,
                name = cliente.Name,
                email = cliente.Email,
                phone = cliente.Phone,
                tarifa = cliente.TarifaId.HasValue ? new
                {
                    id = cliente.TarifaId,
                    nombre = (await _context.Tarifas.FindAsync(cliente.TarifaId))?.Nombre
                } : null,
                status = cliente.Status,
                totalBookings = 0,
                fechaBajaSolicitada = cliente.FechaBajaSolicitada,
                fechaBajaEfectiva = cliente.FechaBajaEfectiva
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al crear cliente", error = ex.Message });
        }
    }

    // PUT: api/users/clientes/{id}
    [HttpPut("clientes/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCliente(Guid id, [FromBody] UpdateClienteDto dto)
    {
        try
        {
            // Eliminar la validación del modelo si contiene errores de Password
            if (!ModelState.IsValid)
            {
                // Si solo hay error de Password y está vacío, lo ignoramos
                var passwordErrors = ModelState["Password"]?.Errors;
                if (passwordErrors != null && passwordErrors.Count > 0)
                {
                    ModelState.Remove("Password");
                }

                // Si después de remover Password aún hay errores, devolver BadRequest
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
            }

            var cliente = await _context.Users
                .Include(u => u.Bookings)
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Client);

            if (cliente == null)
                return NotFound(new { message = "Cliente no encontrado" });

            // Verificar si el email ya está siendo usado por otro usuario
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Id != id);

            if (existingUser != null)
                return BadRequest(new { message = "Ya existe otro usuario con este email" });

            // Verificar que la tarifa existe (si se proporcionó)
            if (dto.TarifaId.HasValue)
            {
                var tarifa = await _context.Tarifas.FindAsync(dto.TarifaId);
                if (tarifa == null)
                    return BadRequest(new { message = "La tarifa seleccionada no existe" });
            }

            // Actualizar propiedades
            cliente.Name = dto.Name;
            cliente.Email = dto.Email;
            cliente.Phone = dto.Phone;
            cliente.TarifaId = dto.TarifaId;

            // Actualizar estado basado en la tarifa (si no tiene baja solicitada)
            if (cliente.FechaBajaSolicitada == null)
            {
                cliente.Status = dto.TarifaId.HasValue ? "active" : "pending";
            }

            // Solo actualizar la contraseña si se proporcionó una nueva
            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                cliente.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            await _context.SaveChangesAsync();

            var result = new
            {
                id = cliente.Id,
                name = cliente.Name,
                email = cliente.Email,
                phone = cliente.Phone,
                tarifa = cliente.TarifaId.HasValue ? new
                {
                    id = cliente.TarifaId,
                    nombre = (await _context.Tarifas.FindAsync(cliente.TarifaId))?.Nombre
                } : null,
                status = cliente.Status ?? ObtenerEstado(cliente),
                fechaBajaSolicitada = cliente.FechaBajaSolicitada,
                fechaBajaEfectiva = cliente.FechaBajaEfectiva,
                totalBookings = cliente.Bookings?.Count ?? 0
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al actualizar cliente", error = ex.Message });
        }
    }

    // POST: api/users/clientes/{id}/baja
    [HttpPost("clientes/{id}/baja")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SolicitarBaja(Guid id)
    {
        try
        {
            var cliente = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Client);

            if (cliente == null)
                return NotFound(new { message = "Cliente no encontrado" });

            // Calcular fecha de baja efectiva (fin de mes actual)
            var ahora = DateTime.UtcNow;
            var finDeMes = new DateTime(ahora.Year, ahora.Month,
                DateTime.DaysInMonth(ahora.Year, ahora.Month), 23, 59, 59, DateTimeKind.Utc);

            cliente.FechaBajaSolicitada = ahora;
            cliente.FechaBajaEfectiva = finDeMes;
            cliente.Status = "inactive";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Baja solicitada correctamente. El cliente permanecerá activo hasta fin de mes.",
                fechaBajaEfectiva = finDeMes
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al procesar la baja", error = ex.Message });
        }
    }

    // POST: api/users/clientes/{id}/reactivar
    [HttpPost("clientes/{id}/reactivar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ReactivarCliente(Guid id)
    {
        try
        {
            var cliente = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Client);

            if (cliente == null)
                return NotFound(new { message = "Cliente no encontrado" });

            cliente.FechaBajaSolicitada = null;
            cliente.FechaBajaEfectiva = null;
            cliente.Status = cliente.TarifaId.HasValue ? "active" : "pending";

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cliente reactivado correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al reactivar el cliente", error = ex.Message });
        }
    }

    // DELETE: api/users/clientes/{id}
    [HttpDelete("clientes/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCliente(Guid id)
    {
        try
        {
            var cliente = await _context.Users
                .Include(u => u.Bookings)
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Client);

            if (cliente == null)
                return NotFound(new { message = "Cliente no encontrado" });

            // Eliminar reservas asociadas
            if (cliente.Bookings != null && cliente.Bookings.Any())
            {
                _context.Bookings.RemoveRange(cliente.Bookings);
            }

            _context.Users.Remove(cliente);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cliente eliminado correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al eliminar cliente", error = ex.Message });
        }
    }

    // GET: api/users/clientes/stats
    [HttpGet("clientes/stats")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1);

            var clientes = await _context.Users
                .Where(u => u.Role == UserRole.Client)
                .ToListAsync();

            var stats = new
            {
                total = clientes.Count,
                active = clientes.Count(c => c.Status == "active"),
                inactive = clientes.Count(c => c.Status == "inactive"),
                pending = clientes.Count(c => c.Status == "pending"),
                newThisMonth = clientes.Count(c => c.CreatedAt >= monthStart),
                expiringSoon = 0
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener estadísticas", error = ex.Message });
        }
    }

    // GET: api/users/clientes/search?term=...
    [HttpGet("clientes/search")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SearchClientes([FromQuery] string term)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(term))
                return Ok(new List<object>());

            var clientes = await _context.Users
                .Where(u => u.Role == UserRole.Client && (
                    u.Name.Contains(term) ||
                    u.Email.Contains(term) ||
                    u.Phone.Contains(term)))
                .Take(10)
                .ToListAsync();

            var result = clientes.Select(u => new
            {
                id = u.Id,
                name = u.Name,
                email = u.Email,
                phone = u.Phone
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al buscar clientes", error = ex.Message });
        }
    }

    // ==================== MÉTODOS AUXILIARES ====================

    private string ObtenerEstado(User user)
    {
        // Si tiene baja solicitada, devolver ese estado
        if (user.FechaBajaSolicitada != null && user.FechaBajaEfectiva != null)
            return "inactive";

        // Si no tiene tarifa asignada
        if (user.Tarifa == null)
            return "pending";

        // Si tiene reservas
        if (user.Bookings != null && user.Bookings.Any())
        {
            var ultimaReserva = user.Bookings
                .Where(b => b.Class.Date <= DateTime.UtcNow)
                .OrderByDescending(b => b.Class.Date)
                .FirstOrDefault();

            if (ultimaReserva != null)
            {
                // Si ha tenido actividad en los últimos 30 días
                var diasDesdeUltimaReserva = (DateTime.UtcNow - ultimaReserva.Class.Date).Days;
                if (diasDesdeUltimaReserva <= 30)
                    return "active";
            }
        }

        // Si tiene tarifa pero no actividad reciente
        return "inactive";
    }


    [HttpGet("perfil")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetMiPerfil()
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var usuario = await _context.Users
                .Include(u => u.Tarifa)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (usuario == null)
                return NotFound(new { message = "Usuario no encontrado" });

            var result = new
            {
                usuario.Id,
                usuario.Name,
                usuario.Email,
                usuario.Phone,
                Tarifa = usuario.Tarifa != null ? new
                {
                    usuario.Tarifa.Id,
                    usuario.Tarifa.Nombre,
                    usuario.Tarifa.Precio,
                    usuario.Tarifa.MaxClasesMes,
                    usuario.Tarifa.Descripcion
                } : null,
                FechaRegistro = usuario.CreatedAt,
                EstadoMembresia = usuario.EstadoPago ?? "pendiente",
                FechaProximoPago = usuario.FechaProximoPago
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener perfil", error = ex.Message });
        }
    }

    [HttpPut("perfil")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> ActualizarPerfil([FromBody] UpdatePerfilDto dto)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var usuario = await _context.Users.FindAsync(userId);

            if (usuario == null)
                return NotFound(new { message = "Usuario no encontrado" });

            // Verificar si el email ya está siendo usado por otro usuario
            if (usuario.Email != dto.Email)
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Id != userId);

                if (existingUser != null)
                    return BadRequest(new { message = "El email ya está registrado por otro usuario" });
            }

            usuario.Name = dto.Name;
            usuario.Email = dto.Email;
            usuario.Phone = dto.Phone;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Perfil actualizado correctamente",
                usuario.Id,
                usuario.Name,
                usuario.Email,
                usuario.Phone
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al actualizar perfil", error = ex.Message });
        }
    }

    [HttpPost("cambiar-password")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var usuario = await _context.Users.FindAsync(userId);

            if (usuario == null)
                return NotFound(new { message = "Usuario no encontrado" });

            // Verificar contraseña actual
            if (!BCrypt.Net.BCrypt.Verify(dto.PasswordActual, usuario.PasswordHash))
                return BadRequest(new { message = "La contraseña actual no es correcta" });

            // Actualizar contraseña
            usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordNueva);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Contraseña actualizada correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al cambiar contraseña", error = ex.Message });
        }
    }
}
// DTOs para perfil
public class UpdatePerfilDto
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
}

public class CambiarPasswordDto
{
    public string PasswordActual { get; set; } = null!;
    public string PasswordNueva { get; set; } = null!;
    public string ConfirmPassword { get; set; } = null!;
}

// DTOs
public class CreateClienteDto
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string Password { get; set; } = null!;
    public Guid? TarifaId { get; set; }
}

public class UpdateClienteDto
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;

    [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
    public string? Password { get; set; }

    public Guid? TarifaId { get; set; }
}