
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurboDrive.Api.Data;
using TurboDrive.Api.Models;

namespace TurboDrive.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly TurboDriveDbContext _db;

    public VehiclesController(TurboDriveDbContext db)
    {
        _db = db;
    }

    // عرض السيارات مع البحث والفلترة
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vehicle>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? make,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int? year)
    {
        var query = _db.Vehicles.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(v =>
                v.Make.Contains(search) ||
                v.Model.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(v => v.Status == status);

        if (!string.IsNullOrWhiteSpace(make))
            query = query.Where(v => v.Make == make);

        if (minPrice.HasValue)
            query = query.Where(v => v.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(v => v.Price <= maxPrice.Value);

        if (year.HasValue)
            query = query.Where(v => v.Year == year.Value);

        var vehicles = await query
            .OrderByDescending(v => v.Id)
            .ToListAsync();

        return Ok(vehicles);
    }

    // عرض سيارة واحدة
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Vehicle>> GetById(int id)
    {
        var vehicle = await _db.Vehicles.FindAsync(id);

        if (vehicle is null)
            return NotFound("السيارة غير موجودة.");

        return Ok(vehicle);
    }

    // إضافة سيارة
    [HttpPost]
    public async Task<ActionResult<Vehicle>> Create(Vehicle vehicle)
    {
        vehicle.Id = 0;
        vehicle.CreatedAtUtc = DateTime.UtcNow;

        if (string.IsNullOrWhiteSpace(vehicle.Status))
            vehicle.Status = "متاحة";

        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = vehicle.Id },
            vehicle);
    }

    // تعديل سيارة
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Vehicle input)
    {
        var vehicle = await _db.Vehicles.FindAsync(id);

        if (vehicle is null)
            return NotFound("السيارة غير موجودة.");

        vehicle.Make = input.Make;
        vehicle.Model = input.Model;
        vehicle.Year = input.Year;
        vehicle.Price = input.Price;
        vehicle.Status = input.Status;
        vehicle.Color = input.Color;
        vehicle.EngineType = input.EngineType;
        vehicle.FuelType = input.FuelType;
        vehicle.Transmission = input.Transmission;
        vehicle.Mileage = input.Mileage;
        vehicle.Vin = input.Vin;
        vehicle.PlateNumber = input.PlateNumber;
        vehicle.Description = input.Description;
        vehicle.ImageUrl = input.ImageUrl;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // حذف سيارة
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var vehicle = await _db.Vehicles.FindAsync(id);

        if (vehicle is null)
            return NotFound("السيارة غير موجودة.");

        var hasSales = await _db.Sales
            .AnyAsync(s => s.VehicleId == id);

        if (hasSales)
            return BadRequest(
                "لا يمكن حذف سيارة مرتبطة بعملية بيع.");

        _db.Vehicles.Remove(vehicle);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
