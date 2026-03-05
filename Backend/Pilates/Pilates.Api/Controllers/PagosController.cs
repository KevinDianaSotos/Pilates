// Controllers/PagosController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pilates.Api.Domain.Entities;
using Pilates.Api.Domain.Enums;
using Pilates.Api.Infrastructure.Data;

namespace Pilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class PagosController : ControllerBase
{
    private readonly AppDbContext _context;

    public PagosController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/pagos
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pagos = await _context.Pagos
            .Include(p => p.User)
            .OrderByDescending(p => p.FechaPago)
            .ToListAsync();

        var result = pagos.Select(p => new
        {
            id = p.Id,
            userId = p.UserId,
            cliente = p.User.Name,
            monto = p.Monto,
            fechaPago = p.FechaPago,
            fechaProximoPago = p.FechaProximoPago,
            metodoPago = p.MetodoPago,
            periodo = p.Periodo,
            estado = p.Estado,
            referencia = p.Referencia
        });

        return Ok(result);
    }

    // GET: api/pagos/cliente/{userId}
    [HttpGet("cliente/{userId}")]
    public async Task<IActionResult> GetByCliente(Guid userId)
    {
        var pagos = await _context.Pagos
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.FechaPago)
            .ToListAsync();

        return Ok(pagos);
    }

    // GET: api/pagos/estadisticas
    [HttpGet("estadisticas")]
    public async Task<IActionResult> GetEstadisticas()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1);

        // Pagos del mes actual
        var pagosMes = await _context.Pagos
            .Where(p => p.FechaPago >= monthStart)
            .SumAsync(p => p.Monto);

        // Clientes al día
        var clientesAlDia = await _context.Users
            .CountAsync(u => u.Role == UserRole.Client
                && u.EstadoPago == "al_dia"
                && u.FechaProximoPago >= now);

        // Clientes con pagos vencidos
        var clientesVencidos = await _context.Users
            .CountAsync(u => u.Role == UserRole.Client
                && (u.EstadoPago == "vencido"
                    || (u.FechaProximoPago < now && u.FechaProximoPago != null)));

        return Ok(new
        {
            ingresosMes = pagosMes,
            clientesAlDia,
            clientesVencidos
        });
    }

    // POST: api/pagos
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePagoDto dto)
    {
        try
        {
            var usuario = await _context.Users
                .Include(u => u.Tarifa)
                .FirstOrDefaultAsync(u => u.Id == dto.UserId);

            if (usuario == null)
                return NotFound(new { message = "Usuario no encontrado" });

            if (usuario.Tarifa == null)
                return BadRequest(new { message = "El usuario no tiene una tarifa asignada" });

            // Calcular próxima fecha de pago según el período de la tarifa
            DateTime fechaProximoPago;
            string periodo;

            switch (usuario.Tarifa.Nombre.ToLower())
            {
                case var s when s.Contains("mensual"):
                    fechaProximoPago = dto.FechaPago.AddMonths(1);
                    periodo = "Mensual";
                    break;
                case var s when s.Contains("trimestral"):
                    fechaProximoPago = dto.FechaPago.AddMonths(3);
                    periodo = "Trimestral";
                    break;
                case var s when s.Contains("semestral"):
                    fechaProximoPago = dto.FechaPago.AddMonths(6);
                    periodo = "Semestral";
                    break;
                case var s when s.Contains("anual"):
                    fechaProximoPago = dto.FechaPago.AddYears(1);
                    periodo = "Anual";
                    break;
                default:
                    fechaProximoPago = dto.FechaPago.AddMonths(1);
                    periodo = "Mensual";
                    break;
            }

            var pago = new Pago
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                Monto = dto.Monto,
                FechaPago = dto.FechaPago,
                FechaProximoPago = fechaProximoPago,
                MetodoPago = dto.MetodoPago,
                Referencia = dto.Referencia,
                Periodo = periodo,
                Estado = "pagado",
                Notas = dto.Notas,
                CreatedAt = DateTime.UtcNow
            };

            // Actualizar información de pago del usuario
            usuario.FechaUltimoPago = dto.FechaPago;
            usuario.FechaProximoPago = fechaProximoPago;
            usuario.EstadoPago = "al_dia";

            _context.Pagos.Add(pago);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Pago registrado correctamente",
                pago = new
                {
                    id = pago.Id,
                    fechaProximoPago = pago.FechaProximoPago
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al registrar el pago", error = ex.Message });
        }
    }

    // POST: api/pagos/procesar-vencidos (job para actualizar estados)
    [HttpPost("procesar-vencidos")]
    public async Task<IActionResult> ProcesarVencidos()
    {
        var now = DateTime.UtcNow;

        var usuariosVencidos = await _context.Users
            .Where(u => u.Role == UserRole.Client
                && u.FechaProximoPago < now
                && u.EstadoPago == "al_dia")
            .ToListAsync();

        foreach (var usuario in usuariosVencidos)
        {
            usuario.EstadoPago = "vencido";
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Se actualizaron {usuariosVencidos.Count} clientes a estado vencido" });
    }
}