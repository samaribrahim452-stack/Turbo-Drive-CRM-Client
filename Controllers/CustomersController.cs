
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurboDrive.Api.Data;
using TurboDrive.Api.Models;

namespace TurboDrive.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly TurboDriveDbContext _db;

    public CustomersController(TurboDriveDbContext db)
    {
        _db = db;
    }

    // عرض العملاء مع البحث والفلترة
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Customer>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? source,
        [FromQuery] string? status)
    {
        var query = _db.Customers
            .AsNoTracking()
            .Include(c => c.AssignedEmployee)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c =>
                c.FullName.Contains(search) ||
                c.Phone.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(source))
            query = query.Where(c => c.Source == source);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(c => c.Status == status);

        var customers = await query
            .OrderByDescending(c => c.Id)
            .ToListAsync();

        return Ok(customers);
    }

    // عرض عميل واحد
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Customer>> GetById(int id)
    {
        var customer = await _db.Customers
            .Include(c => c.AssignedEmployee)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer is null)
            return NotFound("العميل غير موجود.");

        return Ok(customer);
    }

    // إضافة عميل جديد
    [HttpPost]
    public async Task<ActionResult<Customer>> Create(Customer customer)
    {
        customer.Id = 0;
        customer.CreatedAtUtc = DateTime.UtcNow;

        if (string.IsNullOrWhiteSpace(customer.Source))
            customer.Source = "غير محدد";

        if (string.IsNullOrWhiteSpace(customer.Status))
            customer.Status = "جديد";

        if (customer.AssignedEmployeeId.HasValue)
        {
            var exists = await _db.Employees.AnyAsync(e =>
                e.Id == customer.AssignedEmployeeId.Value &&
                e.IsActive);

            if (!exists)
                return BadRequest("الموظف غير موجود أو غير نشط.");
        }

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = customer.Id },
            customer);
    }

    // تعديل بيانات العميل
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Customer input)
    {
        var customer = await _db.Customers.FindAsync(id);

        if (customer is null)
            return NotFound("العميل غير موجود.");

        if (input.AssignedEmployeeId.HasValue)
        {
            var exists = await _db.Employees.AnyAsync(e =>
                e.Id == input.AssignedEmployeeId.Value &&
                e.IsActive);

            if (!exists)
                return BadRequest("الموظف غير موجود أو غير نشط.");
        }

        customer.FullName = input.FullName;
        customer.Phone = input.Phone;
        customer.Email = input.Email;
        customer.Notes = input.Notes;

        customer.Source = string.IsNullOrWhiteSpace(input.Source)
            ? "غير محدد"
            : input.Source;

        customer.CampaignName = input.CampaignName;
        customer.CampaignId = input.CampaignId;

        customer.Status = string.IsNullOrWhiteSpace(input.Status)
            ? "جديد"
            : input.Status;

        customer.AssignedEmployeeId = input.AssignedEmployeeId;
        customer.LastFollowUpAtUtc = input.LastFollowUpAtUtc;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // حذف عميل
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await _db.Customers.FindAsync(id);

        if (customer is null)
            return NotFound("العميل غير موجود.");

        var hasSales = await _db.Sales
            .AnyAsync(s => s.CustomerId == id);

        if (hasSales)
            return BadRequest(
                "لا يمكن حذف عميل لديه مبيعات مسجلة.");

        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
