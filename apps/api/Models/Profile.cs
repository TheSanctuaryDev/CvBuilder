namespace CvBuilderApi.Models;

public class Profile
{
    public Guid Id { get; set; }
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Cv> Cvs { get; set; } = new List<Cv>();
}
