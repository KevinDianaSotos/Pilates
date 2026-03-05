using Microsoft.EntityFrameworkCore;
using Pilates.Api.Infrastructure.Data;

namespace Pilates.Api.Services;

public class AsistenciaService
{
    private readonly AppDbContext _context;

    public AsistenciaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task ActualizarAsistenciasPasadas()
    {
        var ahora = DateTime.UtcNow;

        // Buscar reservas de clases que ya pasaron y aún no están marcadas como asistidas
        var reservasPendientes = await _context.Bookings
            .Include(b => b.Class)
            .Where(b => b.Class.Date < ahora && !b.Attended)
            .ToListAsync();

        foreach (var reserva in reservasPendientes)
        {
            reserva.Attended = true; // Marcar como asistida
        }

        if (reservasPendientes.Any())
        {
            await _context.SaveChangesAsync();
            Console.WriteLine($"✅ {reservasPendientes.Count} asistencias actualizadas automáticamente");
        }
    }
}