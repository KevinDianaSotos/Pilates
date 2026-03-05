// Domain/Entities/User.cs
using Pilates.Api.Domain.Enums;

namespace Pilates.Api.Domain.Entities;

public class User
{
    public Guid Id { get; set; }

    public string Name { get; set; } = 
        null!;

    public string Phone { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public UserRole Role { get; set; }

    public Guid? TarifaId { get; set; }
    public Tarifa? Tarifa { get; set; }

    public string? Status { get; set; } = "pending"; // active, inactive, pending
    public DateTime? FechaBajaSolicitada { get; set; }
    public DateTime? FechaBajaEfectiva { get; set; }

    public ICollection<Suscripcion> Suscripciones { get; set; } = new List<Suscripcion>();

    public ICollection<Booking>? Bookings { get; set; }

    // Información de pago (calculada o actualizada con cada pago)
    public DateTime? FechaUltimoPago { get; set; }
    public DateTime? FechaProximoPago { get; set; }
    public string? EstadoPago { get; set; } = "pendiente"; // al_dia, pendiente, vencido

    // Relación con pagos
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}