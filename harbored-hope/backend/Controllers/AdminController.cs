using HarboredHope.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController(
    CsvSeederService seeder,
    IWebHostEnvironment env,
    ILogger<AdminController> logger) : ControllerBase
{
    /// <summary>
    /// Seeds the operational database from the 17 CSV files.
    /// CSV files must be placed in: backend/data/*.csv
    /// This endpoint is idempotent — already-seeded tables are skipped.
    /// POST /api/admin/seed-csv
    /// </summary>
    [HttpPost("seed-csv")]
    public async Task<IActionResult> SeedFromCsv()
    {
        // Locate the data folder relative to the app root
        var dataFolder = Path.Combine(env.ContentRootPath, "data");

        logger.LogInformation("Starting CSV seed from {Folder}", dataFolder);

        var result = await seeder.SeedAllAsync(dataFolder);

        if (!result.Success)
        {
            return StatusCode(500, new
            {
                message = "Seeding completed with errors.",
                seeded  = result.Seeded,
                skipped = result.Skipped,
                errors  = result.Errors
            });
        }

        return Ok(new
        {
            message = "Seeding complete.",
            seeded  = result.Seeded,
            skipped = result.Skipped
        });
    }

    /// <summary>
    /// Returns a list of all registered users with their roles.
    /// GET /api/admin/users
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromServices] Microsoft.AspNetCore.Identity.UserManager<Data.AppUser> userManager)
    {
        var users = userManager.Users.ToList();
        var result = new List<object>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new
            {
                user.Id,
                user.Email,
                user.DisplayName,
                user.TwoFactorEnabled,
                user.SupporterId,
                Roles = roles
            });
        }

        return Ok(result);
    }

    /// <summary>
    /// Assigns a role to a user (additive).
    /// POST /api/admin/users/{userId}/roles
    /// </summary>
    [HttpPost("users/{userId}/roles")]
    public async Task<IActionResult> AssignRole(
        string userId,
        [FromBody] AssignRoleRequest req,
        [FromServices] Microsoft.AspNetCore.Identity.UserManager<Data.AppUser> userManager)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var validRoles = new[] { "Admin", "Staff", "Donor" };
        if (!validRoles.Contains(req.Role))
            return BadRequest(new { message = $"Invalid role. Valid roles: {string.Join(", ", validRoles)}" });

        if (await userManager.IsInRoleAsync(user, req.Role))
            return Conflict(new { message = $"User already has role {req.Role}" });

        await userManager.AddToRoleAsync(user, req.Role);
        return Ok(new { message = $"Role {req.Role} assigned to {user.Email}" });
    }

    /// <summary>
    /// Replaces all roles on a user with a single role.
    /// PUT /api/admin/users/{userId}/role
    /// </summary>
    [HttpPut("users/{userId}/role")]
    public async Task<IActionResult> SetRole(
        string userId,
        [FromBody] AssignRoleRequest req,
        [FromServices] Microsoft.AspNetCore.Identity.UserManager<Data.AppUser> userManager)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var validRoles = new[] { "Admin", "Staff", "Donor" };
        if (!validRoles.Contains(req.Role))
            return BadRequest(new { message = $"Invalid role. Valid roles: {string.Join(", ", validRoles)}" });

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRoleAsync(user, req.Role);

        return Ok(new { message = $"{user.Email} is now {req.Role}" });
    }

    /// <summary>
    /// Deletes a user account. Cannot delete your own account.
    /// DELETE /api/admin/users/{userId}
    /// </summary>
    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(
        string userId,
        [FromServices] Microsoft.AspNetCore.Identity.UserManager<Data.AppUser> userManager)
    {
        var currentUserId = userManager.GetUserId(User);
        if (userId == currentUserId)
            return BadRequest(new { message = "You cannot delete your own account." });

        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var result = await userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return StatusCode(500, new { message = "Failed to delete user." });

        return Ok(new { message = $"{user.Email} has been deleted." });
    }

    /// <summary>
    /// Links a user account to a supporter profile.
    /// PUT /api/admin/users/{userId}/supporter-link
    /// </summary>
    [HttpPut("users/{userId}/supporter-link")]
    public async Task<IActionResult> LinkSupporter(
        string userId,
        [FromBody] LinkSupporterRequest req,
        [FromServices] Microsoft.AspNetCore.Identity.UserManager<Data.AppUser> userManager)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        user.SupporterId = req.SupporterId;
        await userManager.UpdateAsync(user);

        return Ok(new { message = $"Linked user {user.Email} to supporter {req.SupporterId}" });
    }
}

public record AssignRoleRequest(string Role);
public record LinkSupporterRequest(int SupporterId);
