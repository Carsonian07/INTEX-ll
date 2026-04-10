using HarboredHope.API.Data;
using HarboredHope.API.Models;
using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/donations")]
[Authorize]
public class DonationsController(AppDbContext db, UserManager<AppUser> userManager) : ControllerBase
{
    // ── GET /api/donations ────────────────────────────────────────────────────
    // Admin sees all; donor sees only their own
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type,
        [FromQuery] string? campaign,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var query = db.Donations
            .Include(d => d.Supporter)
            .AsQueryable();

        // Scope to the signed-in supporter for everyone except Admin/Staff (who manage all records).
        // Do not rely on User.IsInRole("Donor") alone: JWT role claims can be missing/mis-mapped, and
        // the frontend may allow /donor for accounts whose roles are not yet assigned — without this,
        // those requests would return the full org-wide donation list.
        if (!IsAdminOrStaff())
        {
            var sid = await ResolveDonorSupporterIdAsync();
            if (sid is null)
                return Forbid();
            query = query.Where(d => d.SupporterId == sid.Value);
        }

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(d => d.DonationType == type);

        if (!string.IsNullOrWhiteSpace(campaign))
            query = query.Where(d => d.CampaignName == campaign);

        var total = await query.CountAsync();

        var donations = await query
            .OrderByDescending(d => d.DonationDate)
            .ThenByDescending(d => d.DonationId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DonationListDto
            {
                DonationId    = d.DonationId,
                SupporterId   = d.SupporterId,
                DisplayName   = d.Supporter != null ? d.Supporter.DisplayName : "",
                DonationType  = d.DonationType,
                DonationDate  = d.DonationDate,
                Amount        = d.Amount,
                CurrencyCode  = d.CurrencyCode,
                CampaignName  = d.CampaignName,
                IsRecurring   = d.IsRecurring,
                ChannelSource = d.ChannelSource
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, data = donations });
    }

    // ── GET /api/donations/{id} ───────────────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var donation = await db.Donations
            .Include(d => d.Supporter)
            .Include(d => d.InKindItems)
            .Include(d => d.Allocations).ThenInclude(a => a.Safehouse)
            .FirstOrDefaultAsync(d => d.DonationId == id);

        if (donation is null) return NotFound();

        if (!IsAdminOrStaff())
        {
            var sid = await ResolveDonorSupporterIdAsync();
            if (sid is null || donation.SupporterId != sid.Value)
                return Forbid();
        }

        return Ok(donation);
    }

    // ── POST /api/donations ───────────────────────────────────────────────────
    // Donors create their own; admin can create for anyone
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDonationRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        int supporterId;

        if (IsAdminOrStaff())
        {
            supporterId = req.SupporterId;
        }
        else
        {
            var sid = await ResolveDonorSupporterIdAsync();
            if (sid is null)
                return Forbid();
            supporterId = sid.Value;
        }

        var donation = new Donation
        {
            SupporterId   = supporterId,
            DonationType  = req.DonationType,
            DonationDate  = DateOnly.FromDateTime(DateTime.Today),
            ChannelSource = req.ChannelSource ?? "Direct",
            CurrencyCode  = req.DonationType == "Monetary" ? "USD" : null,
            Amount        = req.Amount,
            EstimatedValue = req.Amount,
            ImpactUnit    = req.DonationType == "Monetary" ? "pesos" : null,
            IsRecurring   = req.IsRecurring,
            CampaignName  = req.CampaignName,
            Notes         = req.Notes,
        };

        await AssignManualKeyIfNeededAsync("donations", "donation_id", id => donation.DonationId = id);
        db.Donations.Add(donation);

        // Update supporter's first donation date if needed
        var supporter = await db.Supporters.FindAsync(supporterId);
        if (supporter is not null)
        {
            if (supporter.FirstDonationDate is null)
            {
                supporter.FirstDonationDate = DateOnly.FromDateTime(DateTime.Today);
            }

            if (!string.IsNullOrWhiteSpace(req.DonorName))
            {
                supporter.DisplayName = TrimTo(req.DonorName, 17) ?? supporter.DisplayName;
                supporter.FirstName = TrimTo(
                    req.DonorName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault(),
                    6);
            }

            if (!string.IsNullOrWhiteSpace(req.Phone))
                supporter.Phone = TrimTo(req.Phone, 17);

            if (!string.IsNullOrWhiteSpace(req.Email))
                supporter.Email = TrimTo(req.Email, 37);

            if (!string.IsNullOrWhiteSpace(req.Region))
                supporter.Region = TrimTo(req.Region, 8);

            if (!string.IsNullOrWhiteSpace(req.Country))
                supporter.Country = TrimTo(req.Country, 11);
        }

        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = donation.DonationId }, new DonationListDto
        {
            DonationId    = donation.DonationId,
            SupporterId   = donation.SupporterId,
            DisplayName   = supporter?.DisplayName ?? "",
            DonationType  = donation.DonationType,
            DonationDate  = donation.DonationDate,
            Amount        = donation.Amount,
            CurrencyCode  = donation.CurrencyCode,
            CampaignName  = donation.CampaignName,
            IsRecurring   = donation.IsRecurring,
            ChannelSource = donation.ChannelSource,
        });
    }

    // ── PUT /api/donations/{id} ───────────────────────────────────────────────
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Donation updated)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = await db.Donations.FindAsync(id);
        if (existing is null) return NotFound();

        updated.DonationId = id;
        db.Entry(existing).CurrentValues.SetValues(updated);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // ── DELETE /api/donations/{id} ────────────────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var donation = await db.Donations.FindAsync(id);
        if (donation is null) return NotFound();

        db.Donations.Remove(donation);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private bool IsAdminOrStaff() =>
        User.IsInRole("Admin") || User.IsInRole("Staff");

    private async Task<int?> ResolveDonorSupporterIdAsync()
    {
        // Use the identity user's SupporterId only — never trust the JWT supporterId claim alone,
        // and never merge an existing supporter row by email (that caused wrong donation totals).
        var user = await ResolveCurrentUserAsync();
        if (user == null)
            return null;

        if (user.SupporterId.HasValue)
            return user.SupporterId.Value;

        var supporter = new Supporter
        {
            SupporterType = null,
            DisplayName = TrimTo(user.DisplayName ?? user.Email ?? "Donor", 200) ?? "Donor",
            FirstName = null,
            LastName = null,
            RelationshipType = null,
            Region = null,
            Country = null,
            Email = string.IsNullOrWhiteSpace(user.Email) ? null : TrimTo(user.Email, 200),
            Phone = null,
            Status = null,
            // Legacy/Azure schemas often keep acquisition_channel NOT NULL — match SeedData ("Direct").
            AcquisitionChannel = "Direct",
            CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
        };

        await AssignManualKeyIfNeededAsync("supporters", "supporter_id", id => supporter.SupporterId = id);
        db.Supporters.Add(supporter);
        await db.SaveChangesAsync();

        user.SupporterId = supporter.SupporterId;
        await userManager.UpdateAsync(user);
        return supporter.SupporterId;
    }

    private async Task<AppUser?> ResolveCurrentUserAsync()
    {
        var user = await userManager.GetUserAsync(User);
        if (user != null)
            return user;

        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);

        if (!string.IsNullOrWhiteSpace(userId))
        {
            user = await userManager.FindByIdAsync(userId);
            if (user != null)
                return user;
        }

        var email =
            User.FindFirstValue(ClaimTypes.Email) ??
            User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email);

        if (!string.IsNullOrWhiteSpace(email))
            return await userManager.FindByEmailAsync(email);

        return null;
    }

    private static string? TrimTo(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return value;

        return value.Length <= maxLength ? value : value[..maxLength];
    }

    private async Task AssignManualKeyIfNeededAsync(string tableName, string columnName, Action<int> assignKey)
    {
        if (await ColumnIsIdentityAsync(tableName, columnName))
            return;

        assignKey(await GetNextIntKeyAsync(tableName, columnName));
    }

    private async Task<bool> ColumnIsIdentityAsync(string tableName, string columnName)
    {
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose)
            await connection.OpenAsync();

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText =
                $"SELECT CAST(COLUMNPROPERTY(OBJECT_ID('dbo.{tableName}'), '{columnName}', 'IsIdentity') AS int)";

            var result = await command.ExecuteScalarAsync();
            return result != null && result != DBNull.Value && Convert.ToInt32(result) == 1;
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    private async Task<int> GetNextIntKeyAsync(string tableName, string columnName)
    {
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose)
            await connection.OpenAsync();

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = $"SELECT ISNULL(MAX([{columnName}]), 0) + 1 FROM [dbo].[{tableName}]";

            var result = await command.ExecuteScalarAsync();
            return Convert.ToInt32(result);
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }
}

