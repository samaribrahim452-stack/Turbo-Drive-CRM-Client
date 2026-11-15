
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using TurboDrive.Api.Models;

namespace TurboDrive.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        // البحث عن المستخدم باسم المستخدم أو البريد الإلكتروني
        var user = await _userManager.FindByNameAsync(
            request.UserNameOrEmail);

        if (user == null)
        {
            user = await _userManager.FindByEmailAsync(
                request.UserNameOrEmail);
        }

        if (user == null)
            return Unauthorized(new { message = "بيانات الدخول غير صحيحة" });

        // التحقق من كلمة المرور وحالة حظر الحساب
        var signInResult = await _signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: true);

        if (!signInResult.Succeeded)
        {
            return Unauthorized(new
            {
                message = signInResult.IsLockedOut
                    ? "الحساب مقفل مؤقتًا، حاولي لاحقًا"
                    : "بيانات الدخول غير صحيحة"
            });
        }

        // الحصول على صلاحيات المستخدم
        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.Email, user.Email ?? "")
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // إنشاء JWT Token
        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT Key is missing.");

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddHours(8);

        var token = new JwtSecurityToken(
            issuer: "TurboDrive",
            audience: "TurboDriveUsers",
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler()
            .WriteToken(token);

        // إرسال بيانات المستخدم والتوكن للواجهة الأمامية
        return Ok(new
        {
            token = tokenString,
            expiresAtUtc = expiresAt,
            user = new
            {
                id = user.Id,
                userName = user.UserName,
                fullName = user.FullName,
                email = user.Email,
                roles = roles
            }
        });
    }
}
