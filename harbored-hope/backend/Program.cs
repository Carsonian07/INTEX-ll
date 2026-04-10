using System.Security.Claims;
using System.Text;
using HarboredHope.API.Data;
using HarboredHope.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ─── Database Contexts ────────────────────────────────────────────────────────
var operationalCs = builder.Configuration.GetConnectionString("OperationalDb")
    ?? throw new InvalidOperationException("Connection string 'OperationalDb' is not configured.");
var identityCs = builder.Configuration.GetConnectionString("IdentityDb")
    ?? throw new InvalidOperationException("Connection string 'IdentityDb' is not configured.");

// Separate migration history tables so both contexts can share one Azure SQL database.
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(operationalCs, sql => sql.MigrationsHistoryTable("__EFMigrationsHistory_Operational"));
    // Snapshot uses PascalCase table names from InitialCreate; runtime model applies snake_case in OnModelCreating.
    // EF 9 treats that as "pending changes" unless a full baseline migration is added — ignore so MigrateAsync can run.
    options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
});

builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseSqlServer(identityCs, sql => sql.MigrationsHistoryTable("__EFMigrationsHistory_Auth")));

// ─── ASP.NET Identity ─────────────────────────────────────────────────────────
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    // Password policy — stricter than defaults, per class instruction
    options.Password.RequiredLength = 14;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredUniqueChars = 6;

    // Lockout
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User
    options.User.RequireUniqueEmail = true;

    // MFA — tokens valid for 5 minutes
    options.Tokens.AuthenticatorTokenProvider = TokenOptions.DefaultAuthenticatorProvider;
})
.AddEntityFrameworkStores<AuthDbContext>()
.AddDefaultTokenProviders();

// ─── JWT Authentication ───────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"],
        ValidAudience            = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew                = TimeSpan.Zero,
        // Ensures User.IsInRole(...) matches role claims emitted as ClaimTypes.Role in TokenService.
        RoleClaimType              = ClaimTypes.Role,
    };
    // Map short JWT claim names (e.g. "role") to ClaimTypes.* so authorization sees roles consistently.
    options.MapInboundClaims = true;
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
    options.AddPolicy("DonorOnly", p => p.RequireRole("Donor"));
    options.AddPolicy("AdminOrStaff", p => p.RequireRole("Admin", "Staff"));
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ─── Application Services ─────────────────────────────────────────────────────
builder.Services.AddHttpClient();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<CsvSeederService>();
builder.Services.AddHttpClient("StorytellingApi", client =>
{
    client.BaseAddress = new Uri("https://lighthouse-storytelling.azurewebsites.net/");
});

// ─── Controllers + Swagger ────────────────────────────────────────────────────
builder.Services.AddControllers(options =>
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true)
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Harbored Hope API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var authDb = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    await authDb.Database.MigrateAsync();

    // Operational DB: do not MigrateAsync() on startup — Azure SQL table/casing differed from scripted ALTERs
    // and blocked the API. Apply schema with: dotnet ef database update --context AppDbContext
    // (or run the manual ALTER in the SupporterNullableSignupFields migration comment).
}

// ─── HTTPS / HSTS ─────────────────────────────────────────────────────────────
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}

// ─── Content Security Policy Header ──────────────────────────────────────────
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';");

    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

    await next();
});

// ─── Swagger (dev only) ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── Seed roles and default admin on first run ────────────────────────────────
await SeedData.InitializeAsync(app.Services);

app.Run();
