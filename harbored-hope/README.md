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

## Local development setup

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)

No SQL Server, Docker, or Azure CLI required for teammates.

---

### Backend

**Step 1 — Get `appsettings.Development.json` from John**

Ask John to share the `appsettings.Development.json` file directly (via Slack DM, Discord, etc.) and place it at `harbored-hope/backend/appsettings.Development.json`.

> This file is gitignored — never commit it. It contains database credentials.

The database uses **Azure SQL with Microsoft Entra (Azure AD) authentication**. Your Azure AD account must be granted access by John before you can connect.

**macOS / Linux** — install the Azure CLI and sign in:

```bash
brew install azure-cli       # macOS (Homebrew)
az login
```

**Windows** — install the Azure CLI, then sign in:

```powershell
winget install Microsoft.AzureCLI   # or download from https://aka.ms/installazurecliwindows
az login
```

`az login` opens a browser window. Sign in with the Microsoft account John has given access to. After that, the connection string in `appsettings.Development.json` will authenticate automatically using `Active Directory Default`.

**Step 2 — Restore and run**

macOS / Linux:
```bash
cd harbored-hope/backend
dotnet restore
dotnet run
```

Windows (Command Prompt or PowerShell):
```powershell
cd harbored-hope\backend
dotnet restore
dotnet run
```

The API starts on **http://localhost:5000**.

On first run it automatically seeds two test accounts:
- **Admin**: `admin@harboredhope.org` / `AdminDev123!@#`
- **Donor**: `donor@harboredhope.org` / `DonorDev123!@#`

> You do not need to run migrations — the database is already set up in Azure. Migrations only need to be run when the database schema changes.

---

### Frontend

macOS / Linux:
```bash
cd harbored-hope/frontend
npm install
cp .env.example .env.local
npm run dev
```

Windows (Command Prompt):
```cmd
cd harbored-hope\frontend
npm install
copy .env.example .env.local
npm run dev
```

Windows (PowerShell):
```powershell
cd harbored-hope\frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

The dev server starts on **http://localhost:5173** and automatically proxies `/api` calls to the backend at `http://localhost:5000`, so no extra config is needed.

---

## Running both at the same time

Open two terminal tabs / windows:

macOS / Linux:
```bash
# Terminal 1 — backend
cd harbored-hope/backend
dotnet run

# Terminal 2 — frontend
cd harbored-hope/frontend
npm run dev
```

Windows:
```powershell
# Window 1 — backend
cd harbored-hope\backend
dotnet run

# Window 2 — frontend
cd harbored-hope\frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

---

## Database access (John only)

The Azure SQL database is managed by John. Teammates connect using the shared credentials in `appsettings.Development.json` — ask John for that file.

To run migrations when the schema changes (John only, requires `az login`):

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
ConnectionStrings__OperationalDb   = Server=tcp:harboredhope-1.database.windows.net,1433;Initial Catalog=harboredhopedb-1;...
ConnectionStrings__IdentityDb      = Server=tcp:harboredhope-1.database.windows.net,1433;Initial Catalog=harboredhopedb-1;...
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
