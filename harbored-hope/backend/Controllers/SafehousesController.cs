using HarboredHope.API.Data;
using HarboredHope.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/safehouses")]
[Authorize]
public class SafehousesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = db.Safehouses.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(s => s.Status == status);

        return Ok(await query.OrderBy(s => s.SafehouseCode).ToListAsync());
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetById(int id)
    {
        var safehouse = await db.Safehouses
            .Include(s => s.MonthlyMetrics.OrderByDescending(m => m.MonthStart).Take(12))
            .FirstOrDefaultAsync(s => s.SafehouseId == id);

        if (safehouse is null) return NotFound();
        return Ok(safehouse);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Safehouse safehouse)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        db.Safehouses.Add(safehouse);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = safehouse.SafehouseId }, safehouse);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Safehouse updated)
    {
        var existing = await db.Safehouses.FindAsync(id);
        if (existing is null) return NotFound();
        updated.SafehouseId = id;
        db.Entry(existing).CurrentValues.SetValues(updated);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var safehouse = await db.Safehouses.FindAsync(id);
        if (safehouse is null) return NotFound();
        // Soft delete — just mark inactive
        safehouse.Status = "Inactive";
        await db.SaveChangesAsync();
        return NoContent();
    }
}
