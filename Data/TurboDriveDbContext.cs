using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TurboDrive.Api.Models;

namespace TurboDrive.Api.Data;

public class TurboDriveDbContext : IdentityDbContext<ApplicationUser>
{
    public TurboDriveDbContext(
        DbContextOptions<TurboDriveDbContext> options)
        : base(options)
    {
    }

    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Vehicle>()
            .Property(v => v.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Sale>()
            .Property(s => s.SalePrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Sale>()
            .Property(s => s.DepositAmount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Sale>()
            .HasOne(s => s.Vehicle)
            .WithMany()
            .HasForeignKey(s => s.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Sale>()
            .HasOne(s => s.Customer)
            .WithMany()
            .HasForeignKey(s => s.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Sale)
            .WithMany()
            .HasForeignKey(p => p.SaleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
