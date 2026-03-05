using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pilates.Api.Domain.Entities;
using Pilates.Api.Infrastructure.Data;

namespace Pilates.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppConfigController : ControllerBase
{
    private readonly AppDbContext _context;

    public AppConfigController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetConfig()
    {
        var config = await _context.AppConfigs.FirstOrDefaultAsync();
        if (config == null) return NotFound("No hay configuración");

        return Ok(config);
    }
}
