using HarboredHope.API.Data;
using Microsoft.AspNetCore.Identity;

namespace HarboredHope.API.Data;

public static class SeedData
{
    private static readonly string[] Roles = new[] { "Admin", "Staff", "Donor" };

    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        var adminEmail = config["Seed:AdminEmail"] ?? "admin@harboredhope.org";
        var adminPwd = config["Seed:AdminPassword"] ?? "AdminPass123!@#";

        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var admin = new AppUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                DisplayName = "System Admin",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(admin, adminPwd);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, "Admin");
        }

        var donorEmail = config["Seed:DonorEmail"] ?? "donor@harboredhope.org";
        var donorPwd = config["Seed:DonorPassword"] ?? "DonorPass123!@#";

        if (await userManager.FindByEmailAsync(donorEmail) == null)
        {
            var donor = new AppUser
            {
                UserName = donorEmail,
                Email = donorEmail,
                DisplayName = "Demo Donor",
                EmailConfirmed = true,
                SupporterId = 1
            };

            var result = await userManager.CreateAsync(donor, donorPwd);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(donor, "Donor");
        }
    }
}