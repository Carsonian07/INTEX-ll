using HarboredHope.API.Data;
using HarboredHope.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace HarboredHope.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(req.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid credentials." });

            var result = await _signInManager.CheckPasswordSignInAsync(user, req.Password, true);

            if (result.IsLockedOut)
                return StatusCode(423, new { message = "Account locked. Try again in 15 minutes." });

            if (!result.Succeeded)
                return Unauthorized(new { message = "Invalid credentials." });

            if (await _userManager.GetTwoFactorEnabledAsync(user))
            {
                return Ok(new LoginResponse
                {
                    MfaRequired = true,
                    UserId = user.Id
                });
            }

            var token = await _tokenService.GenerateTokenAsync(user);
            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new LoginResponse
            {
                Token = token,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Roles = roles.ToList(),
                MfaRequired = false
            });
        }

        [HttpPost("login/mfa")]
        public async Task<IActionResult> LoginMfa([FromBody] MfaLoginRequest req)
        {
            var user = await _userManager.FindByIdAsync(req.UserId);
            if (user == null)
                return Unauthorized(new { message = "Invalid session." });

            var isValid = await _userManager.VerifyTwoFactorTokenAsync(
                user,
                _userManager.Options.Tokens.AuthenticatorTokenProvider,
                req.Code);

            if (!isValid)
                return Unauthorized(new { message = "Invalid or expired MFA code." });

            var token = await _tokenService.GenerateTokenAsync(user);
            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new LoginResponse
            {
                Token = token,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Roles = roles.ToList(),
                MfaRequired = false
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existing = await _userManager.FindByEmailAsync(req.Email);
            if (existing != null)
                return Conflict(new { message = "An account with this email already exists." });

            var user = new AppUser
            {
                UserName = req.Email,
                Email = req.Email,
                DisplayName = req.DisplayName,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, req.Password);
            if (!result.Succeeded)
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            await _userManager.AddToRoleAsync(user, "Donor");

            _logger.LogInformation("New donor registered: {Email}", req.Email);

            return CreatedAtAction(nameof(Me), new { }, new { message = "Account created successfully." });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);

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

        [Authorize]
        [HttpGet("mfa/setup")]
        public async Task<IActionResult> MfaSetup()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            await _userManager.ResetAuthenticatorKeyAsync(user);
            var key = await _userManager.GetAuthenticatorKeyAsync(user);
            var qrCodeUri = GenerateQrCodeUri(user.Email, key);

            return Ok(new { key, qrCodeUri });
        }

        [Authorize]
        [HttpPost("mfa/enable")]
        public async Task<IActionResult> MfaEnable([FromBody] MfaSetupRequest req)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var isValid = await _userManager.VerifyTwoFactorTokenAsync(
                user,
                _userManager.Options.Tokens.AuthenticatorTokenProvider,
                req.Code);

            if (!isValid)
                return BadRequest(new { message = "Invalid verification code. Check your authenticator app." });

            await _userManager.SetTwoFactorEnabledAsync(user, true);
            user.IsMfaEnabled = true;
            await _userManager.UpdateAsync(user);

            var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);

            return Ok(new
            {
                message = "MFA enabled successfully.",
                recoveryCodes = recoveryCodes
            });
        }

        [Authorize]
        [HttpPost("mfa/disable")]
        public async Task<IActionResult> MfaDisable([FromBody] PasswordConfirmRequest req)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var passwordOk = await _userManager.CheckPasswordAsync(user, req.Password);
            if (!passwordOk)
                return BadRequest(new { message = "Incorrect password." });

            await _userManager.SetTwoFactorEnabledAsync(user, false);
            user.IsMfaEnabled = false;
            await _userManager.UpdateAsync(user);

            return Ok(new { message = "MFA disabled." });
        }

        private static string GenerateQrCodeUri(string email, string key)
        {
            var encodedEmail = Uri.EscapeDataString(email ?? "");
            var encodedKey = Uri.EscapeDataString(key ?? "");
            return "otpauth://totp/HarboredHope:" + encodedEmail
                + "?secret=" + encodedKey
                + "&issuer=HarboredHope&digits=6";
        }
    }

    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = "";

        [Required]
        public string Password { get; set; } = "";
    }

    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = "";

        [Required]
        public string Password { get; set; } = "";

        [Required]
        public string DisplayName { get; set; } = "";
    }

    public class MfaLoginRequest
    {
        public string UserId { get; set; } = "";
        public string Code { get; set; } = "";
    }

    public class MfaSetupRequest
    {
        public string Code { get; set; } = "";
    }

    public class PasswordConfirmRequest
    {
        public string Password { get; set; } = "";
    }

    public class LoginResponse
    {
        public string? Token { get; set; }
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public bool MfaRequired { get; set; }
        public string? UserId { get; set; }
    }
}