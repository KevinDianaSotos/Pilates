using Pilates.Api.Domain.Entities;

public class Class
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }

    public int DurationMinutes { get; set; } = 60;

    public int MaxCapacity { get; set; }

    public Guid? InstructorId { get; set; }
    public User? Instructor { get; set; }

    // Para estadísticas: controlar si la clase se impartió
    public bool IsCompleted { get; set; } = false;

    // Relación con bookings
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}