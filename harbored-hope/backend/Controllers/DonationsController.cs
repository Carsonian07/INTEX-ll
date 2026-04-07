using HarboredHope.API.Data;
using HarboredHope.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/donations")]
[Authorize]
public class DonationsController(AppDbContext db) : ControllerBase
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

        // Donors can only see their own donations
        if (User.IsInRole("Donor"))
        {
            var supporterIdClaim = User.FindFirst("supporterId")?.Value;
            if (!int.TryParse(supporterIdClaim, out var sid))
                return Forbid();
            query = query.Where(d => d.SupporterId == sid);
        }

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(d => d.DonationType == type);

        if (!string.IsNullOrWhiteSpace(campaign))
            query = query.Where(d => d.CampaignName == campaign);

        var total = await query.CountAsync();

        var donations = await query
            .OrderByDescending(d => d.DonationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DonationListDto
            {
                DonationId    = d.DonationId,
                SupporterId   = d.SupporterId,
                DisplayName   = d.Supporter.DisplayName,
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

        // Donors can only view their own
        if (User.IsInRole("Donor"))
        {
            var supporterIdClaim = User.FindFirst("supporterId")?.Value;
            if (!int.TryParse(supporterIdClaim, out var sid) || donation.SupporterId != sid)
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

        if (User.IsInRole("Donor"))
        {
            var claim = User.FindFirst("supporterId")?.Value;
            if (!int.TryParse(claim, out supporterId))
                return Forbid();
        }
        else
        {
            supporterId = req.SupporterId;
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
            CreatedAt     = DateTime.UtcNow
        };

        db.Donations.Add(donation);

        // Update supporter's first donation date if needed
        var supporter = await db.Supporters.FindAsync(supporterId);
        if (supporter is not null && supporter.FirstDonationDate is null)
        {
            supporter.FirstDonationDate = DateOnly.FromDateTime(DateTime.Today);
        }

        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = donation.DonationId }, donation);
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
        updated.CreatedAt  = existing.CreatedAt;
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
        supporter.CreatedAt = DateTime.UtcNow;
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
}
