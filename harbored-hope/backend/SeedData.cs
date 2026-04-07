using HarboredHope.API.Data;
using Microsoft.AspNetCore.Identity;

namespace HarboredHope.API;

public static class SeedData
{
    private static readonly string[] Roles = ["Admin", "Staff", "Donor"];

    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var config      = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        // Ensure all roles exist
        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Seed default admin if not present
        var adminEmail = config["Seed:AdminEmail"] ?? "admin@harboredhope.org";
        var adminPwd   = config["Seed:AdminPassword"] ?? "AdminPass123!@#";

        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new AppUser
            {
                UserName    = adminEmail,
                Email       = adminEmail,
                DisplayName = "System Admin",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, adminPwd);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, "Admin");
        }

        // Seed default donor (no MFA) for grader access
        var donorEmail = config["Seed:DonorEmail"] ?? "donor@harboredhope.org";
        var donorPwd   = config["Seed:DonorPassword"] ?? "DonorPass123!@#";

        if (await userManager.FindByEmailAsync(donorEmail) is null)
        {
            var donor = new AppUser
            {
                UserName    = donorEmail,
                Email       = donorEmail,
                DisplayName = "Demo Donor",
                EmailConfirmed = true,
                SupporterId = 1   // links to first supporter in operational DB
            };
            var result = await userManager.CreateAsync(donor, donorPwd);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(donor, "Donor");
        }
    }
}
