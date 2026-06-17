namespace CvBuilderApi.Models;

public class AdminUser
{
    public Guid UserId { get; set; }
    public Profile? User { get; set; }
}
