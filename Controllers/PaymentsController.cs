
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurboDrive.Api.Data;
using TurboDrive.Api.Models;

namespace TurboDrive.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly TurboDriveDbContext _context;

    public PaymentsController(TurboDriveDbContext context)
    {
        _context = context;
    }

    // عرض جميع المدفوعات
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Payment>>> GetPayments()
    {
        var payments = await _context.Payments
            .Include(p => p.Sale)
            .OrderByDescending(p => p.PaidAtUtc)
            .ToListAsync();

        return Ok(payments);
    }

    // إضافة دفعة جديدة
    [HttpPost]
    public async Task<ActionResult<Payment>> CreatePayment(Payment payment)
    {
        var saleExists = await _context.Sales
            .AnyAsync(s => s.Id == payment.SaleId);

        if (!saleExists)
        {
            return BadRequest("عملية البيع غير موجودة.");
        }

        payment.Id = 0;
        payment.PaidAtUtc = DateTime.UtcNow;

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetPayments),
            new { id = payment.Id },
            payment
        );
    }
}
 