// ─── Supporters sub-resource ──────────────────────────────────────────────────
[ApiController]
[Route("api/supporters")]
[Authorize(Roles = "Admin,Staff")]
public class SupportersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var query = db.Supporters.AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(s => s.SupporterType == type);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(s => s.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(x =>
                x.DisplayName.ToLower().Contains(s) ||
                (x.Email != null && x.Email.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();
        var data  = await query
            .OrderBy(s => s.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, data });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var supporter = await db.Supporters
            .Include(s => s.Donations)
            .FirstOrDefaultAsync(s => s.SupporterId == id);

        if (supporter is null) return NotFound();
        return Ok(supporter);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Supporter supporter)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        supporter.CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
        db.Supporters.Add(supporter);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = supporter.SupporterId }, supporter);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Supporter updated)
    {
        var existing = await db.Supporters.FindAsync(id);
        if (existing is null) return NotFound();
        updated.SupporterId = id;
        updated.CreatedAt   = existing.CreatedAt;
        db.Entry(existing).CurrentValues.SetValues(updated);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var supporter = await db.Supporters.FindAsync(id);
        if (supporter is null) return NotFound();
        db.Supporters.Remove(supporter);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
public class DonationListDto
{
    public int DonationId { get; set; }
    public int SupporterId { get; set; }
    public string DisplayName { get; set; } = "";
    public string DonationType { get; set; } = "";
    public DateOnly DonationDate { get; set; }
    public decimal? Amount { get; set; }
    public string? CurrencyCode { get; set; }
    public string? CampaignName { get; set; }
    public bool IsRecurring { get; set; }
    public string? ChannelSource { get; set; }
}

public class CreateDonationRequest
{
    public int SupporterId { get; set; }
    [System.ComponentModel.DataAnnotations.Required]
    public string DonationType { get; set; } = "Monetary";
    public decimal? Amount { get; set; }
    public bool IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string? ChannelSource { get; set; }
    public string? Notes { get; set; }
    public string? DonorName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
}
