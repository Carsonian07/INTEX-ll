using HarboredHope.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace HarboredHope.API.Migrations.App
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            modelBuilder.Entity("HarboredHope.API.Models.Safehouse", b =>
            {
                b.Property<int>("SafehouseId").ValueGeneratedOnAdd()
                    .HasColumnType("int").UseIdentityColumn();
                b.Property<string>("SafehouseCode").IsRequired().HasMaxLength(20);
                b.Property<string>("Name").IsRequired().HasMaxLength(100);
                b.Property<string>("Region").IsRequired().HasMaxLength(50);
                b.Property<string>("City").IsRequired().HasMaxLength(100);
                b.Property<string>("Province").IsRequired().HasMaxLength(100);
                b.Property<string>("Country").IsRequired().HasMaxLength(50).HasDefaultValue("Philippines");
                b.Property<DateOnly>("OpenDate");
                b.Property<string>("Status").IsRequired().HasMaxLength(20).HasDefaultValue("Active");
                b.Property<int>("CapacityGirls");
                b.Property<int>("CapacityStaff");
                b.Property<int>("CurrentOccupancy");
                b.Property<string>("Notes");
                b.HasKey("SafehouseId");
                b.HasIndex("SafehouseCode").IsUnique();
                b.ToTable("Safehouses");
            });

            modelBuilder.Entity("HarboredHope.API.Models.Resident", b =>
            {
                b.Property<int>("ResidentId").ValueGeneratedOnAdd()
                    .HasColumnType("int").UseIdentityColumn();
                b.Property<string>("CaseControlNo").IsRequired().HasMaxLength(20);
                b.Property<string>("InternalCode").IsRequired().HasMaxLength(50);
                b.Property<int>("SafehouseId");
                b.Property<string>("CaseStatus").IsRequired().HasMaxLength(20);
                b.Property<string>("Sex").IsRequired().HasMaxLength(5);
                b.Property<DateOnly>("DateOfBirth");
                b.Property<string>("CaseCategory").IsRequired().HasMaxLength(50);
                b.Property<string>("CurrentRiskLevel").IsRequired().HasMaxLength(20);
                b.Property<string>("InitialRiskLevel").IsRequired().HasMaxLength(20);
                b.Property<string>("ReferralSource").IsRequired().HasMaxLength(50);
                b.Property<DateOnly>("DateOfAdmission");
                b.Property<DateTime>("CreatedAt");
                b.HasKey("ResidentId");
                b.HasIndex("CaseControlNo").IsUnique();
                b.HasIndex("SafehouseId");
                b.ToTable("Residents");
                b.HasOne("HarboredHope.API.Models.Safehouse", "Safehouse")
                    .WithMany("Residents").HasForeignKey("SafehouseId")
                    .OnDelete(DeleteBehavior.Restrict).IsRequired();
            });
#pragma warning restore 612, 618
        }
    }
}
