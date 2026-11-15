using System.ComponentModel.DataAnnotations;

namespace TurboDrive.Api.Models;

public class Employee
{
    public int Id { get; set; }

    [Required, MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [Required, MaxLength(60)]
    public string JobTitle { get; set; } = "موظف";

    public bool IsActive { get; set; } = true;
}
