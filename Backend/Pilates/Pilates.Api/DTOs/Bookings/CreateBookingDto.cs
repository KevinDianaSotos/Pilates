public class AdminAssignBookingDto
{
    public Guid UserId { get; set; }
    public Guid ClassId { get; set; }
    public bool Attended { get; set; } = false;
}

public class CreateBookingDto
{
    public Guid ClassId { get; set; }
}