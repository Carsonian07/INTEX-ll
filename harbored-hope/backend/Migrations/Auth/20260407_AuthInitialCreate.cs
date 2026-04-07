using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HarboredHope.API.Migrations.Auth
{
    public partial class AuthInitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id             = table.Column<string>(nullable: false),
                    Name           = table.Column<string>(maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(nullable: true)
                },
                constraints: table => table.PrimaryKey("PK_Roles", x => x.Id));

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id                   = table.Column<string>(nullable: false),
                    UserName             = table.Column<string>(maxLength: 256, nullable: true),
                    NormalizedUserName   = table.Column<string>(maxLength: 256, nullable: true),
                    Email                = table.Column<string>(maxLength: 256, nullable: true),
                    NormalizedEmail      = table.Column<string>(maxLength: 256, nullable: true),
                    EmailConfirmed       = table.Column<bool>(nullable: false),
                    PasswordHash         = table.Column<string>(nullable: true),
                    SecurityStamp        = table.Column<string>(nullable: true),
                    ConcurrencyStamp     = table.Column<string>(nullable: true),
                    PhoneNumber          = table.Column<string>(nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(nullable: false),
                    TwoFactorEnabled     = table.Column<bool>(nullable: false),
                    LockoutEnd           = table.Column<DateTimeOffset>(nullable: true),
                    LockoutEnabled       = table.Column<bool>(nullable: false),
                    AccessFailedCount    = table.Column<int>(nullable: false),
                    // Custom fields
                    SupporterId  = table.Column<int>(nullable: true),
                    DisplayName  = table.Column<string>(nullable: true),
                    CreatedAt    = table.Column<DateTime>(nullable: false),
                    IsMfaEnabled = table.Column<bool>(nullable: false)
                },
                constraints: table => table.PrimaryKey("PK_Users", x => x.Id));

            migrationBuilder.CreateTable(
                name: "RoleClaims",
                columns: table => new
                {
                    Id         = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    RoleId     = table.Column<string>(nullable: false),
                    ClaimType  = table.Column<string>(nullable: true),
                    ClaimValue = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleClaims", x => x.Id);
                    table.ForeignKey("FK_RoleClaims_Roles_RoleId", x => x.RoleId, "Roles", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserClaims",
                columns: table => new
                {
                    Id         = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    UserId     = table.Column<string>(nullable: false),
                    ClaimType  = table.Column<string>(nullable: true),
                    ClaimValue = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserClaims", x => x.Id);
                    table.ForeignKey("FK_UserClaims_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserLogins",
                columns: table => new
                {
                    LoginProvider       = table.Column<string>(nullable: false),
                    ProviderKey         = table.Column<string>(nullable: false),
                    ProviderDisplayName = table.Column<string>(nullable: true),
                    UserId              = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey("FK_UserLogins_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(nullable: false),
                    RoleId = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey("FK_UserRoles_Roles_RoleId", x => x.RoleId, "Roles", "Id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey("FK_UserRoles_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserTokens",
                columns: table => new
                {
                    UserId        = table.Column<string>(nullable: false),
                    LoginProvider = table.Column<string>(nullable: false),
                    Name          = table.Column<string>(nullable: false),
                    Value         = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey("FK_UserTokens_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
                });

            // Indexes
            migrationBuilder.CreateIndex("UserNameIndex",      "Users", "NormalizedUserName", unique: true, filter: "[NormalizedUserName] IS NOT NULL");
            migrationBuilder.CreateIndex("EmailIndex",         "Users", "NormalizedEmail");
            migrationBuilder.CreateIndex("RoleNameIndex",      "Roles", "NormalizedName", unique: true, filter: "[NormalizedName] IS NOT NULL");
            migrationBuilder.CreateIndex("IX_RoleClaims_RoleId", "RoleClaims", "RoleId");
            migrationBuilder.CreateIndex("IX_UserClaims_UserId", "UserClaims", "UserId");
            migrationBuilder.CreateIndex("IX_UserLogins_UserId", "UserLogins", "UserId");
            migrationBuilder.CreateIndex("IX_UserRoles_RoleId",  "UserRoles", "RoleId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable("UserTokens");
            migrationBuilder.DropTable("UserRoles");
            migrationBuilder.DropTable("UserLogins");
            migrationBuilder.DropTable("UserClaims");
            migrationBuilder.DropTable("RoleClaims");
            migrationBuilder.DropTable("Users");
            migrationBuilder.DropTable("Roles");
        }
    }
}
