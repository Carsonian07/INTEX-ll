using Microsoft.EntityFrameworkCore;
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
}
