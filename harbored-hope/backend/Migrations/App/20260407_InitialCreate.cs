using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HarboredHope.API.Migrations.App
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Partners",
                columns: table => new
                {
                    PartnerId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    PartnerName = table.Column<string>(maxLength: 200, nullable: false),
                    PartnerType = table.Column<string>(maxLength: 50, nullable: false),
                    RoleType = table.Column<string>(maxLength: 50, nullable: false),
                    ContactName = table.Column<string>(maxLength: 200, nullable: true),
                    Email = table.Column<string>(maxLength: 200, nullable: true),
                    Phone = table.Column<string>(maxLength: 50, nullable: true),
                    Region = table.Column<string>(maxLength: 50, nullable: true),
                    Status = table.Column<string>(maxLength: 20, nullable: false),
                    StartDate = table.Column<DateOnly>(nullable: false),
                    EndDate = table.Column<DateOnly>(nullable: true),
                    Notes = table.Column<string>(nullable: true)
                },
                constraints: table => table.PrimaryKey("PK_Partners", x => x.PartnerId));

            migrationBuilder.CreateTable(
                name: "PublicImpactSnapshots",
                columns: table => new
                {
                    SnapshotId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    SnapshotDate = table.Column<DateOnly>(nullable: false),
                    Headline = table.Column<string>(maxLength: 300, nullable: false),
                    SummaryText = table.Column<string>(nullable: false),
                    MetricPayloadJson = table.Column<string>(nullable: true),
                    IsPublished = table.Column<bool>(nullable: false),
                    PublishedAt = table.Column<DateOnly>(nullable: true)
                },
                constraints: table => table.PrimaryKey("PK_PublicImpactSnapshots", x => x.SnapshotId));

            migrationBuilder.CreateTable(
                name: "Safehouses",
                columns: table => new
                {
                    SafehouseId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    SafehouseCode = table.Column<string>(maxLength: 20, nullable: false),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    Region = table.Column<string>(maxLength: 50, nullable: false),
                    City = table.Column<string>(maxLength: 100, nullable: false),
                    Province = table.Column<string>(maxLength: 100, nullable: false),
                    Country = table.Column<string>(maxLength: 50, nullable: false, defaultValue: "Philippines"),
                    OpenDate = table.Column<DateOnly>(nullable: false),
                    Status = table.Column<string>(maxLength: 20, nullable: false, defaultValue: "Active"),
                    CapacityGirls = table.Column<int>(nullable: false),
                    CapacityStaff = table.Column<int>(nullable: false),
                    CurrentOccupancy = table.Column<int>(nullable: false),
                    Notes = table.Column<string>(nullable: true)
                },
                constraints: table => table.PrimaryKey("PK_Safehouses", x => x.SafehouseId));

            migrationBuilder.CreateTable(
                name: "SocialMediaPosts",
                columns: table => new
                {
                    PostId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    Platform = table.Column<string>(maxLength: 20, nullable: false),
                    PlatformPostId = table.Column<string>(maxLength: 100, nullable: true),
                    PostUrl = table.Column<string>(maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    DayOfWeek = table.Column<string>(maxLength: 15, nullable: true),
                    PostHour = table.Column<int>(nullable: false),
                    PostType = table.Column<string>(maxLength: 30, nullable: false),
                    MediaType = table.Column<string>(maxLength: 30, nullable: false),
                    Caption = table.Column<string>(nullable: true),
                    Hashtags = table.Column<string>(nullable: true),
                    NumHashtags = table.Column<int>(nullable: false),
                    MentionsCount = table.Column<int>(nullable: false),
                    HasCallToAction = table.Column<bool>(nullable: false),
                    CallToActionType = table.Column<string>(maxLength: 20, nullable: true),
                    ContentTopic = table.Column<string>(maxLength: 50, nullable: true),
                    SentimentTone = table.Column<string>(maxLength: 20, nullable: true),
                    CaptionLength = table.Column<int>(nullable: false),
                    FeaturesResidentStory = table.Column<bool>(nullable: false),
                    CampaignName = table.Column<string>(maxLength: 100, nullable: true),
                    IsBoosted = table.Column<bool>(nullable: false),
                    BoostBudgetPhp = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Impressions = table.Column<int>(nullable: false),
                    Reach = table.Column<int>(nullable: false),
                    Likes = table.Column<int>(nullable: false),
                    Comments = table.Column<int>(nullable: false),
                    Shares = table.Column<int>(nullable: false),
                    Saves = table.Column<int>(nullable: false),
                    ClickThroughs = table.Column<int>(nullable: false),
                    VideoViews = table.Column<int>(nullable: true),
                    EngagementRate = table.Column<decimal>(type: "decimal(6,4)", nullable: false),
                    ProfileVisits = table.Column<int>(nullable: false),
                    DonationReferrals = table.Column<int>(nullable: false),
                    EstimatedDonationValuePhp = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    FollowerCountAtPost = table.Column<int>(nullable: false)
                },
                constraints: table => table.PrimaryKey("PK_SocialMediaPosts", x => x.PostId));

            migrationBuilder.CreateTable(
                name: "Supporters",
                columns: table => new
                {
                    SupporterId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    SupporterType = table.Column<string>(maxLength: 50, nullable: false),
                    DisplayName = table.Column<string>(maxLength: 200, nullable: false),
                    OrganizationName = table.Column<string>(maxLength: 200, nullable: true),
                    FirstName = table.Column<string>(maxLength: 100, nullable: true),
                    LastName = table.Column<string>(maxLength: 100, nullable: true),
                    RelationshipType = table.Column<string>(maxLength: 50, nullable: false),
                    Region = table.Column<string>(maxLength: 100, nullable: true),
                    Country = table.Column<string>(maxLength: 100, nullable: true),
                    Email = table.Column<string>(maxLength: 200, nullable: true),
                    Phone = table.Column<string>(maxLength: 50, nullable: true),
                    Status = table.Column<string>(maxLength: 20, nullable: false),
                    FirstDonationDate = table.Column<DateOnly>(nullable: true),
                    AcquisitionChannel = table.Column<string>(maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table => table.PrimaryKey("PK_Supporters", x => x.SupporterId));

            migrationBuilder.CreateTable(
                name: "Residents",
                columns: table => new
                {
                    ResidentId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    CaseControlNo = table.Column<string>(maxLength: 20, nullable: false),
                    InternalCode = table.Column<string>(maxLength: 50, nullable: false),
                    SafehouseId = table.Column<int>(nullable: false),
                    CaseStatus = table.Column<string>(maxLength: 20, nullable: false),
                    Sex = table.Column<string>(maxLength: 5, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(nullable: false),
                    BirthStatus = table.Column<string>(maxLength: 20, nullable: false),
                    PlaceOfBirth = table.Column<string>(maxLength: 100, nullable: true),
                    Religion = table.Column<string>(maxLength: 50, nullable: true),
                    CaseCategory = table.Column<string>(maxLength: 50, nullable: false),
                    SubCatOrphaned = table.Column<bool>(nullable: false),
                    SubCatTrafficked = table.Column<bool>(nullable: false),
                    SubCatChildLabor = table.Column<bool>(nullable: false),
                    SubCatPhysicalAbuse = table.Column<bool>(nullable: false),
                    SubCatSexualAbuse = table.Column<bool>(nullable: false),
                    SubCatOsaec = table.Column<bool>(nullable: false),
                    SubCatCicl = table.Column<bool>(nullable: false),
                    SubCatAtRisk = table.Column<bool>(nullable: false),
                    SubCatStreetChild = table.Column<bool>(nullable: false),
                    SubCatChildWithHiv = table.Column<bool>(nullable: false),
                    IsPwd = table.Column<bool>(nullable: false),
                    PwdType = table.Column<string>(maxLength: 100, nullable: true),
                    HasSpecialNeeds = table.Column<bool>(nullable: false),
                    SpecialNeedsDiagnosis = table.Column<string>(maxLength: 200, nullable: true),
                    FamilyIs4Ps = table.Column<bool>(nullable: false),
                    FamilySoloParent = table.Column<bool>(nullable: false),
                    FamilyIndigenous = table.Column<bool>(nullable: false),
                    FamilyParentPwd = table.Column<bool>(nullable: false),
                    FamilyInformalSettler = table.Column<bool>(nullable: false),
                    DateOfAdmission = table.Column<DateOnly>(nullable: false),
                    AgeUponAdmission = table.Column<string>(maxLength: 100, nullable: true),
                    ReferralSource = table.Column<string>(maxLength: 50, nullable: false),
                    ReferringAgencyPerson = table.Column<string>(maxLength: 200, nullable: true),
                    AssignedSocialWorker = table.Column<string>(maxLength: 200, nullable: true),
                    InitialCaseAssessment = table.Column<string>(nullable: true),
                    DateCaseStudyPrepared = table.Column<DateOnly>(nullable: true),
                    ReintegrationType = table.Column<string>(maxLength: 50, nullable: true),
                    ReintegrationStatus = table.Column<string>(maxLength: 20, nullable: true),
                    InitialRiskLevel = table.Column<string>(maxLength: 20, nullable: false),
                    CurrentRiskLevel = table.Column<string>(maxLength: 20, nullable: false),
                    DateClosed = table.Column<DateOnly>(nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Residents", x => x.ResidentId);
                    table.ForeignKey("FK_Residents_Safehouses_SafehouseId", x => x.SafehouseId, "Safehouses", "SafehouseId", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Donations",
                columns: table => new
                {
                    DonationId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    SupporterId = table.Column<int>(nullable: false),
                    DonationType = table.Column<string>(maxLength: 50, nullable: false),
                    DonationDate = table.Column<DateOnly>(nullable: false),
                    ChannelSource = table.Column<string>(maxLength: 50, nullable: true),
                    CurrencyCode = table.Column<string>(maxLength: 10, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    EstimatedValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ImpactUnit = table.Column<string>(maxLength: 20, nullable: true),
                    IsRecurring = table.Column<bool>(nullable: false),
                    CampaignName = table.Column<string>(maxLength: 100, nullable: true),
                    Notes = table.Column<string>(nullable: true),
                    CreatedByPartnerId = table.Column<int>(nullable: true),
                    ReferralPostId = table.Column<int>(nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Donations", x => x.DonationId);
                    table.ForeignKey("FK_Donations_Supporters_SupporterId", x => x.SupporterId, "Supporters", "SupporterId", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SafehouseMonthlyMetrics",
                columns: table => new
                {
                    MetricId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    SafehouseId = table.Column<int>(nullable: false),
                    MonthStart = table.Column<DateOnly>(nullable: false),
                    MonthEnd = table.Column<DateOnly>(nullable: false),
                    ActiveResidents = table.Column<int>(nullable: false),
                    AvgEducationProgress = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    AvgHealthScore = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    ProcessRecordingCount = table.Column<int>(nullable: false),
                    HomeVisitationCount = table.Column<int>(nullable: false),
                    IncidentCount = table.Column<int>(nullable: false),
                    Notes = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafehouseMonthlyMetrics", x => x.MetricId);
                    table.ForeignKey("FK_SafehouseMonthlyMetrics_Safehouses_SafehouseId", x => x.SafehouseId, "Safehouses", "SafehouseId", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProcessRecordings",
                columns: table => new
                {
                    RecordingId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(nullable: false),
                    SessionDate = table.Column<DateOnly>(nullable: false),
                    SocialWorker = table.Column<string>(maxLength: 200, nullable: false),
                    SessionType = table.Column<string>(maxLength: 20, nullable: false),
                    SessionDurationMinutes = table.Column<int>(nullable: false),
                    EmotionalStateObserved = table.Column<string>(maxLength: 30, nullable: false),
                    EmotionalStateEnd = table.Column<string>(maxLength: 30, nullable: false),
                    SessionNarrative = table.Column<string>(nullable: false),
                    InterventionsApplied = table.Column<string>(nullable: true),
                    FollowUpActions = table.Column<string>(nullable: true),
                    ProgressNoted = table.Column<bool>(nullable: false),
                    ConcernsFlagged = table.Column<bool>(nullable: false),
                    ReferralMade = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessRecordings", x => x.RecordingId);
                    table.ForeignKey("FK_ProcessRecordings_Residents_ResidentId", x => x.ResidentId, "Residents", "ResidentId", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HomeVisitations",
                columns: table => new
                {
                    VisitationId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(nullable: false),
                    VisitDate = table.Column<DateOnly>(nullable: false),
                    SocialWorker = table.Column<string>(maxLength: 200, nullable: false),
                    VisitType = table.Column<string>(maxLength: 50, nullable: false),
                    LocationVisited = table.Column<string>(maxLength: 300, nullable: true),
                    FamilyMembersPresent = table.Column<string>(maxLength: 300, nullable: true),
                    Purpose = table.Column<string>(nullable: true),
                    Observations = table.Column<string>(nullable: true),
                    FamilyCooperationLevel = table.Column<string>(maxLength: 30, nullable: false),
                    SafetyConcernsNoted = table.Column<bool>(nullable: false),
                    FollowUpNeeded = table.Column<bool>(nullable: false),
                    FollowUpNotes = table.Column<string>(nullable: true),
                    VisitOutcome = table.Column<string>(maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HomeVisitations", x => x.VisitationId);
                    table.ForeignKey("FK_HomeVisitations_Residents_ResidentId", x => x.ResidentId, "Residents", "ResidentId", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EducationRecords",
                columns: table => new
                {
                    EducationRecordId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(nullable: false),
                    RecordDate = table.Column<DateOnly>(nullable: false),
                    ProgramName = table.Column<string>(maxLength: 50, nullable: false),
                    CourseName = table.Column<string>(maxLength: 50, nullable: false),
                    EducationLevel = table.Column<string>(maxLength: 30, nullable: false),
                    AttendanceStatus = table.Column<string>(maxLength: 20, nullable: false),
                    AttendanceRate = table.Column<decimal>(type: "decimal(5,4)", nullable: false),
                    ProgressPercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    CompletionStatus = table.Column<string>(maxLength: 20, nullable: false),
                    GpaLikeScore = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    Notes = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationRecords", x => x.EducationRecordId);
                    table.ForeignKey("FK_EducationRecords_Residents_ResidentId", x => x.ResidentId, "Residents", "ResidentId", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HealthWellbeingRecords",
                columns: table => new
                {
                    HealthRecordId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(nullable: false),
                    RecordDate = table.Column<DateOnly>(nullable: false),
                    WeightKg = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    HeightCm = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Bmi = table.Column<decimal>(type: "decimal(4,2)", nullable: false),
                    NutritionScore = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    SleepScore = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    EnergyScore = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    GeneralHealthScore = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    MedicalCheckupDone = table.Column<bool>(nullable: false),
                    DentalCheckupDone = table.Column<bool>(nullable: false),
                    PsychologicalCheckupDone = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthWellbeingRecords", x => x.HealthRecordId);
                    table.ForeignKey("FK_HealthWellbeingRecords_Residents_ResidentId", x => x.ResidentId, "Residents", "ResidentId", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InterventionPlans",
                columns: table => new
                {
                    PlanId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(nullable: false),
                    PlanCategory = table.Column<string>(maxLength: 50, nullable: false),
                    PlanDescription = table.Column<string>(nullable: false),
                    ServicesProvided = table.Column<string>(nullable: true),
                    TargetValue = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    TargetDate = table.Column<DateOnly>(nullable: false),
                    Status = table.Column<string>(maxLength: 20, nullable: false),
                    CaseConferenceDate = table.Column<DateOnly>(nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterventionPlans", x => x.PlanId);
                    table.ForeignKey("FK_InterventionPlans_Residents_ResidentId", x => x.ResidentId, "Residents", "ResidentId", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IncidentReports",
                columns: table => new
                {
                    IncidentId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(nullable: false),
                    SafehouseId = table.Column<int>(nullable: false),
                    IncidentDate = table.Column<DateOnly>(nullable: false),
                    IncidentType = table.Column<string>(maxLength: 50, nullable: false),
                    Severity = table.Column<string>(maxLength: 20, nullable: false),
                    Description = table.Column<string>(nullable: false),
                    ResponseTaken = table.Column<string>(nullable: true),
                    Resolved = table.Column<bool>(nullable: false),
                    ResolutionDate = table.Column<DateOnly>(nullable: true),
                    ReportedBy = table.Column<string>(maxLength: 200, nullable: false),
                    FollowUpRequired = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentReports", x => x.IncidentId);
                    table.ForeignKey("FK_IncidentReports_Residents_ResidentId", x => x.ResidentId, "Residents", "ResidentId", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_IncidentReports_Safehouses_SafehouseId", x => x.SafehouseId, "Safehouses", "SafehouseId", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DonationAllocations",
                columns: table => new
                {
                    AllocationId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    DonationId = table.Column<int>(nullable: false),
                    SafehouseId = table.Column<int>(nullable: false),
                    ProgramArea = table.Column<string>(maxLength: 50, nullable: false),
                    AmountAllocated = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AllocationDate = table.Column<DateOnly>(nullable: false),
                    AllocationNotes = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonationAllocations", x => x.AllocationId);
                    table.ForeignKey("FK_DonationAllocations_Donations_DonationId", x => x.DonationId, "Donations", "DonationId", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey("FK_DonationAllocations_Safehouses_SafehouseId", x => x.SafehouseId, "Safehouses", "SafehouseId", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InKindDonationItems",
                columns: table => new
                {
                    ItemId = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    DonationId = table.Column<int>(nullable: false),
                    ItemName = table.Column<string>(maxLength: 200, nullable: false),
                    ItemCategory = table.Column<string>(maxLength: 50, nullable: false),
                    Quantity = table.Column<int>(nullable: false),
                    UnitOfMeasure = table.Column<string>(maxLength: 20, nullable: false),
                    EstimatedUnitValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IntendedUse = table.Column<string>(maxLength: 50, nullable: true),
                    ReceivedCondition = table.Column<string>(maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InKindDonationItems", x => x.ItemId);
                    table.ForeignKey("FK_InKindDonationItems_Donations_DonationId", x => x.DonationId, "Donations", "DonationId", onDelete: ReferentialAction.Cascade);
                });

            // Unique indexes
            migrationBuilder.CreateIndex("IX_Safehouses_SafehouseCode", "Safehouses", "SafehouseCode", unique: true);
            migrationBuilder.CreateIndex("IX_Residents_CaseControlNo", "Residents", "CaseControlNo", unique: true);
            migrationBuilder.CreateIndex("IX_Residents_SafehouseId", "Residents", "SafehouseId");
            migrationBuilder.CreateIndex("IX_Donations_SupporterId", "Donations", "SupporterId");
            migrationBuilder.CreateIndex("IX_SafehouseMonthlyMetrics_SafehouseId", "SafehouseMonthlyMetrics", "SafehouseId");
            migrationBuilder.CreateIndex("IX_ProcessRecordings_ResidentId", "ProcessRecordings", "ResidentId");
            migrationBuilder.CreateIndex("IX_HomeVisitations_ResidentId", "HomeVisitations", "ResidentId");
            migrationBuilder.CreateIndex("IX_EducationRecords_ResidentId", "EducationRecords", "ResidentId");
            migrationBuilder.CreateIndex("IX_HealthWellbeingRecords_ResidentId", "HealthWellbeingRecords", "ResidentId");
            migrationBuilder.CreateIndex("IX_InterventionPlans_ResidentId", "InterventionPlans", "ResidentId");
            migrationBuilder.CreateIndex("IX_IncidentReports_ResidentId", "IncidentReports", "ResidentId");
            migrationBuilder.CreateIndex("IX_IncidentReports_SafehouseId", "IncidentReports", "SafehouseId");
            migrationBuilder.CreateIndex("IX_DonationAllocations_DonationId", "DonationAllocations", "DonationId");
            migrationBuilder.CreateIndex("IX_DonationAllocations_SafehouseId", "DonationAllocations", "SafehouseId");
            migrationBuilder.CreateIndex("IX_InKindDonationItems_DonationId", "InKindDonationItems", "DonationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable("InKindDonationItems");
            migrationBuilder.DropTable("DonationAllocations");
            migrationBuilder.DropTable("IncidentReports");
            migrationBuilder.DropTable("InterventionPlans");
            migrationBuilder.DropTable("HealthWellbeingRecords");
            migrationBuilder.DropTable("EducationRecords");
            migrationBuilder.DropTable("HomeVisitations");
            migrationBuilder.DropTable("ProcessRecordings");
            migrationBuilder.DropTable("SafehouseMonthlyMetrics");
            migrationBuilder.DropTable("Donations");
            migrationBuilder.DropTable("Residents");
            migrationBuilder.DropTable("Supporters");
            migrationBuilder.DropTable("SocialMediaPosts");
            migrationBuilder.DropTable("PublicImpactSnapshots");
            migrationBuilder.DropTable("Partners");
            migrationBuilder.DropTable("Safehouses");
        }
    }
}
