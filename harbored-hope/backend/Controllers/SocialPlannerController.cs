using System.Text;
using System.Text.Json;
using HarboredHope.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/social-planner")]
[Authorize(Roles = "Admin,Staff")]
public class SocialPlannerController(AppDbContext db, IHttpClientFactory httpClientFactory) : ControllerBase
{
    private const string MlApiBase = "https://harboredhope-ml-api.azurewebsites.net";

    // ── GET /api/social-planner/options ───────────────────────────────────────
    /// Returns distinct categorical values from the social_media_posts table,
    /// ordered by frequency descending, for populating planner dropdowns.
    [HttpGet("options")]
    public async Task<IActionResult> GetOptions()
    {
        var posts = await db.SocialMediaPosts.AsNoTracking().ToListAsync();

        if (posts.Count == 0)
            return Ok(new SocialPlannerOptions());

        static List<OptionCount> TopValues(IEnumerable<string?> values) =>
            values
                .Where(v => !string.IsNullOrWhiteSpace(v))
                .GroupBy(v => v!)
                .OrderByDescending(g => g.Count())
                .Select(g => new OptionCount(g.Key, g.Count()))
                .ToList();

        var options = new SocialPlannerOptions
        {
            Platforms       = TopValues(posts.Select(p => p.Platform)),
            DaysOfWeek      = TopValues(posts.Select(p => p.DayOfWeek)),
            PostTypes       = TopValues(posts.Select(p => p.PostType)),
            MediaTypes      = TopValues(posts.Select(p => p.MediaType)),
            ContentTopics   = TopValues(posts.Select(p => p.ContentTopic)),
            SentimentTones  = TopValues(posts.Select(p => p.SentimentTone)),
            CallToActionTypes = TopValues(posts.Select(p => p.CallToActionType)),
            CampaignNames   = TopValues(posts.Select(p => p.CampaignName)),
        };

        return Ok(options);
    }

    // ── POST /api/social-planner/predict/effective ────────────────────────────
    [HttpPost("predict/effective")]
    public Task<IActionResult> PredictEffective([FromBody] JsonElement body) =>
        ProxyToMl("/predict/social/planning/effective", body);

    // ── POST /api/social-planner/predict/engagement-rate ─────────────────────
    [HttpPost("predict/engagement-rate")]
    public Task<IActionResult> PredictEngagementRate([FromBody] JsonElement body) =>
        ProxyToMl("/predict/social/planning/engagement-rate", body);

    // ── POST /api/social-planner/predict/donation-value ──────────────────────
    [HttpPost("predict/donation-value")]
    public Task<IActionResult> PredictDonationValue([FromBody] JsonElement body) =>
        ProxyToMl("/predict/social/planning/donation-value", body);

    private async Task<IActionResult> ProxyToMl(string mlPath, JsonElement body)
    {
        var client = httpClientFactory.CreateClient();
        var content = new StringContent(body.GetRawText(), Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"{MlApiBase}{mlPath}", content);
        var json = await response.Content.ReadAsStringAsync();
        return Content(json, "application/json");
    }
}

public class SocialPlannerOptions
{
    public List<OptionCount> Platforms        { get; set; } = [];
    public List<OptionCount> DaysOfWeek       { get; set; } = [];
    public List<OptionCount> PostTypes        { get; set; } = [];
    public List<OptionCount> MediaTypes       { get; set; } = [];
    public List<OptionCount> ContentTopics    { get; set; } = [];
    public List<OptionCount> SentimentTones   { get; set; } = [];
    public List<OptionCount> CallToActionTypes { get; set; } = [];
    public List<OptionCount> CampaignNames    { get; set; } = [];
}

public record OptionCount(string Value, int Count);
