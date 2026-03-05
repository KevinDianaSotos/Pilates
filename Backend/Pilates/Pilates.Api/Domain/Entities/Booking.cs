using Pilates.Api.Domain.Entities;

public class Booking
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public bool Attended { get; set; }

    // Fecha de creación de la reserva
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Si quieres controlar pagos por clase suelta
    public Guid? PagoId { get; set; }
    public Pago? Pago { get; set; }
}