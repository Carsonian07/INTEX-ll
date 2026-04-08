# Harbored Hope

A web application for managing safe homes and rehabilitation services for girls who have survived trafficking and abuse in the Philippines.

---

## Tech stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS → Azure Static Web Apps
- **Backend**: .NET 10 / C# + ASP.NET Identity → Azure App Service
- **Databases**: Azure SQL (operational DB + identity DB, separate instances)
- **Auth**: JWT + ASP.NET Identity with TOTP-based MFA
- **CI/CD**: GitHub Actions

---

## Local development setup

### Prerequisites
- .NET 10 SDK
- Node.js 22+
- SQL Server LocalDB (included with Visual Studio) or Docker with SQL Server

### Backend

```bash
cd backend

# Restore packages
dotnet restore

# Copy and fill in dev secrets (NEVER commit this file)
cp appsettings.json appsettings.Development.json
# Edit appsettings.Development.json with your local connection strings

# Run EF migrations for both databases
dotnet ef database update --context AppDbContext
dotnet ef database update --context AuthDbContext

# Start the API (runs on http://localhost:5000)
dotnet run
```

The API seeds default accounts on first run:
- **Admin**: `admin@harboredhope.org` / `AdminDev123!@#` 
- **Donor**: `donor@harboredhope.org` / `DonorDev123!@#`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env file and set the backend URL
cp .env.example .env.local
# VITE_API_URL=http://localhost:5000

# Start dev server (http://localhost:5173)
npm run dev
```

---

## Azure deployment

### Required GitHub Secrets

Set these in your repository Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `AZURE_WEBAPP_NAME` | Azure App Service name for the backend |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from Azure portal → App Service → Get publish profile |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From Azure portal → Static Web App → Manage deployment token |
| `VITE_API_URL` | Full URL of deployed backend e.g. `https://your-api.azurewebsites.net` |

### Azure App Service environment variables

Set these in Azure portal → App Service → Configuration → Application settings (NOT in code):

```
ConnectionStrings__OperationalDb   = Server=...;Database=HarboredHopeOps;...
ConnectionStrings__IdentityDb      = Server=...;Database=HarboredHopeIdentity;...
Jwt__Key                           = <32+ char random secret>
Jwt__Issuer                        = HarboredHopeAPI
Jwt__Audience                      = HarboredHopeApp
Seed__AdminEmail                   = admin@harboredhope.org
Seed__AdminPassword                = <strong password>
Seed__DonorEmail                   = donor@harboredhope.org
Seed__DonorPassword                = <strong password>
AllowedOrigins__0                  = https://your-frontend.azurestaticapps.net
ASPNETCORE_ENVIRONMENT             = Production
```

---

## Security features implemented

| Feature | Where |
|---------|-------|
| HTTPS / TLS | Azure App Service (automatic cert) |
| HTTP → HTTPS redirect | `Program.cs` `UseHttpsRedirection()` |
| HSTS | `Program.cs` `UseHsts()` in production |
| JWT authentication | `Program.cs` + `TokenService.cs` |
| Role-based authorization | `[Authorize(Roles = "...")]` on all controllers |
| Strict password policy | `Program.cs` Identity options |
| MFA (TOTP authenticator) | `AuthController.cs` full setup/enable/verify/disable |
| Content Security Policy header | `Program.cs` middleware |
| X-Frame-Options / X-Content-Type-Options | `Program.cs` middleware |
| Delete confirmation | `ConfirmDialog.tsx` on all delete actions |
| Data sanitization (HTML strip) | `ResidentExtensions.cs` |
| Light/dark mode cookie (non-httponly) | `AuthContext.tsx` `setThemeCookie()` |
| Credentials in env / secrets | `.gitignore` + Azure App Settings |
| GDPR privacy policy | `PrivacyPage.tsx` |
| Cookie consent banner | `CookieConsent.tsx` (functional) |
| Separate identity database | `AuthDbContext.cs` on separate Azure SQL instance |

---

## Project structure

```
harbored-hope/
├── .github/workflows/deploy.yml     # CI/CD
├── backend/
│   ├── Controllers/                 # API endpoints
│   ├── Data/                        # EF Core contexts
│   ├── Migrations/                  # Database migrations
│   ├── Models/                      # Domain models
│   ├── Services/                    # Token, email services
│   ├── Program.cs                   # App startup
│   ├── SeedData.cs                  # Role + account seeding
│   └── HarboredHope.API.csproj
├── frontend/
│   ├── public/                      # Static assets (put logo.png here)
│   ├── src/
│   │   ├── components/              # Shared UI components
│   │   ├── context/                 # AuthContext
│   │   ├── layouts/                 # PublicLayout, AdminLayout
│   │   ├── lib/                     # api.ts client
│   │   └── pages/
│   │       ├── admin/               # Staff portal pages
│   │       ├── donor/               # Donor dashboard
│   │       └── public/              # Landing, impact, login, etc.
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── ml-pipelines/                    # Jupyter notebooks (add here)
```

---

## Grader access credentials

Provide these in your final submission form:

| Role | Email | Password | MFA |
|------|-------|----------|-----|
| Admin (no MFA) | `admin@harboredhope.org` | *(set in Azure)* | Off |
| Donor (no MFA) | `donor@harboredhope.org` | *(set in Azure)* | Off |
| Admin (MFA on) | Create a third account manually | — | On |
