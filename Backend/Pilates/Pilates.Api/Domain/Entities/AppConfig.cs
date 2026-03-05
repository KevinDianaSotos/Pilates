namespace Pilates.Api.Domain.Entities;

public class AppConfig
{
    public Guid Id { get; set; }

    public string AppName { get; set; } = null!;

    public string PrimaryColor { get; set; } = null!;

    public string LogoUrl { get; set; } = null!;
}
