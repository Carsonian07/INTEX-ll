using HarboredHope.API.Data;
using HarboredHope.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/residents")]
[Authorize]
public class ResidentsController(AppDbContext db) : ControllerBase
{
    // ── GET /api/residents ────────────────────────────────────────────────────
    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] int? safehouseId,
        [FromQuery] string? caseCategory,
        [FromQuery] string? riskLevel,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var query = db.Residents
            .Include(r => r.Safehouse)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.CaseStatus == status);

        if (safehouseId.HasValue)
            query = query.Where(r => r.SafehouseId == safehouseId.Value);

        if (!string.IsNullOrWhiteSpace(caseCategory))
            query = query.Where(r => r.CaseCategory == caseCategory);

        if (!string.IsNullOrWhiteSpace(riskLevel))
            query = query.Where(r => r.CurrentRiskLevel == riskLevel);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(r =>
                r.CaseControlNo.ToLower().Contains(s) ||
                r.InternalCode.ToLower().Contains(s)  ||
                (r.AssignedSocialWorker != null && r.AssignedSocialWorker.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();

        var residents = await query
            .OrderByDescending(r => r.DateOfAdmission)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ResidentListDto
            {
                ResidentId          = r.ResidentId,
                CaseControlNo       = r.CaseControlNo,
                InternalCode        = r.InternalCode,
                CaseStatus          = r.CaseStatus,
                CaseCategory        = r.CaseCategory,
                DateOfAdmission     = r.DateOfAdmission,
                CurrentRiskLevel    = r.CurrentRiskLevel,
                ReintegrationStatus = r.ReintegrationStatus,
                SafehouseName       = r.Safehouse.Name,
                SafehouseId         = r.SafehouseId,
                AssignedSocialWorker = r.AssignedSocialWorker
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, data = residents });
    }

    // ── GET /api/residents/{id} ───────────────────────────────────────────────
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetById(int id)
    {
        var resident = await db.Residents
            .Include(r => r.Safehouse)
            .FirstOrDefaultAsync(r => r.ResidentId == id);

        if (resident is null) return NotFound();
        return Ok(resident);
    }

    // ── POST /api/residents ───────────────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create([FromBody] Resident resident)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Sanitize free-text fields
        resident.SessionNarrative_Sanitize();

        resident.CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
        db.Residents.Add(resident);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = resident.ResidentId }, resident);
    }

    // ── PUT /api/residents/{id} ───────────────────────────────────────────────
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Update(int id, [FromBody] Resident updated)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = await db.Residents.FindAsync(id);
        if (existing is null) return NotFound();

        // Copy updatable fields (never overwrite PK or CreatedAt)
        updated.ResidentId = id;
        updated.CreatedAt  = existing.CreatedAt;
        db.Entry(existing).CurrentValues.SetValues(updated);

        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/residents/{id} ────────────────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var resident = await db.Residents.FindAsync(id);
        if (resident is null) return NotFound();

        db.Residents.Remove(resident);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── GET /api/residents/{id}/process-recordings ────────────────────────────
    [HttpGet("{id:int}/process-recordings")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetProcessRecordings(int id)
    {
        var recordings = await db.ProcessRecordings
            .Where(p => p.ResidentId == id)
            .OrderByDescending(p => p.SessionDate)
            .ToListAsync();

        return Ok(recordings);
    }

    // ── POST /api/residents/{id}/process-recordings ───────────────────────────
    [HttpPost("{id:int}/process-recordings")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> AddProcessRecording(int id, [FromBody] ProcessRecording recording)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (!await db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound();

        recording.ResidentId = id;
        db.ProcessRecordings.Add(recording);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProcessRecordings), new { id }, recording);
    }

    // ── GET /api/residents/{id}/home-visitations ──────────────────────────────
    [HttpGet("{id:int}/home-visitations")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetHomeVisitations(int id)
    {
        var visits = await db.HomeVisitations
            .Where(v => v.ResidentId == id)
            .OrderByDescending(v => v.VisitDate)
            .ToListAsync();

        return Ok(visits);
    }

    // ── POST /api/residents/{id}/home-visitations ─────────────────────────────
    [HttpPost("{id:int}/home-visitations")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> AddHomeVisitation(int id, [FromBody] HomeVisitation visit)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (!await db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound();

        visit.ResidentId = id;
        db.HomeVisitations.Add(visit);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHomeVisitations), new { id }, visit);
    }

    // ── GET /api/residents/{id}/intervention-plans ────────────────────────────
    [HttpGet("{id:int}/intervention-plans")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetInterventionPlans(int id)
    {
        var plans = await db.InterventionPlans
            .Where(p => p.ResidentId == id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(plans);
    }

    // ── POST /api/residents/{id}/intervention-plans ───────────────────────────
    [HttpPost("{id:int}/intervention-plans")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> AddInterventionPlan(int id, [FromBody] InterventionPlan plan)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (!await db.Residents.AnyAsync(r => r.ResidentId == id))
            return NotFound();

        plan.ResidentId = id;
        plan.CreatedAt  = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
        plan.UpdatedAt  = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
        db.InterventionPlans.Add(plan);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInterventionPlans), new { id }, plan);
    }
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
public class ResidentListDto
{
    public int ResidentId { get; set; }
    public string CaseControlNo { get; set; } = "";
    public string InternalCode { get; set; } = "";
    public string CaseStatus { get; set; } = "";
    public string CaseCategory { get; set; } = "";
    public DateOnly DateOfAdmission { get; set; }
    public string CurrentRiskLevel { get; set; } = "";
    public string? ReintegrationStatus { get; set; }
    public string SafehouseName { get; set; } = "";
    public int SafehouseId { get; set; }
    public string? AssignedSocialWorker { get; set; }
}

// ─── Extension for sanitization ───────────────────────────────────────────────
public static class ResidentExtensions
{
    public static void SessionNarrative_Sanitize(this Resident r)
    {
        // Strip HTML tags from free-text fields to prevent XSS injection
        r.InitialCaseAssessment = Sanitize(r.InitialCaseAssessment);
        r.ReferringAgencyPerson = Sanitize(r.ReferringAgencyPerson);
        r.AssignedSocialWorker  = Sanitize(r.AssignedSocialWorker);
    }

    private static string? Sanitize(string? input)
    {
        if (input is null) return null;
        return System.Text.RegularExpressions.Regex.Replace(input, "<.*?>", string.Empty).Trim();
    }
}
