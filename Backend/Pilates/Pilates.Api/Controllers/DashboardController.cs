using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pilates.Api.Domain.Entities;
using Pilates.Api.Infrastructure.Data;
using Pilates.Api.Domain.Enums;

namespace Pilates.Api.Controllers
{
    [ApiController]
    [Route("api/admin/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _db;

        public DashboardController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("instructores")]
        public async Task<IActionResult> GetInstructoresDisponibles()
        {
            var instructores = await _db.Users
                .Where(u => u.Role == UserRole.Admin && u.Status == "active")
                .Select(u => new { u.Id, u.Name })
                .ToListAsync();

            return Ok(instructores);
        }

        // Controllers/DashboardController.cs
        [HttpGet("monthly-stats")]
        public async Task<IActionResult> GetMonthlyStats()
        {
            try
            {
                var now = DateTime.UtcNow;
                var firstDayOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);

                // 🔹 ALUMNOS DEL MES (clientes activos)
                var alumnosMes = await _db.Users
                    .Where(u => u.Role == UserRole.Client
                        && u.Status == "active"
                        && (u.FechaBajaEfectiva == null || u.FechaBajaEfectiva > firstDayOfMonth))
                    .CountAsync();

                // 🔹 CLASES DEL MES
                var clasesMes = await _db.Classes
                    .Where(c => c.Date >= firstDayOfMonth && c.Date <= lastDayOfMonth)
                    .CountAsync();

                // 🔹 INGRESOS DEL MES (basado en tarifas de clientes activos)
                var ingresosMes = await _db.Users
                    .Include(u => u.Tarifa)
                    .Where(u => u.Role == UserRole.Client
                        && u.Status == "active"
                        && u.Tarifa != null
                        && (u.FechaBajaEfectiva == null || u.FechaBajaEfectiva > firstDayOfMonth))
                    .SumAsync(u => u.Tarifa!.Precio);

                // 🔹 PROMEDIOS (últimos 6 meses)
                var seisMesesAtras = firstDayOfMonth.AddMonths(-6);

                var statsMensuales = await _db.Users
                    .Where(u => u.Role == UserRole.Client
                        && u.Status == "active"
                        && u.CreatedAt >= seisMesesAtras)
                    .GroupBy(u => new { u.CreatedAt.Year, u.CreatedAt.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Alumnos = g.Count(),
                        Ingresos = g.Sum(u => u.Tarifa != null ? u.Tarifa.Precio : 0)
                    })
                    .ToListAsync();

                var avgAlumnos = statsMensuales.Any() ? statsMensuales.Average(s => s.Alumnos) : 0;
                var avgIngresos = statsMensuales.Any() ? statsMensuales.Average(s => s.Ingresos) : 0;

                return Ok(new
                {
                    alumnosMes,
                    avgAlumnos = Math.Round(avgAlumnos, 1),
                    clasesMes,
                    avgClases = 0, // Por implementar
                    ingresosMes,
                    avgIngresos = Math.Round(avgIngresos, 2)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener estadísticas", error = ex.Message });
            }
        }
    }
}