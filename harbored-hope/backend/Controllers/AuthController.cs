using HarboredHope.API.Data;
using HarboredHope.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HarboredHope.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    ITokenService tokenService,
    ILogger<AuthController> logger) : ControllerBase
{
    // ── POST /api/auth/login ──────────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await userManager.FindByEmailAsync(req.Email);
        if (user is null)
            return Unauthorized(new { message = "Invalid credentials." });

        var result = await signInManager.CheckPasswordSignInAsync(user, req.Password, lockoutOnFailure: true);

        if (result.IsLockedOut)
            return StatusCode(423, new { message = "Account locked. Try again in 15 minutes." });

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid credentials." });

        // If MFA is enabled, don't issue a full token yet — return mfaRequired flag
        if (await userManager.GetTwoFactorEnabledAsync(user))
        {
            return Ok(new LoginResponse
            {
                MfaRequired = true,
                UserId      = user.Id
            });
        }

        var token = await tokenService.GenerateTokenAsync(user);
        var roles = await userManager.GetRolesAsync(user);

        return Ok(new LoginResponse
        {
            Token       = token,
            Email       = user.Email,
            DisplayName = user.DisplayName,
            Roles       = [.. roles],
            MfaRequired = false
        });
    }

    // ── POST /api/auth/login/mfa ──────────────────────────────────────────────
    [HttpPost("login/mfa")]
    public async Task<IActionResult> LoginMfa([FromBody] MfaLoginRequest req)
    {
        var user = await userManager.FindByIdAsync(req.UserId);
        if (user is null) return Unauthorized(new { message = "Invalid session." });

        var isValid = await userManager.VerifyTwoFactorTokenAsync(
            user,
            userManager.Options.Tokens.AuthenticatorTokenProvider,
            req.Code);

        if (!isValid)
            return Unauthorized(new { message = "Invalid or expired MFA code." });

        var token = await tokenService.GenerateTokenAsync(user);
        var roles = await userManager.GetRolesAsync(user);

        return Ok(new LoginResponse
        {
            Token       = token,
            Email       = user.Email,
            DisplayName = user.DisplayName,
            Roles       = [.. roles],
            MfaRequired = false
        });
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = await userManager.FindByEmailAsync(req.Email);
        if (existing is not null)
            return Conflict(new { message = "An account with this email already exists." });

        var user = new AppUser
        {
            UserName       = req.Email,
            Email          = req.Email,
            DisplayName    = req.DisplayName,
            EmailConfirmed = true   // skip email confirmation for now
        };

        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        await userManager.AddToRoleAsync(user, "Donor");

        logger.LogInformation("New donor registered: {Email}", req.Email);

        return CreatedAtAction(nameof(Me), new { }, new { message = "Account created successfully." });
    }

    // ── GET /api/auth/me ──────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var roles = await userManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.DisplayName,
            user.SupporterId,
            user.TwoFactorEnabled,
            Roles = roles
        });
    }

    // ── GET /api/auth/mfa/setup ───────────────────────────────────────────────
    [Authorize]
    [HttpGet("mfa/setup")]
    public async Task<IActionResult> MfaSetup()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        await userManager.ResetAuthenticatorKeyAsync(user);
        var key = await userManager.GetAuthenticatorKeyAsync(user);
        var qrCodeUri = GenerateQrCodeUri(user.Email!, key!);

        return Ok(new { key, qrCodeUri });
    }

    // ── POST /api/auth/mfa/enable ─────────────────────────────────────────────
    [Authorize]
    [HttpPost("mfa/enable")]
    public async Task<IActionResult> MfaEnable([FromBody] MfaSetupRequest req)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var isValid = await userManager.VerifyTwoFactorTokenAsync(
            user,
            userManager.Options.Tokens.AuthenticatorTokenProvider,
            req.Code);

        if (!isValid)
            return BadRequest(new { message = "Invalid verification code. Check your authenticator app." });

        await userManager.SetTwoFactorEnabledAsync(user, true);
        user.IsMfaEnabled = true;
        await userManager.UpdateAsync(user);

        var recoveryCodes = await userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);

        return Ok(new
        {
            message = "MFA enabled successfully.",
            recoveryCodes   // Show once — user must save these
        });
    }

    // ── POST /api/auth/mfa/disable ────────────────────────────────────────────
    [Authorize]
    [HttpPost("mfa/disable")]
    public async Task<IActionResult> MfaDisable([FromBody] PasswordConfirmRequest req)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var passwordOk = await userManager.CheckPasswordAsync(user, req.Password);
        if (!passwordOk)
            return BadRequest(new { message = "Incorrect password." });

        await userManager.SetTwoFactorEnabledAsync(user, false);
        user.IsMfaEnabled = false;
        await userManager.UpdateAsync(user);

        return Ok(new { message = "MFA disabled." });
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    private static string GenerateQrCodeUri(string email, string key)
    {
        var encodedEmail = Uri.EscapeDataString(email);
        var encodedKey   = Uri.EscapeDataString(key);
        return $"otpauth://totp/HarboredHope:{encodedEmail}?secret={encodedKey}&issuer=HarboredHope&digits=6";
    }
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
public record LoginRequest(
    [property: System.ComponentModel.DataAnnotations.Required,
     property: System.ComponentModel.DataAnnotations.EmailAddress]
    string Email,
    [property: System.ComponentModel.DataAnnotations.Required]
    string Password);

public record RegisterRequest(
    [property: System.ComponentModel.DataAnnotations.Required,
     property: System.ComponentModel.DataAnnotations.EmailAddress]
    string Email,
    [property: System.ComponentModel.DataAnnotations.Required]
    string Password,
    [property: System.ComponentModel.DataAnnotations.Required]
    string DisplayName);

public record MfaLoginRequest(string UserId, string Code);
public record MfaSetupRequest(string Code);
public record PasswordConfirmRequest(string Password);

public class LoginResponse
{
    public string? Token       { get; set; }
    public string? Email       { get; set; }
    public string? DisplayName { get; set; }
    public List<string> Roles  { get; set; } = [];
    public bool MfaRequired    { get; set; }
    public string? UserId      { get; set; }
}
