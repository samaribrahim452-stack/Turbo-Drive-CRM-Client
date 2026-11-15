
using System.ComponentModel.DataAnnotations;

namespace TurboDrive.Api.Models;

public class Customer
{
    public int Id { get; set; }

    [Required, MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(160), EmailAddress]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // مصدر وصول العميل
    [MaxLength(50)]
    public string Source { get; set; } = "غير محدد";

    // اسم الحملة الإعلانية
    [MaxLength(150)]
    public string? CampaignName { get; set; }

    // رقم الحملة في TikTok عند توفره
    [MaxLength(100)]
    public string? CampaignId { get; set; }

    // حالة متابعة العميل
    [MaxLength(50)]
    public string Status { get; set; } = "جديد";

    // الموظف المسؤول عن العميل
    public int? AssignedEmployeeId { get; set; }
    public Employee? AssignedEmployee { get; set; }

    public DateTime? LastFollowUpAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
