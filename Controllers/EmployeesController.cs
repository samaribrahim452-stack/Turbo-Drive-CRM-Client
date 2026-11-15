
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurboDrive.Api.Data;
using TurboDrive.Api.Models;

namespace TurboDrive.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly TurboDriveDbContext _context;

    public EmployeesController(TurboDriveDbContext context)
    {
        _context = context;
    }

    // عرض جميع الموظفين
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Employee>>> GetEmployees()
    {
        var employees = await _context.Employees
            .OrderBy(e => e.FullName)
            .ToListAsync();

        return Ok(employees);
    }

    // إضافة موظف جديد
    [HttpPost]
    public async Task<ActionResult<Employee>> CreateEmployee(Employee employee)
    {
        employee.Id = 0;

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetEmployees),
            new { id = employee.Id },
            employee
        );
    }

    // تعديل بيانات موظف
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEmployee(int id, Employee updatedEmployee)
    {
        var employee = await _context.Employees.FindAsync(id);

        if (employee == null)
        {
            return NotFound("الموظف غير موجود.");
        }

        employee.FullName = updatedEmployee.FullName;
        employee.Phone = updatedEmployee.Phone;
        employee.JobTitle = updatedEmployee.JobTitle;
        employee.IsActive = updatedEmployee.IsActive;

        await _context.SaveChangesAsync();

        return Ok(employee);
    }

    // حذف موظف
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        var employee = await _context.Employees.FindAsync(id);

        if (employee == null)
        {
            return NotFound("الموظف غير موجود.");
        }

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
