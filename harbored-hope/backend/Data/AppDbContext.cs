using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using HarboredHope.API.Models;

namespace HarboredHope.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // The database uses snake_case column names; map every property automatically.
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            entity.SetTableName(ToSnakeCase(entity.GetTableName()!));
            foreach (var prop in entity.GetProperties())
                prop.SetColumnName(ToSnakeCase(prop.GetColumnName()));
            foreach (var key in entity.GetKeys())
                key.SetName(ToSnakeCase(key.GetName()!));
            foreach (var fk in entity.GetForeignKeys())
                fk.SetConstraintName(ToSnakeCase(fk.GetConstraintName()));
            foreach (var idx in entity.GetIndexes())
                idx.SetDatabaseName(ToSnakeCase(idx.GetDatabaseName()));
        }

        // The database stores all boolean fields as VARCHAR(5) ('True'/'False').
        // Apply a global value converter so EF handles the cast automatically.
        var boolConverter = new ValueConverter<bool, string>(
            v => v ? "True" : "False",
            v => v.Equals("True", StringComparison.OrdinalIgnoreCase)
              || v.Equals("Yes",  StringComparison.OrdinalIgnoreCase)
              || v == "1");

        foreach (var entity in modelBuilder.Model.GetEntityTypes())
            foreach (var prop in entity.GetProperties())
                if (prop.ClrType == typeof(bool))
                    prop.SetValueConverter(boolConverter);

        // supporter_id is not an IDENTITY column — EF must include it in INSERTs
        modelBuilder.Entity<Supporter>()
            .Property(s => s.SupporterId)
            .ValueGeneratedNever();

        modelBuilder.Entity<Safehouse>(e =>
        {
            e.HasIndex(s => s.SafehouseCode).IsUnique();
            e.Property(s => s.Status).HasDefaultValue("Active");
            e.Property(s => s.Country).HasDefaultValue("Philippines");
        });

        modelBuilder.Entity<Resident>(e =>
        {
            e.HasIndex(r => r.CaseControlNo).IsUnique();
            e.HasOne(r => r.Safehouse)
                .WithMany(s => s.Residents)
                .HasForeignKey(r => r.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Donation>(e =>
        {
            e.Property(d => d.IsRecurring)
                .HasConversion(
                    value => value ? "True" : "False",
                    value => string.Equals(value, "True", StringComparison.OrdinalIgnoreCase))
                .HasMaxLength(5);
            e.HasOne(d => d.Supporter)
                .WithMany(s => s.Donations)
                .HasForeignKey(d => d.SupporterId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProcessRecording>(e =>
        {
            e.HasOne(p => p.Resident)
                .WithMany(r => r.ProcessRecordings)
                .HasForeignKey(p => p.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HomeVisitation>(e =>
        {
            e.HasOne(h => h.Resident)
                .WithMany(r => r.HomeVisitations)
                .HasForeignKey(h => h.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IncidentReport>(e =>
        {
            e.HasOne(i => i.Resident)
                .WithMany(r => r.IncidentReports)
                .HasForeignKey(i => i.ResidentId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.Safehouse)
                .WithMany()
                .HasForeignKey(i => i.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SafehouseMonthlyMetric>(e =>
        {
            e.HasOne(m => m.Safehouse)
                .WithMany(s => s.MonthlyMetrics)
                .HasForeignKey(m => m.SafehouseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Prevent cascade cycles on DonationAllocation
        modelBuilder.Entity<DonationAllocation>(e =>
        {
            e.HasOne(a => a.Donation)
                .WithMany(d => d.Allocations)
                .HasForeignKey(a => a.DonationId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Safehouse)
                .WithMany()
                .HasForeignKey(a => a.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static string ToSnakeCase(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;
        var sb = new System.Text.StringBuilder();
        for (int i = 0; i < name.Length; i++)
        {
            if (char.IsUpper(name[i]) && i > 0)
                sb.Append('_');
            sb.Append(char.ToLower(name[i]));
        }
        return sb.ToString();
    }
}
