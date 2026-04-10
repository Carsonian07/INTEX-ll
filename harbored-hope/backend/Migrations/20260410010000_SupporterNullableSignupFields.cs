using HarboredHope.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HarboredHope.API.Migrations;

/// <summary>
/// Marker migration (no DDL): nullable supporter columns should be applied manually on SQL Server if needed.
/// EF model already allows nulls. Example ALTERs are in the repo migration comment or run:
/// dotnet ef database update --context AppDbContext (applies history only; this migration is a no-op).
/// </summary>
[DbContext(typeof(AppDbContext))]
[Migration("20260410010000_SupporterNullableSignupFields")]
public partial class SupporterNullableSignupFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("SELECT 1;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("SELECT 1;");
    }
}
