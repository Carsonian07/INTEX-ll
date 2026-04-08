using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HarboredHope.API.Models;

// ─── Safehouses ───────────────────────────────────────────────────────────────
public class Safehouse
{
    [Key] public int SafehouseId { get; set; }
    [Required, MaxLength(20)] public string SafehouseCode { get; set; } = "";
    [Required, MaxLength(100)] public string Name { get; set; } = "";
    [MaxLength(50)] public string Region { get; set; } = "";
    [MaxLength(100)] public string City { get; set; } = "";
    [MaxLength(100)] public string Province { get; set; } = "";
    [MaxLength(50)] public string Country { get; set; } = "Philippines";
    public DateOnly OpenDate { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "Active";
    public int CapacityGirls { get; set; }
    public int CapacityStaff { get; set; }
    public int CurrentOccupancy { get; set; }
    public string? Notes { get; set; }

    public ICollection<Resident> Residents { get; set; } = [];
    public ICollection<SafehouseMonthlyMetric> MonthlyMetrics { get; set; } = [];
}

// ─── Partners ─────────────────────────────────────────────────────────────────
public class Partner
{
    [Key] public int PartnerId { get; set; }
    [Required, MaxLength(200)] public string PartnerName { get; set; } = "";
    [MaxLength(50)] public string PartnerType { get; set; } = "";
    [MaxLength(50)] public string RoleType { get; set; } = "";
    [MaxLength(200)] public string? ContactName { get; set; }
    [MaxLength(200)] public string? Email { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(50)] public string? Region { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "Active";
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Notes { get; set; }
}

// ─── Supporters ───────────────────────────────────────────────────────────────
public class Supporter
{
    [Key] public int SupporterId { get; set; }
    [Required, MaxLength(50)] public string SupporterType { get; set; } = "";
    [Required, MaxLength(200)] public string DisplayName { get; set; } = "";
    [MaxLength(200)] public string? OrganizationName { get; set; }
    [MaxLength(100)] public string? FirstName { get; set; }
    [MaxLength(100)] public string? LastName { get; set; }
    [MaxLength(50)] public string RelationshipType { get; set; } = "";
    [MaxLength(100)] public string? Region { get; set; }
    [MaxLength(100)] public string? Country { get; set; }
    [MaxLength(200)] public string? Email { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "Active";
    public DateOnly? FirstDonationDate { get; set; }
    [MaxLength(50)] public string? AcquisitionChannel { get; set; }
    public string? CreatedAt { get; set; }

    public ICollection<Donation> Donations { get; set; } = [];
}

// ─── Donations ────────────────────────────────────────────────────────────────
public class Donation
{
    [Key] public int DonationId { get; set; }
    public int SupporterId { get; set; }
    [Required, MaxLength(50)] public string DonationType { get; set; } = "";
    public DateOnly DonationDate { get; set; }
    [MaxLength(50)] public string? ChannelSource { get; set; }
    [MaxLength(10)] public string? CurrencyCode { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? Amount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? EstimatedValue { get; set; }
    [MaxLength(20)] public string? ImpactUnit { get; set; }
    public bool IsRecurring { get; set; }
    [MaxLength(100)] public string? CampaignName { get; set; }
    public string? Notes { get; set; }
    public int? CreatedByPartnerId { get; set; }
    public int? ReferralPostId { get; set; }

    [ForeignKey("SupporterId")] public Supporter Supporter { get; set; } = null!;
    public ICollection<DonationAllocation> Allocations { get; set; } = [];
    public ICollection<InKindDonationItem> InKindItems { get; set; } = [];
}

// ─── InKindDonationItems ──────────────────────────────────────────────────────
public class InKindDonationItem
{
    [Key] public int ItemId { get; set; }
    public int DonationId { get; set; }
    [Required, MaxLength(200)] public string ItemName { get; set; } = "";
    [MaxLength(50)] public string ItemCategory { get; set; } = "";
    public int Quantity { get; set; }
    [MaxLength(20)] public string UnitOfMeasure { get; set; } = "";
    [Column(TypeName = "decimal(18,2)")] public decimal EstimatedUnitValue { get; set; }
    [MaxLength(50)] public string? IntendedUse { get; set; }
    [MaxLength(20)] public string ReceivedCondition { get; set; } = "";

