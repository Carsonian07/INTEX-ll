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
        var adminPwd = config["Seed:AdminPassword"] ?? "AdminDev123!@#";
        await EnsureSeedUserAsync(
            userManager,
            adminEmail,
            adminPwd,
            "System Admin",
            "Admin");

        var donorEmail = config["Seed:DonorEmail"] ?? "donor@harboredhope.org";
        var donorPwd = config["Seed:DonorPassword"] ?? "DonorDev123!@#";
        await EnsureSeedUserAsync(
            userManager,
            donorEmail,
            donorPwd,
            "Demo Donor",
            "Donor",
            1);
    }

    private static async Task EnsureSeedUserAsync(
        UserManager<AppUser> userManager,
        string email,
        string password,
        string displayName,
        string role,
        int? supporterId = null)
    {
        var user = await userManager.FindByEmailAsync(email);

        if (user == null)
        {
            user = new AppUser
            {
                UserName = email,
                Email = email,
                DisplayName = displayName,
                EmailConfirmed = true,
                SupporterId = supporterId
            };

            var createResult = await userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
                return;
        }
        else
        {
            user.DisplayName = displayName;
            user.EmailConfirmed = true;
            user.SupporterId = supporterId;
            await userManager.UpdateAsync(user);

            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            await userManager.ResetPasswordAsync(user, resetToken, password);
        }

        if (!await userManager.IsInRoleAsync(user, role))
            await userManager.AddToRoleAsync(user, role);
    }
}
