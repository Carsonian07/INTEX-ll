using System.Net.Http.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/storytelling")]
[Authorize]
public class StorytellingController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpGet("time-period-summary")]
    public async Task<IActionResult> GetTimePeriodSummary([FromQuery] string start, [FromQuery] string end)
    {
        var client = httpClientFactory.CreateClient("StorytellingApi");
        var response = await client.GetAsync(
            $"api/time-period-summary?start={Uri.EscapeDataString(start)}&end={Uri.EscapeDataString(end)}");

        return await ProxyResponseAsync(response);
    }

    [HttpGet("supporter-impact/{supporterId:int}")]
    public async Task<IActionResult> GetSupporterImpact(int supporterId)
    {
        var client = httpClientFactory.CreateClient("StorytellingApi");
        var response = await client.GetAsync($"api/supporter-impact/{supporterId}");

        return await ProxyResponseAsync(response);
    }

    [HttpPost("projected-impact")]
    public async Task<IActionResult> GetProjectedImpact([FromBody] ProjectedImpactRequest request)
    {
        var client = httpClientFactory.CreateClient("StorytellingApi");
        var response = await client.PostAsJsonAsync("api/projected-impact", request);

        return await ProxyResponseAsync(response);
    }

    private static async Task<IActionResult> ProxyResponseAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/json";

        return new ContentResult
        {
            StatusCode = (int)response.StatusCode,
            Content = content,
            ContentType = contentType
        };
    }
}

public class ProjectedImpactRequest
{
    public decimal amount_php { get; set; }
    public string program_area { get; set; } = "";
}
