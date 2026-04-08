# Harbored Hope

A web application for managing safe homes and rehabilitation services for girls who have survived trafficking and abuse in the Philippines.

---

## Tech stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS → Azure Static Web Apps
- **Backend**: .NET 10 / C# + ASP.NET Identity → Azure App Service
- **Database**: Azure SQL (single database, two EF contexts with separate migration history tables)
- **Auth**: JWT + ASP.NET Identity with TOTP-based MFA
- **CI/CD**: GitHub Actions

---

## Machine learning APIs

| API | URL |
|-----|-----|
| ML pipelines (recommendations, predictions, etc.) | https://harboredhope-ml-api.azurewebsites.net/docs#/ |
| Donor storytelling API | https://lighthouse-storytelling.azurewebsites.net/docs |

---

## Local development setup

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)

No SQL Server, Docker, or Azure CLI required.

---

### Backend

**Step 1 — Create `appsettings.Development.json`**

Copy the example file and fill in the database password:

```bash
cp harbored-hope/backend/appsettings.Development.example.jsonc harbored-hope/backend/appsettings.Development.json
```

Then open the file and replace `INSERTPASSWORDHERE` with the password John provides.

> This file is gitignored — never commit it. It contains database credentials.

The database is Azure SQL using a shared SQL username/password (`harbored_dev`). No Azure CLI or `az login` is needed.

> **Can't connect?** Your machine's IP must be whitelisted in Azure Portal → SQL Server → Networking → Firewall rules. Ask John to add your IP address.

**Step 2 — Restore and run**

macOS / Linux:
```bash
cd harbored-hope/backend
dotnet restore
dotnet run
```

Windows:
```powershell
cd harbored-hope\backend
dotnet restore
dotnet run
```

The API starts on **http://localhost:5000**.

On first run it automatically seeds two test accounts:
- **Admin**: `admin@harboredhope.org` / `AdminDev123!@#`
- **Donor**: `donor@harboredhope.org` / `DonorDev123!@#`

> You do not need to run migrations — the database is already set up in Azure.

---

### Frontend

macOS / Linux:
```bash
cd harbored-hope/frontend
npm install
cp .env.example .env.local
npm run dev
```

Windows (PowerShell):
```powershell
cd harbored-hope\frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

The dev server starts on **http://localhost:5173** and automatically proxies `/api` calls to the backend at `http://localhost:5000`.

---

## Running both at the same time

Open two terminal tabs / windows:

```bash
# Terminal 1 — backend
cd harbored-hope/backend && dotnet run

# Terminal 2 — frontend
cd harbored-hope/frontend && npm run dev
```

Then open http://localhost:5173 in your browser.

---

## Database access (John only)

To run migrations when the schema changes:

macOS / Linux:
```bash
cd harbored-hope/backend
ASPNETCORE_ENVIRONMENT=Development dotnet ef database update --context AppDbContext
ASPNETCORE_ENVIRONMENT=Development dotnet ef database update --context AuthDbContext
```

Windows (PowerShell):
```powershell
cd harbored-hope\backend
$env:ASPNETCORE_ENVIRONMENT="Development"; dotnet ef database update --context AppDbContext
$env:ASPNETCORE_ENVIRONMENT="Development"; dotnet ef database update --context AuthDbContext
```

---

## Azure deployment

### Required GitHub Secrets

Set these in repository Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `AZURE_WEBAPP_NAME` | Azure App Service name for the backend |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from Azure portal → App Service → Get publish profile |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From Azure portal → Static Web App → Manage deployment token |
| `VITE_API_URL` | Full URL of deployed backend e.g. `https://your-api.azurewebsites.net` |

### Azure App Service environment variables

Set these in Azure portal → App Service → Configuration → Application settings:

```
ConnectionStrings__OperationalDb   = Server=tcp:harboredhope-1.database.windows.net,1433;...
ConnectionStrings__IdentityDb      = Server=tcp:harboredhope-1.database.windows.net,1433;...
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

## Security features

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
| Credentials in env / secrets | `.gitignore` + Azure App Settings |
| GDPR privacy policy | `PrivacyPage.tsx` |
| Cookie consent banner | `CookieConsent.tsx` (functional) |
| Separate identity schema | `AuthDbContext.cs` with separate migration history table |

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
│   ├── public/                      # Static assets
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
└── ml-pipelines/                    # Jupyter notebooks
```

---

## Grader access credentials

Provide these in your final submission form:

| Role | Email | Password | MFA |
|------|-------|----------|-----|
| Admin (no MFA) | `admin@harboredhope.org` | *(set in Azure App Settings)* | Off |
| Donor (no MFA) | `donor@harboredhope.org` | *(set in Azure App Settings)* | Off |
| Admin (MFA on) | Create a third account manually | — | On |
