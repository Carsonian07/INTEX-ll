using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HarboredHope.API.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace HarboredHope.API.Services;

public interface ITokenService
{
    Task<string> GenerateTokenAsync(AppUser user);
}

public class TokenService(
    IConfiguration config,
    UserManager<AppUser> userManager) : ITokenService
{
    public async Task<string> GenerateTokenAsync(AppUser user)
    {
        var roles = await userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   user.Id),
            new(ClaimTypes.NameIdentifier,     user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(ClaimTypes.Email,              user.Email ?? ""),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new(ClaimTypes.Name,               user.DisplayName ?? user.UserName ?? ""),
            new("displayName", user.DisplayName ?? user.UserName ?? ""),
        };

        if (user.SupporterId.HasValue)
            claims.Add(new("supporterId", user.SupporterId.Value.ToString()));

        foreach (var role in roles)
            claims.Add(new(ClaimTypes.Role, role));

        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(8);

        var token = new JwtSecurityToken(
            issuer:             config["Jwt:Issuer"],
            audience:           config["Jwt:Audience"],
            claims:             claims,
            expires:            expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