    [ForeignKey("DonationId")] public Donation Donation { get; set; } = null!;
}

// ─── DonationAllocations ──────────────────────────────────────────────────────
public class DonationAllocation
{
    [Key] public int AllocationId { get; set; }
    public int DonationId { get; set; }
    public int SafehouseId { get; set; }
    [MaxLength(50)] public string ProgramArea { get; set; } = "";
    [Column(TypeName = "decimal(18,2)")] public decimal AmountAllocated { get; set; }
    public DateOnly AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }

    [ForeignKey("DonationId")] public Donation Donation { get; set; } = null!;
    [ForeignKey("SafehouseId")] public Safehouse Safehouse { get; set; } = null!;
}

// ─── Residents ────────────────────────────────────────────────────────────────
public class Resident
{
    [Key] public int ResidentId { get; set; }
    [MaxLength(20)] public string CaseControlNo { get; set; } = "";
    [MaxLength(50)] public string InternalCode { get; set; } = "";
    public int SafehouseId { get; set; }
    [MaxLength(20)] public string CaseStatus { get; set; } = "Active";
    [MaxLength(5)] public string Sex { get; set; } = "F";
    public DateOnly DateOfBirth { get; set; }
    [MaxLength(20)] public string BirthStatus { get; set; } = "";
    [MaxLength(100)] public string? PlaceOfBirth { get; set; }
    [MaxLength(50)] public string? Religion { get; set; }
    [MaxLength(50)] public string CaseCategory { get; set; } = "";

    // Sub-categories
    public bool SubCatOrphaned { get; set; }
    public bool SubCatTrafficked { get; set; }
    public bool SubCatChildLabor { get; set; }
    public bool SubCatPhysicalAbuse { get; set; }
    public bool SubCatSexualAbuse { get; set; }
    public bool SubCatOsaec { get; set; }
    public bool SubCatCicl { get; set; }
    public bool SubCatAtRisk { get; set; }
    public bool SubCatStreetChild { get; set; }
    public bool SubCatChildWithHiv { get; set; }

    // Disability
    public bool IsPwd { get; set; }
    [MaxLength(100)] public string? PwdType { get; set; }
    public bool HasSpecialNeeds { get; set; }
    [MaxLength(200)] public string? SpecialNeedsDiagnosis { get; set; }

    // Family profile
    [Column("family_is_4ps")] public bool FamilyIs4Ps { get; set; }
    public bool FamilySoloParent { get; set; }
    public bool FamilyIndigenous { get; set; }
    public bool FamilyParentPwd { get; set; }
    public bool FamilyInformalSettler { get; set; }

    // Admission
    public DateOnly DateOfAdmission { get; set; }
    [MaxLength(100)] public string? AgeUponAdmission { get; set; }
    [MaxLength(50)] public string ReferralSource { get; set; } = "";
    [MaxLength(200)] public string? ReferringAgencyPerson { get; set; }
    [MaxLength(200)] public string? AssignedSocialWorker { get; set; }
    public string? InitialCaseAssessment { get; set; }
    public DateOnly? DateCaseStudyPrepared { get; set; }

    // Reintegration
    [MaxLength(50)] public string? ReintegrationType { get; set; }
    [MaxLength(20)] public string? ReintegrationStatus { get; set; }
    [MaxLength(20)] public string InitialRiskLevel { get; set; } = "Medium";
    [MaxLength(20)] public string CurrentRiskLevel { get; set; } = "Medium";
    public DateOnly? DateClosed { get; set; }
    public string? CreatedAt { get; set; }

