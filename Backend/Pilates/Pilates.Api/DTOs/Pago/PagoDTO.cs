public class CreatePagoDto
{
    public Guid UserId { get; set; }
    public decimal Monto { get; set; }
    public DateTime FechaPago { get; set; }
    public string MetodoPago { get; set; } = null!;
    public string? Referencia { get; set; }
    public string? Notas { get; set; }
}

public class PagoDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Cliente { get; set; } = null!;
    public decimal Monto { get; set; }
    public DateTime FechaPago { get; set; }
    public DateTime FechaProximoPago { get; set; }
    public string MetodoPago { get; set; } = null!;
    public string Periodo { get; set; } = null!;
    public string Estado { get; set; } = null!;
    public string? Referencia { get; set; }
}