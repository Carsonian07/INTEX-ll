using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HarboredHope.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HarboredHope.API.Controllers;

/// <summary>
/// Stub ML endpoints — replace with real model calls once Python pipelines are built.
/// Each endpoint currently returns mock data with the correct shape.
/// </summary>
[ApiController]
[Route("api/ml")]
[Authorize(Roles = "Admin,Staff")]
public class MlController(IHttpClientFactory httpClientFactory, AppDbContext db) : ControllerBase
{
    private const string MlApiBase = "https://harboredhope-ml-api.azurewebsites.net";

    private static readonly JsonSerializerOptions CamelCase = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    // ── POST /api/ml/donor-predictions ───────────────────────────────────────
    /// Batch: accepts up to 25 supporter IDs, computes early-donation stats,
    /// calls /predict/donor/ltv and /predict/donor/retention for each,
    /// returns a map of supporterId → { ltv, retention }.
    [HttpPost("donor-predictions")]
    public async Task<IActionResult> DonorPredictions([FromBody] List<int> supporterIds)
    {
        if (supporterIds is null || supporterIds.Count == 0)
            return BadRequest("No supporter IDs provided.");

        // Load supporters + their donations in one query
        var supporters = await db.Supporters
            .AsNoTracking()
            .Where(s => supporterIds.Contains(s.SupporterId))
            .ToListAsync();

        var donations = await db.Donations
            .AsNoTracking()
            .Where(d => supporterIds.Contains(d.SupporterId))
            .OrderBy(d => d.DonationDate)
            .ToListAsync();

        var donationsBySup = donations
            .GroupBy(d => d.SupporterId)
            .ToDictionary(g => g.Key, g => g.OrderBy(d => d.DonationDate).ToList());

        var client = httpClientFactory.CreateClient();
        var tasks = supporters.Select(async sup =>
        {
            var supDonations = donationsBySup.TryGetValue(sup.SupporterId, out var d) ? d : [];

            // "Early" = first 3 monetary donations with a known amount
            var early = supDonations
                .Where(d => d.EstimatedValue > 0)
                .Take(3)
                .ToList();

            var amounts = early.Select(d => (double)(d.EstimatedValue ?? 0)).ToList();
            var first   = supDonations.FirstOrDefault();
            var second  = supDonations.Skip(1).FirstOrDefault();

            double earlyAmountSum    = amounts.Sum();
            double earlyAmountMean   = amounts.Count > 0 ? amounts.Average() : 0;
            double earlyAmountStd    = amounts.Count > 1
                ? Math.Sqrt(amounts.Select(a => Math.Pow(a - earlyAmountMean, 2)).Sum() / (amounts.Count - 1))
                : 0;
            double earlyAmountMax    = amounts.Count > 0 ? amounts.Max() : 0;
            double earlyAmountMin    = amounts.Count > 0 ? amounts.Min() : 0;
            double firstAmount       = amounts.Count > 0 ? amounts[0] : 0;
            int    gapDays           = (first != null && second != null)
                ? (second.DonationDate.ToDateTime(TimeOnly.MinValue) - first.DonationDate.ToDateTime(TimeOnly.MinValue)).Days
                : 0;

            var payload = new
            {
                supporter_type           = sup.SupporterType,
                relationship_type        = sup.RelationshipType,
                region                   = sup.Region,
                country                  = sup.Country,
                status                   = sup.Status,
                acquisition_channel      = sup.AcquisitionChannel,
                early_donation_count     = early.Count,
                early_amount_sum         = earlyAmountSum,
                early_amount_mean        = earlyAmountMean,
                early_amount_std         = earlyAmountStd,
                early_amount_max         = earlyAmountMax,
                early_amount_min         = earlyAmountMin,
                early_amount_per_donation= early.Count > 0 ? earlyAmountSum / early.Count : 0,
                gap_first_to_second_days = gapDays,
                early_channel_nunique    = early.Select(d => d.ChannelSource).Where(c => c != null).Distinct().Count(),
                early_campaign_nunique   = early.Select(d => d.CampaignName).Where(c => c != null).Distinct().Count(),
                early_is_recurring_any   = early.Any(d => d.IsRecurring) ? 1 : 0,
                log_early_amount_sum     = earlyAmountSum > 0 ? Math.Log(earlyAmountSum) : 0,
                log_first_amount         = firstAmount > 0 ? Math.Log(firstAmount) : 0,
                donation_type            = first?.DonationType,
                is_recurring             = first?.IsRecurring ?? false,
                campaign_name            = first?.CampaignName,
                channel_source           = first?.ChannelSource,
                currency_code            = first?.CurrencyCode,
                first_donation_month     = first?.DonationDate.Month ?? 0,
                first_donation_dow       = first != null ? (int)first.DonationDate.ToDateTime(TimeOnly.MinValue).DayOfWeek : 0,
            };

            var json = JsonSerializer.Serialize(payload);

            // Call both endpoints in parallel
            var ltvTask = client.PostAsync($"{MlApiBase}/predict/donor/ltv",       new StringContent(json, Encoding.UTF8, "application/json"));
            var retTask = client.PostAsync($"{MlApiBase}/predict/donor/retention", new StringContent(json, Encoding.UTF8, "application/json"));
            await Task.WhenAll(ltvTask, retTask);
            var ltvResp = ltvTask.Result;
            var retResp = retTask.Result;

            var ltvJson = await ltvResp.Content.ReadAsStringAsync();
            var retJson = await retResp.Content.ReadAsStringAsync();

            using var ltvDoc = JsonDocument.Parse(ltvJson);
            using var retDoc = JsonDocument.Parse(retJson);

            return new
            {
                supporterId = sup.SupporterId,
                ltv = new
                {
                    probability = ltvDoc.RootElement.TryGetProperty("probability", out var lp) ? lp.GetDouble() : 0,
                    prediction  = ltvDoc.RootElement.TryGetProperty("prediction",  out var li) ? li.GetInt32()  : 0,
                },
                retention = new
                {
                    probability = retDoc.RootElement.TryGetProperty("probability", out var rp) ? rp.GetDouble() : 0,
                    prediction  = retDoc.RootElement.TryGetProperty("prediction",  out var ri) ? ri.GetInt32()  : 0,
                },
            };
        });

        var results = await Task.WhenAll(tasks);
        return Ok(results);
    }