    [ForeignKey("SafehouseId")] public Safehouse Safehouse { get; set; } = null!;
    public ICollection<ProcessRecording> ProcessRecordings { get; set; } = [];
    public ICollection<HomeVisitation> HomeVisitations { get; set; } = [];
    public ICollection<EducationRecord> EducationRecords { get; set; } = [];
    public ICollection<HealthWellbeingRecord> HealthRecords { get; set; } = [];
    public ICollection<InterventionPlan> InterventionPlans { get; set; } = [];
    public ICollection<IncidentReport> IncidentReports { get; set; } = [];
}

// ─── ProcessRecordings ────────────────────────────────────────────────────────
public class ProcessRecording
{
    [Key] public int RecordingId { get; set; }
    public int ResidentId { get; set; }
    public DateOnly SessionDate { get; set; }
    [MaxLength(200)] public string SocialWorker { get; set; } = "";
    [MaxLength(20)] public string SessionType { get; set; } = "Individual";
    public int SessionDurationMinutes { get; set; }
    [MaxLength(30)] public string EmotionalStateObserved { get; set; } = "";
    [MaxLength(30)] public string EmotionalStateEnd { get; set; } = "";
    public string SessionNarrative { get; set; } = "";
    public string? InterventionsApplied { get; set; }
    public string? FollowUpActions { get; set; }
    public bool ProgressNoted { get; set; }
    public bool ConcernsFlagged { get; set; }
    public bool ReferralMade { get; set; }

    [ForeignKey("ResidentId")] public Resident Resident { get; set; } = null!;
}

// ─── HomeVisitations ──────────────────────────────────────────────────────────
public class HomeVisitation
{
    [Key] public int VisitationId { get; set; }
    public int ResidentId { get; set; }
    public DateOnly VisitDate { get; set; }
    [MaxLength(200)] public string SocialWorker { get; set; } = "";
    [MaxLength(50)] public string VisitType { get; set; } = "";
    [MaxLength(300)] public string? LocationVisited { get; set; }
    [MaxLength(300)] public string? FamilyMembersPresent { get; set; }
    public string? Purpose { get; set; }
    public string? Observations { get; set; }
    [MaxLength(30)] public string FamilyCooperationLevel { get; set; } = "";
    public bool SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    [MaxLength(30)] public string VisitOutcome { get; set; } = "";

    [ForeignKey("ResidentId")] public Resident Resident { get; set; } = null!;
}

// ─── EducationRecords ─────────────────────────────────────────────────────────
public class EducationRecord
{
    [Key] public int EducationRecordId { get; set; }
    public int ResidentId { get; set; }
    public DateOnly RecordDate { get; set; }
    [MaxLength(30)] public string EducationLevel { get; set; } = "";
    [MaxLength(100)] public string? SchoolName { get; set; }
    [MaxLength(20)] public string EnrollmentStatus { get; set; } = "";
    [Column(TypeName = "decimal(5,3)")] public decimal AttendanceRate { get; set; }
    [Column(TypeName = "decimal(5,1)")] public decimal ProgressPercent { get; set; }
    [MaxLength(20)] public string CompletionStatus { get; set; } = "";
    public string? Notes { get; set; }

