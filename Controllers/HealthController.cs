using Microsoft.AspNetCore.Mvc;

namespace TurboDrive.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "ok",
            application = "Turbo_Drive",
            message = "الخادم يعمل"
        });
    }
}
