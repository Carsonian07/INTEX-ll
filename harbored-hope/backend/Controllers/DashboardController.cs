using HarboredHope.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    // ── GET /api/dashboard/public ─────────────────────────────────────────────
    // Unauthenticated — only aggregated, anonymized data
    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> PublicStats()
    {
        var totalGirlsServed  = await db.Residents.CountAsync();
        var activeResidents   = await db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var activeSafehouses  = await db.Safehouses.CountAsync(s => s.Status == "Active");
        var reintegrated      = await db.Residents.CountAsync(r => r.ReintegrationStatus == "Completed");
        var totalResidents    = await db.Residents.CountAsync(r =>
            r.ReintegrationStatus != null && r.ReintegrationStatus != "Not Started");
        var reintegrationRate = totalResidents > 0
            ? Math.Round((double)reintegrated / totalResidents * 100, 1)
            : 0;

        var latestMetrics = await db.SafehouseMonthlyMetrics
            .OrderByDescending(m => m.MonthStart)
            .Take(7)
            .ToListAsync();

        var avgEducation = latestMetrics.Any(m => m.AvgEducationProgress.HasValue)
            ? Math.Round(latestMetrics.Where(m => m.AvgEducationProgress.HasValue).Average(m => (double)m.AvgEducationProgress!.Value), 1)
            : 0;

        var avgHealth = latestMetrics.Any(m => m.AvgHealthScore.HasValue)
            ? Math.Round(latestMetrics.Where(m => m.AvgHealthScore.HasValue).Average(m => (double)m.AvgHealthScore!.Value), 2)
            : 0;

        var totalMonetary = await db.Donations
            .Where(d => d.DonationType == "Monetary" && d.Amount.HasValue)
            .SumAsync(d => d.Amount!.Value);

        return Ok(new
        {
            totalGirlsServed,
            activeResidents,
            activeSafehouses,
            reintegrationRate,
            avgEducationProgress = avgEducation,
            avgHealthScore       = avgHealth,
            totalRaisedUsd       = Math.Round(totalMonetary / 56, 0) // rough PHP→USD
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
        var recentDonationValue = await db.Donations
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
            recentDonationValue,
            upcomingConferences,
            recentIncidents,
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

        // Donation trends by month
        var donationTrends = await db.Donations
            .Where(d => d.DonationType == "Monetary" && d.DonationDate >= cutoff && d.Amount.HasValue)
            .GroupBy(d => new { d.DonationDate.Year, d.DonationDate.Month })
            .Select(g => new
            {
                year   = g.Key.Year,
                month  = g.Key.Month,
                total  = g.Sum(d => d.Amount!.Value),
                count  = g.Count()
            })
            .OrderBy(x => x.year).ThenBy(x => x.month)
            .ToListAsync();

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

        // Safehouse performance comparison
        var safehousePerformance = await db.SafehouseMonthlyMetrics
            .Where(m => m.MonthStart >= cutoff)
            .GroupBy(m => m.SafehouseId)
            .Select(g => new
            {
                safehouseId       = g.Key,
                avgEducation      = Math.Round(g.Average(m => (double)(m.AvgEducationProgress ?? 0m)), 1),
                avgHealth         = Math.Round(g.Average(m => (double)(m.AvgHealthScore ?? 0m)), 2),
                totalIncidents    = g.Sum(m => m.IncidentCount),
                avgActiveResidents = Math.Round(g.Average(m => (double)m.ActiveResidents), 1)
            })
            .ToListAsync();

        return Ok(new
        {
            donationTrends,
            educationTrends,
            healthTrends,
            reintegrationOutcomes,
            safehousePerformance
        });
    }
}
