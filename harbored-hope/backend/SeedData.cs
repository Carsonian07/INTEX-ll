using HarboredHope.API.Data;
using HarboredHope.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

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
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("SeedData");

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
        int? donorSupporterId = null;

        try
        {
            // If the demo user exists and is linked to a supporter whose email doesn't match,
            // that's a bad link (e.g. linked to a seeded CSV record like Mila Alvarez). Clear it.
            var existingDemoUser = await userManager.FindByEmailAsync(donorEmail);
            if (existingDemoUser?.SupporterId != null)
            {
                var linkedSupporter = await db.Supporters.FindAsync(existingDemoUser.SupporterId.Value);
                if (linkedSupporter != null &&
                    !string.Equals(linkedSupporter.Email, donorEmail, StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogWarning("Demo donor was linked to wrong supporter ({Name}). Clearing bad link.",
                        linkedSupporter.DisplayName);
                    existingDemoUser.SupporterId = null;
                    await userManager.UpdateAsync(existingDemoUser);
                }
            }

            // Ensure a Supporter row exists for the demo donor before creating the auth user.
            // We look up by email so the ID is always consistent with what's actually in the DB.
            var existingSupporter = await db.Supporters.FirstOrDefaultAsync(s => s.Email == donorEmail);
            if (existingSupporter == null)
            {
                // supporter_id is not an IDENTITY column — assign MAX+1 manually
                var nextId = (await db.Supporters.MaxAsync(s => (int?)s.SupporterId) ?? 0) + 1;

                var supporter = new Supporter
                {
                    SupporterId        = nextId,
                    SupporterType      = TrimTo("Individual", 19),
                    DisplayName        = TrimTo("Demo Donor", 17),
                    FirstName          = TrimTo("Demo", 6),
                    LastName           = TrimTo("Donor", 10),
                    RelationshipType   = TrimTo("Donor", 19),
                    Region             = TrimTo("Unknown", 8),
                    Country            = TrimTo("USA", 11),
                    Email              = TrimTo(donorEmail, 37),
                    Phone              = TrimTo("Unknown", 17),
                    Status             = TrimTo("Active", 8),
                    AcquisitionChannel = TrimTo("Direct", 15),
                    CreatedAt          = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                };
                db.Supporters.Add(supporter);
                await db.SaveChangesAsync();
                donorSupporterId = supporter.SupporterId;
            }
            else
            {
                donorSupporterId = existingSupporter.SupporterId;
            }
        }
        catch (Exception ex) when (ex is SqlException or DbUpdateException or InvalidOperationException)
        {
            logger.LogWarning(ex, "Skipping donor supporter seed because the operational database schema is not ready.");
        }

        // Only pass the supporterId if we successfully resolved one —
        // passing null would overwrite an existing valid link on the user record.
        if (donorSupporterId.HasValue)
        {
            await EnsureSeedUserAsync(
                userManager,
                donorEmail,
                donorPwd,
                "Demo Donor",
                "Donor",
                donorSupporterId);
        }
        else
        {
            await EnsureSeedUserAsync(
                userManager,
                donorEmail,
                donorPwd,
                "Demo Donor",
                "Donor");
        }
    }

    private static string? TrimTo(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return value;

        return value.Length <= maxLength ? value : value[..maxLength];
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
            // Only update SupporterId if we have a real value — never wipe an existing link
            if (supporterId.HasValue)
                user.SupporterId = supporterId;
            await userManager.UpdateAsync(user);

            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            await userManager.ResetPasswordAsync(user, resetToken, password);
        }

        if (!await userManager.IsInRoleAsync(user, role))
            await userManager.AddToRoleAsync(user, role);
    }
}
