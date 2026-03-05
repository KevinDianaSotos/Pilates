namespace Pilates.Api.Domain.Entities;

public class Tarifa
{
    public Guid Id { get; set; }

    public string Nombre { get; set; } = null!; 

    public decimal Precio { get; set; }

    public int MaxClasesMes { get; set; } 

    public string Descripcion { get; set; } = null!; 

}