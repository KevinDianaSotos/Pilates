// Domain/Entities/Suscripcion.cs
using System;

namespace Pilates.Api.Domain.Entities;

public class Suscripcion
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid TarifaId { get; set; }
    public Tarifa Tarifa { get; set; } = null!;

    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }

    public bool Activa { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}