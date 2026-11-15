
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurboDrive.Api.Data;

namespace TurboDrive.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly TurboDriveDbContext _db;

    public DashboardController(TurboDriveDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var totalVehicles = await _db.Vehicles.CountAsync();

        var availableVehicles = await _db.Vehicles
            .CountAsync(v => v.Status == "Available" || v.Status == "متاحة");

        var soldVehicles = await _db.Vehicles
            .CountAsync(v => v.Status == "Sold" || v.Status == "مباعة");

        var totalCustomers = await _db.Customers.CountAsync();

        var tikTokCustomers = await _db.Customers
            .CountAsync(c => c.Source == "TikTok");

        var totalEmployees = await _db.Employees.CountAsync();

        var totalSales = await _db.Sales.CountAsync();

        var totalRevenue = await _db.Sales
            .SumAsync(s => (decimal?)s.SalePrice) ?? 0;

        var totalCollected = await _db.Payments
            .SumAsync(p => (decimal?)p.Amount) ?? 0;

        var remainingAmount = totalRevenue - totalCollected;

        return Ok(new
        {
            totalVehicles,
            availableVehicles,
            soldVehicles,
            totalCustomers,
            tikTokCustomers,
            totalEmployees,
            totalSales,
            totalRevenue,
            totalCollected,
            remainingAmount
        });
    }
}
