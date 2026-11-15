
using Microsoft.AspNetCore.Identity;
using TurboDrive.Api.Models;

namespace TurboDrive.Api.Data;

public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var roleManager = scope.ServiceProvider
            .GetRequiredService<RoleManager<IdentityRole>>();

        var userManager = scope.ServiceProvider
            .GetRequiredService<UserManager<ApplicationUser>>();

        var configuration = scope.ServiceProvider
            .GetRequiredService<IConfiguration>();

        // إنشاء الأدوار الأساسية
        string[] roles = { "Manager", "Sales", "Employee" };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(
                    new IdentityRole(role));

                if (!result.Succeeded)
                {
                    throw new Exception(
                        $"Could not create role {role}: " +
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }

        // قراءة بيانات المدير من User Secrets
        var username = configuration["InitialAdmin:UserName"];
        var email = configuration["InitialAdmin:Email"];
        var fullName = configuration["InitialAdmin:FullName"];
        var password = configuration["InitialAdmin:Password"];

        if (string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "Initial admin settings are incomplete.");
        }

        // البحث عن حساب المدير
        var admin = await userManager.FindByNameAsync(username);

        // إنشاء الحساب إذا لم يكن موجودًا
        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = username,
                Email = email,
                FullName = fullName ?? username,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(admin, password);

            if (!result.Succeeded)
            {
                throw new Exception(
                    "Could not create admin: " +
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        // التأكد من أن الحساب يحمل صلاحية المدير
        if (!await userManager.IsInRoleAsync(admin, "Manager"))
        {
            var result = await userManager.AddToRoleAsync(admin, "Manager");

            if (!result.Succeeded)
            {
                throw new Exception(
                    "Could not assign Manager role: " +
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }
}
