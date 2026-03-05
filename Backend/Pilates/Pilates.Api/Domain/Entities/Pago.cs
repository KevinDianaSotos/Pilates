// Domain/Entities/Pago.cs
using System;

namespace Pilates.Api.Domain.Entities;

public class Pago
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public decimal Monto { get; set; }
    public DateTime FechaPago { get; set; }
    public DateTime FechaProximoPago { get; set; }

    public string MetodoPago { get; set; } = null!; // Efectivo, Tarjeta, Transferencia
    public string? Referencia { get; set; }

    public string Periodo { get; set; } = null!; // Se obtiene de la tarifa pero lo guardamos por historial

    public string Estado { get; set; } = "pagado"; // pagado, pendiente, vencido

    public string? Notas { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}