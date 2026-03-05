// Controllers/TarifasController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pilates.Api.Infrastructure.Data;
using Pilates.Api.Domain.Entities;

namespace Pilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class TarifasController : ControllerBase
{
    private readonly AppDbContext _context;

    public TarifasController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/tarifas
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var tarifas = await _context.Tarifas
                .OrderBy(t => t.Nombre)
                .ToListAsync();

            var result = tarifas.Select(t => new
            {
                id = t.Id,
                nombre = t.Nombre,
                precio = t.Precio,
                maxClasesMes = t.MaxClasesMes,
                descripcion = t.Descripcion
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener tarifas", error = ex.Message });
        }
    }

    // GET: api/tarifas/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var tarifa = await _context.Tarifas.FindAsync(id);

            if (tarifa == null)
                return NotFound(new { message = "Tarifa no encontrada" });

            var result = new
            {
                id = tarifa.Id,
                nombre = tarifa.Nombre,
                precio = tarifa.Precio,
                maxClasesMes = tarifa.MaxClasesMes,
                descripcion = tarifa.Descripcion
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener la tarifa", error = ex.Message });
        }
    }

    // POST: api/tarifas
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTarifaDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tarifa = new Tarifa
            {
                Id = Guid.NewGuid(),
                Nombre = dto.Nombre,
                Precio = dto.Precio,
                MaxClasesMes = dto.MaxClasesMes,
                Descripcion = dto.Descripcion
            };

            _context.Tarifas.Add(tarifa);
            await _context.SaveChangesAsync();

            var result = new
            {
                id = tarifa.Id,
                nombre = tarifa.Nombre,
                precio = tarifa.Precio,
                maxClasesMes = tarifa.MaxClasesMes,
                descripcion = tarifa.Descripcion
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al crear la tarifa", error = ex.Message });
        }
    }

    // PUT: api/tarifas/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTarifaDto dto)
    {
        try
        {
            var tarifa = await _context.Tarifas.FindAsync(id);

            if (tarifa == null)
                return NotFound(new { message = "Tarifa no encontrada" });

            tarifa.Nombre = dto.Nombre;
            tarifa.Precio = dto.Precio;
            tarifa.MaxClasesMes = dto.MaxClasesMes;
            tarifa.Descripcion = dto.Descripcion;

            await _context.SaveChangesAsync();

            var result = new
            {
                id = tarifa.Id,
                nombre = tarifa.Nombre,
                precio = tarifa.Precio,
                maxClasesMes = tarifa.MaxClasesMes,
                descripcion = tarifa.Descripcion
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al actualizar la tarifa", error = ex.Message });
        }
    }

    // DELETE: api/tarifas/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var tarifa = await _context.Tarifas.FindAsync(id);

            if (tarifa == null)
                return NotFound(new { message = "Tarifa no encontrada" });

            // Verificar si hay usuarios usando esta tarifa
            var usuariosConTarifa = await _context.Users
                .AnyAsync(u => u.TarifaId == id);

            if (usuariosConTarifa)
            {
                return BadRequest(new { message = "No se puede eliminar la tarifa porque tiene clientes asignados" });
            }

            _context.Tarifas.Remove(tarifa);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tarifa eliminada correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al eliminar la tarifa", error = ex.Message });
        }
    }

    // DTOs
    public class CreateTarifaDto
    {
        public string Nombre { get; set; } = null!;
        public decimal Precio { get; set; }
        public int MaxClasesMes { get; set; }
        public string Descripcion { get; set; } = null!;
    }

    public class UpdateTarifaDto
    {
        public string Nombre { get; set; } = null!;
        public decimal Precio { get; set; }
        public int MaxClasesMes { get; set; }
        public string Descripcion { get; set; } = null!;
    }
}