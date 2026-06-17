using Microsoft.EntityFrameworkCore;

namespace CvBuilderApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
}
