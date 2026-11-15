using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurboDrive.Api.Data;
using TurboDrive.Api.Models;

namespace TurboDrive.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly TurboDriveDbContext _db;
    public SalesController(TurboDriveDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Sale>>> GetAll()
        => Ok(await _db.Sales.AsNoTracking()
            .Include(s => s.Vehicle)
            .Include(s => s.Customer)
            .OrderByDescending(s => s.Id)
            .ToListAsync());

    [HttpPost]
    public async Task<ActionResult<Sale>> Create(Sale sale)
    {
        var vehicleExists = await _db.Vehicles.AnyAsync(v => v.Id == sale.VehicleId);
        var customerExists = await _db.Customers.AnyAsync(c => c.Id == sale.CustomerId);
        if (!vehicleExists || !customerExists)
            return BadRequest("يجب اختيار سيارة وعميل موجودين في قاعدة البيانات.");

        sale.Id = 0;
        sale.SaleDateUtc = DateTime.UtcNow;
        _db.Sales.Add(sale);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = sale.Id }, sale);
    }
}
