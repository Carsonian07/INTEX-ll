using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HarboredHope.API.Controllers;

/// <summary>
/// Stub ML endpoints — replace with real model calls once Python pipelines are built.
/// Each endpoint currently returns mock data with the correct shape.
/// </summary>
[ApiController]
[Route("api/ml")]
[Authorize(Roles = "Admin,Staff")]
public class MlController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    private const string MlApiBase = "https://harboredhope-ml-api.azurewebsites.net";

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
