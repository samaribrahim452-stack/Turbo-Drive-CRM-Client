using System.ComponentModel.DataAnnotations;

namespace TurboDrive.Api.Models;

public class Payment
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public Sale? Sale { get; set; }

    [Range(0.01, 999999999)]
    public decimal Amount { get; set; }

    [Required, MaxLength(30)]
    public string Method { get; set; } = "تحويل بنكي";

    public DateTime PaidAtUtc { get; set; } = DateTime.UtcNow;

    [MaxLength(250)]
    public string? Notes { get; set; }
}
