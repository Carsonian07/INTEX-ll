using HarboredHope.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    private const decimal UsdToPhp = 56m;
    private static readonly DateOnly AprilCutoff = new(2026, 4, 1);

    // Reports historically treated stored donation Amount as PHP.
    // New donations (April 2026+) are being entered in USD, so convert those to PHP for reporting.
    private static decimal NormalizeDonationPhp(decimal amount, DateOnly donationDate)
        => donationDate >= AprilCutoff ? amount * UsdToPhp : amount;

    // ── GET /api/dashboard/public ─────────────────────────────────────────────
    // Unauthenticated — only aggregated, anonymized data
    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> PublicStats()
    {
        var totalGirlsServed  = await db.Residents.CountAsync();
        var activeResidents   = await db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var activeSafehouses  = await db.Safehouses.CountAsync(s => s.Status == "Active");
        var closedCases     = await db.Residents.CountAsync(r => r.CaseStatus == "Closed");
        var terminatedCases = await db.Residents.CountAsync(r => r.CaseStatus == "Terminated");
        var closedPlusTerminated = closedCases + terminatedCases;
        var reintegrationRate = closedPlusTerminated > 0
            ? Math.Round((double)closedCases / closedPlusTerminated * 100, 1)
            : 0;

        var avgEducation = await db.EducationRecords.AnyAsync()
            ? Math.Round(await db.EducationRecords.AverageAsync(e => (double)e.ProgressPercent), 1)
            : 0;

        var avgHealth = await db.HealthWellbeingRecords.AnyAsync(h => h.GeneralHealthScore.HasValue)
            ? Math.Round(await db.HealthWellbeingRecords
                .Where(h => h.GeneralHealthScore.HasValue)
                .AverageAsync(h => (double)h.GeneralHealthScore!.Value), 2)
            : 0;

        // EF can't translate our "April cutoff" normalization; pull raw values and compute in-memory.
        var currentYear = DateTime.Today.Year;
        var monetaryRows = await db.Donations
            .AsNoTracking()
            .Where(d => d.DonationType == "Monetary" && d.Amount.HasValue && d.DonationDate.Year == currentYear)
            .Select(d => new { d.Amount, d.DonationDate })
            .ToListAsync();

        var totalMonetaryPhp = monetaryRows.Sum(r => NormalizeDonationPhp(r.Amount!.Value, r.DonationDate));

        var totalSessions = await db.ProcessRecordings.CountAsync();
        var sessionsWithImprovement = await db.ProcessRecordings
            .CountAsync(r => r.ProgressNoted);
        var counselingImprovementRate = totalSessions > 0
            ? Math.Round((double)sessionsWithImprovement / totalSessions * 100, 1)
            : 0;

        return Ok(new
        {
            totalGirlsServed,
            activeResidents,
            activeSafehouses,
            reintegrationRate,
            avgEducationProgress     = avgEducation,
            avgHealthScore           = avgHealth,
            totalRaisedUsd           = Math.Round(totalMonetaryPhp / 56, 0),
            counselingImprovementRate
        });
    }

    // ── GET /api/dashboard/admin ──────────────────────────────────────────────
    [HttpGet("admin")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> AdminStats()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        var activeResidents     = await db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var criticalRisk        = await db.Residents.CountAsync(r => r.CurrentRiskLevel == "Critical" && r.CaseStatus == "Active");
        var highRisk            = await db.Residents.CountAsync(r => r.CurrentRiskLevel == "High" && r.CaseStatus == "Active");
        var recentDonationCount = await db.Donations.CountAsync(d => d.DonationDate >= monthStart);
        var recentDonationValueUsd = await db.Donations
            .Where(d => d.DonationType == "Monetary" && d.DonationDate >= monthStart && d.Amount.HasValue)
            .SumAsync(d => d.Amount!.Value);

        var upcomingConferences = await db.InterventionPlans
            .Where(p => p.CaseConferenceDate >= today && p.CaseConferenceDate <= today.AddDays(14))
            .Include(p => p.Resident)
            .OrderBy(p => p.CaseConferenceDate)
            .Take(5)
            .Select(p => new
            {
                p.PlanId,
                p.CaseConferenceDate,
                p.PlanCategory,
                residentCode = p.Resident.CaseControlNo,
                p.Resident.SafehouseId
            })
            .ToListAsync();

        var recentPastConferences = await db.InterventionPlans
            .Where(p => p.CaseConferenceDate < today && p.CaseConferenceDate >= today.AddDays(-365))
            .Include(p => p.Resident)
            .OrderByDescending(p => p.CaseConferenceDate)
            .Take(5)
            .Select(p => new
            {
                p.PlanId,
                p.CaseConferenceDate,
                p.PlanCategory,
                residentCode = p.Resident.CaseControlNo,
                p.Resident.SafehouseId
            })
            .ToListAsync();

        var recentIncidents = await db.IncidentReports
            .Where(i => i.IncidentDate >= today.AddDays(-7) && !i.Resolved)
            .Include(i => i.Safehouse)
            .OrderByDescending(i => i.IncidentDate)
            .Take(10)
            .Select(i => new
            {
                i.IncidentId,
                i.IncidentDate,
                i.IncidentType,
                i.Severity,
                safehouseName = i.Safehouse.Name
            })
            .ToListAsync();

        var pastIncidents = await db.IncidentReports
            .Where(i => i.IncidentDate >= today.AddDays(-60) && i.IncidentDate < today.AddDays(-7))
            .Include(i => i.Safehouse)
            .OrderByDescending(i => i.IncidentDate)
            .Take(10)
            .Select(i => new
            {
                i.IncidentId,
                i.IncidentDate,
                i.IncidentType,
                i.Severity,
                i.Resolved,
                safehouseName = i.Safehouse.Name
            })
            .ToListAsync();

        var safehouseOverview = await db.Safehouses
            .Where(s => s.Status == "Active")
            .Select(s => new
            {
                s.SafehouseId,
                s.Name,
                s.Region,
                s.CurrentOccupancy,
                s.CapacityGirls,
                occupancyPct = s.CapacityGirls > 0
                    ? Math.Round((double)s.CurrentOccupancy / s.CapacityGirls * 100, 1)
                    : 0
            })
            .ToListAsync();

        return Ok(new
        {
            activeResidents,
            criticalRisk,
            highRisk,
            recentDonationCount,
            recentDonationValue = Math.Round(recentDonationValueUsd, 2),
            upcomingConferences,
            recentPastConferences,
            recentIncidents,
            pastIncidents,
            safehouseOverview
        });
    }

    // ── GET /api/dashboard/reports ────────────────────────────────────────────
    [HttpGet("reports")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Reports(
        [FromQuery] int months = 12,
        [FromQuery] int? safehouseId = null)
    {
        var cutoff = DateOnly.FromDateTime(DateTime.Today.AddMonths(-months));

        // Donation trends by month (computed in-memory; see note above)
        var donationRows = await db.Donations
            .AsNoTracking()
            .Where(d => d.DonationType == "Monetary" && d.DonationDate >= cutoff && d.Amount.HasValue)
            .Select(d => new { d.Amount, d.DonationDate, d.CampaignName })
            .ToListAsync();

        var donationTrends = donationRows
            .GroupBy(d => new { d.DonationDate.Year, d.DonationDate.Month })
            .Select(g => new
            {
                year  = g.Key.Year,
                month = g.Key.Month,
                total = g.Sum(d => NormalizeDonationPhp(d.Amount!.Value, d.DonationDate)),
                count = g.Count()
            })
            .OrderBy(x => x.year).ThenBy(x => x.month)
            .ToList();

        var donationByCampaign = donationRows
            .GroupBy(d => string.IsNullOrWhiteSpace(d.CampaignName) ? "No campaign" : d.CampaignName)
            .Select(g => new
            {
                campaign = g.Key,
                total    = g.Sum(d => NormalizeDonationPhp(d.Amount!.Value, d.DonationDate)),
                count    = g.Count()
            })
            .OrderByDescending(x => x.total)
            .ToList();

        // Education progress over time
        var educationQuery = db.EducationRecords
            .Where(e => e.RecordDate >= cutoff);
        if (safehouseId.HasValue)
            educationQuery = educationQuery.Where(e =>
                db.Residents.Any(r => r.ResidentId == e.ResidentId && r.SafehouseId == safehouseId.Value));

        var educationTrends = await educationQuery
            .GroupBy(e => new { e.RecordDate.Year, e.RecordDate.Month })
            .Select(g => new
            {
                year  = g.Key.Year,
                month = g.Key.Month,
                avgProgress = Math.Round(g.Average(e => (double)e.ProgressPercent), 1)
            })
            .OrderBy(x => x.year).ThenBy(x => x.month)
            .ToListAsync();

        // Health trends
        var healthTrends = await db.HealthWellbeingRecords
            .Where(h => h.RecordDate >= cutoff
                     && h.GeneralHealthScore != null
                     && h.NutritionScore != null)
            .GroupBy(h => new { h.RecordDate.Year, h.RecordDate.Month })
            .Select(g => new
            {
                year         = g.Key.Year,
                month        = g.Key.Month,
                avgHealth    = Math.Round(g.Average(h => (double)h.GeneralHealthScore!.Value), 2),
                avgNutrition = Math.Round(g.Average(h => (double)h.NutritionScore!.Value), 2)
            })
            .OrderBy(x => x.year).ThenBy(x => x.month)
            .ToListAsync();

        // Reintegration outcomes
        var reintegrationOutcomes = await db.Residents
            .Where(r => r.ReintegrationStatus != null && r.ReintegrationStatus != "Not Started")
            .GroupBy(r => new { r.ReintegrationStatus, r.ReintegrationType })
            .Select(g => new { g.Key.ReintegrationStatus, g.Key.ReintegrationType, count = g.Count() })
            .ToListAsync();

        // Safehouse performance — base metrics from monthly summaries
        var safehouseBase = await db.SafehouseMonthlyMetrics
            .Where(m => m.MonthStart >= cutoff)
            .GroupBy(m => m.SafehouseId)
            .Select(g => new
            {
                safehouseId        = g.Key,
                safehouseName      = db.Safehouses.Where(s => s.SafehouseId == g.Key).Select(s => s.Name).FirstOrDefault() ?? "",
                avgEducation       = Math.Round(g.Average(m => (double)(m.AvgEducationProgress ?? 0m)), 1),
                totalIncidents     = g.Sum(m => m.IncidentCount),
                avgActiveResidents = Math.Round(g.Average(m => (double)m.ActiveResidents), 1)
            })
            .ToListAsync();

        // Health score computed directly from HealthWellbeingRecords (same source as healthTrends)
        var healthBySafehouse = await db.HealthWellbeingRecords
            .Where(h => h.RecordDate >= cutoff && h.GeneralHealthScore != null)
            .Join(db.Residents,
                h => h.ResidentId,
                r => r.ResidentId,
                (h, r) => new { r.SafehouseId, Score = (double)h.GeneralHealthScore!.Value })
            .GroupBy(x => x.SafehouseId)
            .Select(g => new { safehouseId = g.Key, avgHealth = Math.Round(g.Average(x => x.Score), 2) })
            .ToListAsync();

        var healthLookup = healthBySafehouse.ToDictionary(x => x.safehouseId, x => x.avgHealth);

        var safehousePerformance = safehouseBase.Select(s => new
        {
            s.safehouseId,
            s.safehouseName,
            s.avgEducation,
            avgHealth          = healthLookup.TryGetValue(s.safehouseId, out var h) ? h : 0.0,
            s.totalIncidents,
            s.avgActiveResidents
        }).ToList();

        return Ok(new
        {
            donationTrends,
            donationByCampaign,
            educationTrends,
            healthTrends,
            reintegrationOutcomes,
            safehousePerformance
        });
    }
}
