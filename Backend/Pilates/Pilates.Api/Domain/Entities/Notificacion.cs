public class Notificacion
{
    public Guid Id { get; set; }

    public string Tipo { get; set; } = null!;
    public string Mensaje { get; set; } = null!;
    public string? ReferenciaId { get; set; }

    public bool Leida { get; set; } = false;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaLectura { get; set; }

    // Para notificaciones generales (admin) o específicas (cliente)
    public string? RolDestino { get; set; } // "Admin", "Client", o null para todos
    public Guid? UsuarioId { get; set; } // Para notificaciones individuales de cliente

    public string? Datos { get; set; }
}