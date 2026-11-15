using System.ComponentModel.DataAnnotations;

namespace TurboDrive.Api.Models;

public class Sale
{
    public int Id { get; set; }

    public int VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }

    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }

    [Range(0, 999999999)]
    public decimal SalePrice { get; set; }

    [Range(0, 999999999)]
    public decimal DepositAmount { get; set; }

    [MaxLength(30)]
    public string Status { get; set; } = "مبدئية";

    public DateTime SaleDateUtc { get; set; } = DateTime.UtcNow;
}