    // ── POST /api/ml/resident-risk ────────────────────────────────────────────
    /// Proxies to the external ML API — avoids CORS preflight from the browser.
    [HttpPost("resident-risk")]
    public async Task<IActionResult> ResidentRisk([FromBody] JsonElement body)
    {
        var client = httpClientFactory.CreateClient();
        var content = new StringContent(body.GetRawText(), Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"{MlApiBase}/predict/resident/risk", content);
        var json = await response.Content.ReadAsStringAsync();
        return Content(json, "application/json");
    }

    // ── POST /api/ml/reintegration-readiness ──────────────────────────────────
    /// Predicts whether a resident is ready for reintegration.
    /// Input: residentId. Output: score 0-1, label, top features.
    [HttpGet("reintegration-readiness/{residentId:int}")]
    public IActionResult ReintegrationReadiness(int residentId)
    {
        // TODO: Call deployed Python model API / Azure ML endpoint
        // Stub: returns placeholder prediction
        return Ok(new
        {
            residentId,
            readinessScore = 0.72,
            label          = "Likely Ready",
            confidence     = 0.81,
            topFeatures = new[]
            {
                new { feature = "Education progress",   importance = 0.34 },
                new { feature = "Health score trend",   importance = 0.28 },
                new { feature = "Session consistency",  importance = 0.21 },
                new { feature = "Risk level reduction", importance = 0.17 }
            },
            note = "STUB — replace with live model endpoint"
        });
    }

    // ── GET /api/ml/donor-churn-risk ──────────────────────────────────────────
    /// Returns donors flagged as at-risk of lapsing.
    [HttpGet("donor-churn-risk")]
    public IActionResult DonorChurnRisk()
    {
        // TODO: Run donor churn classifier
        return Ok(new
        {
            asOf = DateTime.UtcNow,
            atRiskDonors = new[]
            {
                new { supporterId = 1, displayName = "Sample Donor A", churnProbability = 0.84, daysSinceLastDonation = 180 },
                new { supporterId = 2, displayName = "Sample Donor B", churnProbability = 0.71, daysSinceLastDonation = 120 }
            },
            note = "STUB — replace with live model endpoint"
        });
    }

    // ── GET /api/ml/social-media-recommendations ──────────────────────────────
    /// Recommends best posting time, platform, and content type.
    [HttpGet("social-media-recommendations")]
    public IActionResult SocialMediaRecommendations()
    {
        // TODO: Run social media optimization model
        return Ok(new
        {
            bestPlatform    = "Facebook",
            bestDayOfWeek   = "Tuesday",
            bestHour        = 19,
            bestContentType = "ImpactStory",
            bestMediaType   = "Photo",
            expectedEngagementRate  = 0.048,
            expectedDonationReferrals = 3.2,
            note = "STUB — replace with live model endpoint"
        });
    }

    // ── GET /api/ml/resident-risk-flags ──────────────────────────────────────
    /// Returns residents flagged as high-risk or regressing.
    [HttpGet("resident-risk-flags")]
    public IActionResult ResidentRiskFlags()
    {
        // TODO: Run resident risk regression model
        return Ok(new
        {
            asOf = DateTime.UtcNow,
            flaggedResidents = new[]
            {
                new { residentId = 1, internalCode = "RES-001", riskFlag = "Declining health score", severity = "High" },
                new { residentId = 2, internalCode = "RES-002", riskFlag = "Missed counseling sessions", severity = "Medium" }
            },
            note = "STUB — replace with live model endpoint"
        });
    }
}