    [ForeignKey("ResidentId")] public Resident Resident { get; set; } = null!;
}

// ─── HealthWellbeingRecords ───────────────────────────────────────────────────
public class HealthWellbeingRecord
{
    [Key] public int HealthRecordId { get; set; }
    public int ResidentId { get; set; }
    public DateOnly RecordDate { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal WeightKg { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal HeightCm { get; set; }
    [Column(TypeName = "decimal(4,2)")] public decimal Bmi { get; set; }
    [Column("nutrition_score", TypeName = "decimal(3,2)")] public decimal? NutritionScore { get; set; }
    [Column("sleep_quality_score", TypeName = "decimal(3,2)")] public decimal? SleepScore { get; set; }
    [Column("energy_level_score", TypeName = "decimal(3,2)")] public decimal? EnergyScore { get; set; }
    [Column("general_health_score", TypeName = "decimal(3,2)")] public decimal? GeneralHealthScore { get; set; }
    public bool MedicalCheckupDone { get; set; }
    public bool DentalCheckupDone { get; set; }
    public bool PsychologicalCheckupDone { get; set; }

    [ForeignKey("ResidentId")] public Resident Resident { get; set; } = null!;
}

// ─── InterventionPlans ────────────────────────────────────────────────────────
public class InterventionPlan
{
    [Key] public int PlanId { get; set; }
    public int ResidentId { get; set; }
    [MaxLength(50)] public string PlanCategory { get; set; } = "";
    public string PlanDescription { get; set; } = "";
    public string? ServicesProvided { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? TargetValue { get; set; }
    public DateOnly TargetDate { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "Open";
    public DateOnly? CaseConferenceDate { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }

    [ForeignKey("ResidentId")] public Resident Resident { get; set; } = null!;
}

// ─── IncidentReports ──────────────────────────────────────────────────────────
public class IncidentReport
{
    [Key] public int IncidentId { get; set; }
    public int ResidentId { get; set; }
    public int SafehouseId { get; set; }
    public DateOnly IncidentDate { get; set; }
    [MaxLength(50)] public string IncidentType { get; set; } = "";
    [MaxLength(20)] public string Severity { get; set; } = "";
    public string Description { get; set; } = "";
    public string? ResponseTaken { get; set; }
    public bool Resolved { get; set; }
    public DateOnly? ResolutionDate { get; set; }
    [MaxLength(200)] public string ReportedBy { get; set; } = "";
    public bool FollowUpRequired { get; set; }

    [ForeignKey("ResidentId")] public Resident Resident { get; set; } = null!;
    [ForeignKey("SafehouseId")] public Safehouse Safehouse { get; set; } = null!;
}

// ─── SocialMediaPosts ─────────────────────────────────────────────────────────
public class SocialMediaPost
{
    [Key] public int PostId { get; set; }
    [MaxLength(20)] public string Platform { get; set; } = "";
    [MaxLength(100)] public string? PlatformPostId { get; set; }
    [MaxLength(500)] public string? PostUrl { get; set; }
    public string? CreatedAt { get; set; }
    [MaxLength(15)] public string? DayOfWeek { get; set; }
    public int PostHour { get; set; }
    [MaxLength(30)] public string PostType { get; set; } = "";
    [MaxLength(30)] public string MediaType { get; set; } = "";
    public string? Caption { get; set; }
    public string? Hashtags { get; set; }
    public int NumHashtags { get; set; }
    public int MentionsCount { get; set; }
    public bool HasCallToAction { get; set; }
    [MaxLength(20)] public string? CallToActionType { get; set; }
    [MaxLength(50)] public string? ContentTopic { get; set; }
    [MaxLength(20)] public string? SentimentTone { get; set; }
    public int CaptionLength { get; set; }
    public bool FeaturesResidentStory { get; set; }
    [MaxLength(100)] public string? CampaignName { get; set; }
    public bool IsBoosted { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? BoostBudgetPhp { get; set; }
    public int Impressions { get; set; }
    public int Reach { get; set; }
    public int Likes { get; set; }
    public int Comments { get; set; }
    public int Shares { get; set; }
    public int Saves { get; set; }
    public int ClickThroughs { get; set; }
    public int? VideoViews { get; set; }
    [Column(TypeName = "decimal(6,4)")] public decimal EngagementRate { get; set; }
    public int ProfileVisits { get; set; }
    public int DonationReferrals { get; set; }
    [Column(TypeName = "decimal(12,2)")] public decimal EstimatedDonationValuePhp { get; set; }
    public int FollowerCountAtPost { get; set; }
}

// ─── SafehouseMonthlyMetrics ──────────────────────────────────────────────────
public class SafehouseMonthlyMetric
{
    [Key] public int MetricId { get; set; }
    public int SafehouseId { get; set; }
    public DateOnly MonthStart { get; set; }
    public DateOnly MonthEnd { get; set; }
    public int ActiveResidents { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal? AvgEducationProgress { get; set; }
    [Column(TypeName = "decimal(3,2)")] public decimal? AvgHealthScore { get; set; }
    public int ProcessRecordingCount { get; set; }
    public int HomeVisitationCount { get; set; }
    public int IncidentCount { get; set; }
    public string? Notes { get; set; }

    [ForeignKey("SafehouseId")] public Safehouse Safehouse { get; set; } = null!;
}

// ─── PublicImpactSnapshots ────────────────────────────────────────────────────
public class PublicImpactSnapshot
{
    [Key] public int SnapshotId { get; set; }
    public DateOnly SnapshotDate { get; set; }
    [MaxLength(300)] public string Headline { get; set; } = "";
    public string SummaryText { get; set; } = "";
    public string? MetricPayloadJson { get; set; }
    public bool IsPublished { get; set; }
    public DateOnly? PublishedAt { get; set; }
}
