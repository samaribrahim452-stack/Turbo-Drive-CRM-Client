
using System.ComponentModel.DataAnnotations;

namespace TurboDrive.Api.Models;

public class Vehicle
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Make { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Model { get; set; } = string.Empty;

    [Range(1900, 2100)]
    public int Year { get; set; }

    [Range(0, 999999999)]
    public decimal Price { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "متاحة";

    [MaxLength(100)]
    public string? Color { get; set; }

    [MaxLength(100)]
    public string? EngineType { get; set; }

    [MaxLength(50)]
    public string? FuelType { get; set; }

    [MaxLength(50)]
    public string? Transmission { get; set; }

    [Range(0, 2000000)]
    public int Mileage { get; set; }

    [MaxLength(50)]
    public string? Vin { get; set; }

    [MaxLength(30)]
    public string? PlateNumber { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
