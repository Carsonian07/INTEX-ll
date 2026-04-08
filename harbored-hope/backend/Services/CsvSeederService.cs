using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using HarboredHope.API.Data;
using HarboredHope.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HarboredHope.API.Services;

/// <summary>
/// Reads the 17 Lighthouse CSV files from the /data folder and seeds the operational database.
/// Run once: POST /api/admin/seed-csv (Admin role required)
/// CSV files must be placed in: backend/data/*.csv
/// </summary>
public class CsvSeederService(AppDbContext db, ILogger<CsvSeederService> logger)
{
    private static CsvConfiguration CsvConfig => new(CultureInfo.InvariantCulture)
    {
        HasHeaderRecord = true,
        MissingFieldFound = null,
        BadDataFound = null,
        TrimOptions = TrimOptions.Trim,
    };

    public async Task<SeedResult> SeedAllAsync(string dataFolder)
    {
        var result = new SeedResult();

        if (!Directory.Exists(dataFolder))
        {
            result.Errors.Add($"Data folder not found: {dataFolder}");
            return result;
        }

        // Order matters — parents before children
        await SeedSafehouses(dataFolder, result);
        await SeedPartners(dataFolder, result);
        await SeedSupporters(dataFolder, result);
        await SeedDonations(dataFolder, result);
        await SeedInKindItems(dataFolder, result);
        await SeedAllocations(dataFolder, result);
        await SeedResidents(dataFolder, result);
        await SeedProcessRecordings(dataFolder, result);
        await SeedHomeVisitations(dataFolder, result);
        await SeedEducationRecords(dataFolder, result);
        await SeedHealthRecords(dataFolder, result);
        await SeedInterventionPlans(dataFolder, result);
        await SeedIncidentReports(dataFolder, result);
        await SeedSocialMediaPosts(dataFolder, result);
        await SeedMonthlyMetrics(dataFolder, result);
        await SeedPublicSnapshots(dataFolder, result);

        return result;
    }

    // ─── Safehouses ───────────────────────────────────────────────────────────
    private async Task SeedSafehouses(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "safehouses.csv");
        if (!File.Exists(file)) { result.Skipped.Add("safehouses.csv"); return; }
        if (await db.Safehouses.AnyAsync()) { result.Skipped.Add("safehouses (already seeded)"); return; }

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<SafehouseCsvRow>().ToList();

        foreach (var r in records)
        {
            db.Safehouses.Add(new Safehouse
            {
                SafehouseCode    = r.safehouse_code ?? "",
                Name             = r.name ?? "",
                Region           = r.region ?? "",
                City             = r.city ?? "",
                Province         = r.province ?? "",
                Country          = r.country ?? "Philippines",
                OpenDate         = ParseDate(r.open_date),
                Status           = r.status ?? "Active",
                CapacityGirls    = ParseInt(r.capacity_girls),
                CapacityStaff    = ParseInt(r.capacity_staff),
                CurrentOccupancy = ParseInt(r.current_occupancy),
                Notes            = r.notes
            });
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"safehouses: {records.Count}");
        logger.LogInformation("Seeded {Count} safehouses", records.Count);
    }

    // ─── Partners ─────────────────────────────────────────────────────────────
    private async Task SeedPartners(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "partners.csv");
        if (!File.Exists(file)) { result.Skipped.Add("partners.csv"); return; }
        if (await db.Partners.AnyAsync()) { result.Skipped.Add("partners (already seeded)"); return; }

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<PartnerCsvRow>().ToList();

        foreach (var r in records)
        {
            db.Partners.Add(new Partner
            {
                PartnerName  = r.partner_name ?? "",
                PartnerType  = r.partner_type ?? "",
                RoleType     = r.role_type ?? "",
                ContactName  = r.contact_name,
                Email        = r.email,
                Phone        = r.phone,
                Region       = r.region,
                Status       = r.status ?? "Active",
                StartDate    = ParseDate(r.start_date),
                EndDate      = ParseDateNullable(r.end_date),
                Notes        = r.notes
            });
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"partners: {records.Count}");
    }

    // ─── Supporters ───────────────────────────────────────────────────────────
    private async Task SeedSupporters(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "supporters.csv");
        if (!File.Exists(file)) { result.Skipped.Add("supporters.csv"); return; }
        if (await db.Supporters.AnyAsync()) { result.Skipped.Add("supporters (already seeded)"); return; }

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<SupporterCsvRow>().ToList();

        foreach (var r in records)
        {
            db.Supporters.Add(new Supporter
            {
                SupporterType     = r.supporter_type ?? "",
                DisplayName       = r.display_name ?? "",
                OrganizationName  = r.organization_name,
                FirstName         = r.first_name,
                LastName          = r.last_name,
                RelationshipType  = r.relationship_type ?? "",
                Region            = r.region,
                Country           = r.country,
                Email             = r.email,
                Phone             = r.phone,
                Status            = r.status ?? "Active",
                FirstDonationDate = ParseDateNullable(r.first_donation_date),
                AcquisitionChannel = r.acquisition_channel,
                CreatedAt         = ParseDateTime(r.created_at)
            });
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"supporters: {records.Count}");
    }

    // ─── Donations ────────────────────────────────────────────────────────────
    private async Task SeedDonations(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "donations.csv");
        if (!File.Exists(file)) { result.Skipped.Add("donations.csv"); return; }
        if (await db.Donations.AnyAsync()) { result.Skipped.Add("donations (already seeded)"); return; }

        var supporterIds = await db.Supporters.Select(s => s.SupporterId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<DonationCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var sid = ParseInt(r.supporter_id);
            if (!supporterIds.Contains(sid)) continue; // skip orphans

            db.Donations.Add(new Donation
            {
                SupporterId       = sid,
                DonationType      = r.donation_type ?? "",
                DonationDate      = ParseDate(r.donation_date),
                ChannelSource     = r.channel_source,
                CurrencyCode      = r.currency_code,
                Amount            = ParseDecimalNullable(r.amount),
                EstimatedValue    = ParseDecimalNullable(r.estimated_value),
                ImpactUnit        = r.impact_unit,
                IsRecurring       = ParseBool(r.is_recurring),
                CampaignName      = r.campaign_name,
                Notes             = r.notes
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"donations: {count}");
    }

    // ─── InKind Items ─────────────────────────────────────────────────────────
    private async Task SeedInKindItems(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "in_kind_donation_items.csv");
        if (!File.Exists(file)) { result.Skipped.Add("in_kind_donation_items.csv"); return; }
        if (await db.InKindDonationItems.AnyAsync()) { result.Skipped.Add("in_kind_donation_items (already seeded)"); return; }

        var donationIds = await db.Donations.Select(d => d.DonationId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<InKindItemCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var did = ParseInt(r.donation_id);
            if (!donationIds.Contains(did)) continue;

            db.InKindDonationItems.Add(new InKindDonationItem
            {
                DonationId         = did,
                ItemName           = r.item_name ?? "",
                ItemCategory       = r.item_category ?? "",
                Quantity           = ParseInt(r.quantity),
                UnitOfMeasure      = r.unit_of_measure ?? "",
                EstimatedUnitValue = ParseDecimal(r.estimated_unit_value),
                IntendedUse        = r.intended_use,
                ReceivedCondition  = r.received_condition ?? ""
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"in_kind_donation_items: {count}");
    }

    // ─── Allocations ──────────────────────────────────────────────────────────
    private async Task SeedAllocations(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "donation_allocations.csv");
        if (!File.Exists(file)) { result.Skipped.Add("donation_allocations.csv"); return; }
        if (await db.DonationAllocations.AnyAsync()) { result.Skipped.Add("donation_allocations (already seeded)"); return; }

        var donationIds  = await db.Donations.Select(d => d.DonationId).ToHashSetAsync();
        var safehouseIds = await db.Safehouses.Select(s => s.SafehouseId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<AllocationCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var did = ParseInt(r.donation_id);
            var sid = ParseInt(r.safehouse_id);
            if (!donationIds.Contains(did) || !safehouseIds.Contains(sid)) continue;

            db.DonationAllocations.Add(new DonationAllocation
            {
                DonationId       = did,
                SafehouseId      = sid,
                ProgramArea      = r.program_area ?? "",
                AmountAllocated  = ParseDecimal(r.amount_allocated),
                AllocationDate   = ParseDate(r.allocation_date),
                AllocationNotes  = r.allocation_notes
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"donation_allocations: {count}");
    }

    // ─── Residents ────────────────────────────────────────────────────────────
    private async Task SeedResidents(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "residents.csv");
        if (!File.Exists(file)) { result.Skipped.Add("residents.csv"); return; }
        if (await db.Residents.AnyAsync()) { result.Skipped.Add("residents (already seeded)"); return; }

        var safehouseIds = await db.Safehouses.Select(s => s.SafehouseId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<ResidentCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var sid = ParseInt(r.safehouse_id);
            if (!safehouseIds.Contains(sid)) continue;

            db.Residents.Add(new Resident
            {
                CaseControlNo        = r.case_control_no ?? "",
                InternalCode         = r.internal_code ?? "",
                SafehouseId          = sid,
                CaseStatus           = r.case_status ?? "Active",
                Sex                  = r.sex ?? "F",
                DateOfBirth          = ParseDate(r.date_of_birth),
                BirthStatus          = r.birth_status ?? "",
                PlaceOfBirth         = r.place_of_birth,
                Religion             = r.religion,
                CaseCategory         = r.case_category ?? "",
                SubCatOrphaned       = ParseBool(r.sub_cat_orphaned),
                SubCatTrafficked     = ParseBool(r.sub_cat_trafficked),
                SubCatChildLabor     = ParseBool(r.sub_cat_child_labor),
                SubCatPhysicalAbuse  = ParseBool(r.sub_cat_physical_abuse),
                SubCatSexualAbuse    = ParseBool(r.sub_cat_sexual_abuse),
                SubCatOsaec          = ParseBool(r.sub_cat_osaec),
                SubCatCicl           = ParseBool(r.sub_cat_cicl),
                SubCatAtRisk         = ParseBool(r.sub_cat_at_risk),
                SubCatStreetChild    = ParseBool(r.sub_cat_street_child),
                SubCatChildWithHiv   = ParseBool(r.sub_cat_child_with_hiv),
                IsPwd                = ParseBool(r.is_pwd),
                PwdType              = r.pwd_type,
                HasSpecialNeeds      = ParseBool(r.has_special_needs),
                SpecialNeedsDiagnosis = r.special_needs_diagnosis,
                FamilyIs4Ps          = ParseBool(r.family_is_4ps),
                FamilySoloParent     = ParseBool(r.family_solo_parent),
                FamilyIndigenous     = ParseBool(r.family_indigenous),
                FamilyParentPwd      = ParseBool(r.family_parent_pwd),
                FamilyInformalSettler = ParseBool(r.family_informal_settler),
                DateOfAdmission      = ParseDate(r.date_of_admission),
                AgeUponAdmission     = r.age_upon_admission,
                ReferralSource       = r.referral_source ?? "",
                ReferringAgencyPerson = r.referring_agency_person,
                AssignedSocialWorker = r.assigned_social_worker,
                InitialCaseAssessment = r.initial_case_assessment,
                DateCaseStudyPrepared = ParseDateNullable(r.date_case_study_prepared),
                ReintegrationType    = r.reintegration_type,
                ReintegrationStatus  = r.reintegration_status,
                InitialRiskLevel     = r.initial_risk_level ?? "Medium",
                CurrentRiskLevel     = r.current_risk_level ?? "Medium",
                DateClosed           = ParseDateNullable(r.date_closed),
                CreatedAt            = ParseDateTime(r.created_at)
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"residents: {count}");
        logger.LogInformation("Seeded {Count} residents", count);
    }

    // ─── Process Recordings ───────────────────────────────────────────────────
    private async Task SeedProcessRecordings(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "process_recordings.csv");
        if (!File.Exists(file)) { result.Skipped.Add("process_recordings.csv"); return; }
        if (await db.ProcessRecordings.AnyAsync()) { result.Skipped.Add("process_recordings (already seeded)"); return; }

        var residentIds = await db.Residents.Select(r => r.ResidentId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<ProcessRecordingCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var rid = ParseInt(r.resident_id);
            if (!residentIds.Contains(rid)) continue;

            db.ProcessRecordings.Add(new ProcessRecording
            {
                ResidentId              = rid,
                SessionDate             = ParseDate(r.session_date),
                SocialWorker            = r.social_worker ?? "",
                SessionType             = r.session_type ?? "Individual",
                SessionDurationMinutes  = ParseInt(r.session_duration_minutes),
                EmotionalStateObserved  = r.emotional_state_observed ?? "",
                EmotionalStateEnd       = r.emotional_state_end ?? "",
                SessionNarrative        = r.session_narrative ?? "",
                InterventionsApplied    = r.interventions_applied,
                FollowUpActions         = r.follow_up_actions,
                ProgressNoted           = ParseBool(r.progress_noted),
                ConcernsFlagged         = ParseBool(r.concerns_flagged),
                ReferralMade            = ParseBool(r.referral_made)
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"process_recordings: {count}");
    }

    // ─── Home Visitations ─────────────────────────────────────────────────────
    private async Task SeedHomeVisitations(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "home_visitations.csv");
        if (!File.Exists(file)) { result.Skipped.Add("home_visitations.csv"); return; }
        if (await db.HomeVisitations.AnyAsync()) { result.Skipped.Add("home_visitations (already seeded)"); return; }

        var residentIds = await db.Residents.Select(r => r.ResidentId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<HomeVisitationCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var rid = ParseInt(r.resident_id);
            if (!residentIds.Contains(rid)) continue;

            db.HomeVisitations.Add(new HomeVisitation
            {
                ResidentId            = rid,
                VisitDate             = ParseDate(r.visit_date),
                SocialWorker          = r.social_worker ?? "",
                VisitType             = r.visit_type ?? "",
                LocationVisited       = r.location_visited,
                FamilyMembersPresent  = r.family_members_present,
                Purpose               = r.purpose,
                Observations          = r.observations,
                FamilyCooperationLevel = r.family_cooperation_level ?? "",
                SafetyConcernsNoted   = ParseBool(r.safety_concerns_noted),
                FollowUpNeeded        = ParseBool(r.follow_up_needed),
                FollowUpNotes         = r.follow_up_notes,
                VisitOutcome          = r.visit_outcome ?? ""
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"home_visitations: {count}");
    }

    // ─── Education Records ────────────────────────────────────────────────────
    private async Task SeedEducationRecords(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "education_records.csv");
        if (!File.Exists(file)) { result.Skipped.Add("education_records.csv"); return; }
        if (await db.EducationRecords.AnyAsync()) { result.Skipped.Add("education_records (already seeded)"); return; }

        var residentIds = await db.Residents.Select(r => r.ResidentId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<EducationRecordCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var rid = ParseInt(r.resident_id);
            if (!residentIds.Contains(rid)) continue;

            db.EducationRecords.Add(new EducationRecord
            {
                ResidentId        = rid,
                RecordDate        = ParseDate(r.record_date),
                EducationLevel    = r.education_level ?? "",
                SchoolName        = r.school_name,
                EnrollmentStatus  = r.enrollment_status ?? "",
                AttendanceRate    = ParseDecimal(r.attendance_rate),
                ProgressPercent   = ParseDecimal(r.progress_percent),
                CompletionStatus  = r.completion_status ?? "",
                Notes             = r.notes
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"education_records: {count}");
    }

    // ─── Health Records ───────────────────────────────────────────────────────
    private async Task SeedHealthRecords(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "health_wellbeing_records.csv");
        if (!File.Exists(file)) { result.Skipped.Add("health_wellbeing_records.csv"); return; }
        if (await db.HealthWellbeingRecords.AnyAsync()) { result.Skipped.Add("health_wellbeing_records (already seeded)"); return; }

        var residentIds = await db.Residents.Select(r => r.ResidentId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<HealthRecordCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var rid = ParseInt(r.resident_id);
            if (!residentIds.Contains(rid)) continue;

            db.HealthWellbeingRecords.Add(new HealthWellbeingRecord
            {
                ResidentId              = rid,
                RecordDate              = ParseDate(r.record_date),
                WeightKg                = ParseDecimal(r.weight_kg),
                HeightCm                = ParseDecimal(r.height_cm),
                Bmi                     = ParseDecimal(r.bmi),
                NutritionScore          = ParseDecimal(r.nutrition_score),
                SleepScore              = ParseDecimal(r.sleep_score),
                EnergyScore             = ParseDecimal(r.energy_score),
                GeneralHealthScore      = ParseDecimal(r.general_health_score),
                MedicalCheckupDone      = ParseBool(r.medical_checkup_done),
                DentalCheckupDone       = ParseBool(r.dental_checkup_done),
                PsychologicalCheckupDone = ParseBool(r.psychological_checkup_done)
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"health_wellbeing_records: {count}");
    }

    // ─── Intervention Plans ───────────────────────────────────────────────────
    private async Task SeedInterventionPlans(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "intervention_plans.csv");
        if (!File.Exists(file)) { result.Skipped.Add("intervention_plans.csv"); return; }
        if (await db.InterventionPlans.AnyAsync()) { result.Skipped.Add("intervention_plans (already seeded)"); return; }

        var residentIds = await db.Residents.Select(r => r.ResidentId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<InterventionPlanCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var rid = ParseInt(r.resident_id);
            if (!residentIds.Contains(rid)) continue;

            db.InterventionPlans.Add(new InterventionPlan
            {
                ResidentId          = rid,
                PlanCategory        = r.plan_category ?? "",
                PlanDescription     = r.plan_description ?? "",
                ServicesProvided    = r.services_provided,
                TargetValue         = ParseDecimalNullable(r.target_value),
                TargetDate          = ParseDate(r.target_date),
                Status              = r.status ?? "Open",
                CaseConferenceDate  = ParseDateNullable(r.case_conference_date),
                CreatedAt           = ParseDateTime(r.created_at),
                UpdatedAt           = ParseDateTime(r.updated_at)
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"intervention_plans: {count}");
    }

    // ─── Incident Reports ─────────────────────────────────────────────────────
    private async Task SeedIncidentReports(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "incident_reports.csv");
        if (!File.Exists(file)) { result.Skipped.Add("incident_reports.csv"); return; }
        if (await db.IncidentReports.AnyAsync()) { result.Skipped.Add("incident_reports (already seeded)"); return; }

        var residentIds  = await db.Residents.Select(r => r.ResidentId).ToHashSetAsync();
        var safehouseIds = await db.Safehouses.Select(s => s.SafehouseId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<IncidentReportCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var rid = ParseInt(r.resident_id);
            var sid = ParseInt(r.safehouse_id);
            if (!residentIds.Contains(rid) || !safehouseIds.Contains(sid)) continue;

            db.IncidentReports.Add(new IncidentReport
            {
                ResidentId       = rid,
                SafehouseId      = sid,
                IncidentDate     = ParseDate(r.incident_date),
                IncidentType     = r.incident_type ?? "",
                Severity         = r.severity ?? "",
                Description      = r.description ?? "",
                ResponseTaken    = r.response_taken,
                Resolved         = ParseBool(r.resolved),
                ResolutionDate   = ParseDateNullable(r.resolution_date),
                ReportedBy       = r.reported_by ?? "",
                FollowUpRequired = ParseBool(r.follow_up_required)
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"incident_reports: {count}");
    }

    // ─── Social Media Posts ───────────────────────────────────────────────────
    private async Task SeedSocialMediaPosts(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "social_media_posts.csv");
        if (!File.Exists(file)) { result.Skipped.Add("social_media_posts.csv"); return; }
        if (await db.SocialMediaPosts.AnyAsync()) { result.Skipped.Add("social_media_posts (already seeded)"); return; }

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<SocialMediaPostCsvRow>().ToList();

        foreach (var r in records)
        {
            db.SocialMediaPosts.Add(new SocialMediaPost
            {
                Platform               = r.platform ?? "",
                PlatformPostId         = r.platform_post_id,
                PostUrl                = r.post_url,
                CreatedAt              = ParseDateTime(r.created_at),
                DayOfWeek              = r.day_of_week,
                PostHour               = ParseInt(r.post_hour),
                PostType               = r.post_type ?? "",
                MediaType              = r.media_type ?? "",
                Caption                = r.caption,
                Hashtags               = r.hashtags,
                NumHashtags            = ParseInt(r.num_hashtags),
                MentionsCount          = ParseInt(r.mentions_count),
                HasCallToAction        = ParseBool(r.has_call_to_action),
                CallToActionType       = r.call_to_action_type,
                ContentTopic           = r.content_topic,
                SentimentTone          = r.sentiment_tone,
                CaptionLength          = ParseInt(r.caption_length),
                FeaturesResidentStory  = ParseBool(r.features_resident_story),
                CampaignName           = r.campaign_name,
                IsBoosted              = ParseBool(r.is_boosted),
                BoostBudgetPhp         = ParseDecimalNullable(r.boost_budget_php),
                Impressions            = ParseInt(r.impressions),
                Reach                  = ParseInt(r.reach),
                Likes                  = ParseInt(r.likes),
                Comments               = ParseInt(r.comments),
                Shares                 = ParseInt(r.shares),
                Saves                  = ParseInt(r.saves),
                ClickThroughs          = ParseInt(r.click_throughs),
                VideoViews             = ParseIntNullable(r.video_views),
                EngagementRate         = ParseDecimal(r.engagement_rate),
                ProfileVisits          = ParseInt(r.profile_visits),
                DonationReferrals      = ParseInt(r.donation_referrals),
                EstimatedDonationValuePhp = ParseDecimal(r.estimated_donation_value_php),
                FollowerCountAtPost    = ParseInt(r.follower_count_at_post)
            });
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"social_media_posts: {records.Count}");
    }

    // ─── Monthly Metrics ──────────────────────────────────────────────────────
    private async Task SeedMonthlyMetrics(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "safehouse_monthly_metrics.csv");
        if (!File.Exists(file)) { result.Skipped.Add("safehouse_monthly_metrics.csv"); return; }
        if (await db.SafehouseMonthlyMetrics.AnyAsync()) { result.Skipped.Add("safehouse_monthly_metrics (already seeded)"); return; }

        var safehouseIds = await db.Safehouses.Select(s => s.SafehouseId).ToHashSetAsync();

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<MonthlyMetricCsvRow>().ToList();
        int count = 0;

        foreach (var r in records)
        {
            var sid = ParseInt(r.safehouse_id);
            if (!safehouseIds.Contains(sid)) continue;

            db.SafehouseMonthlyMetrics.Add(new SafehouseMonthlyMetric
            {
                SafehouseId            = sid,
                MonthStart             = ParseDate(r.month_start),
                MonthEnd               = ParseDate(r.month_end),
                ActiveResidents        = ParseInt(r.active_residents),
                AvgEducationProgress   = ParseDecimal(r.avg_education_progress),
                AvgHealthScore         = ParseDecimal(r.avg_health_score),
                ProcessRecordingCount  = ParseInt(r.process_recording_count),
                HomeVisitationCount    = ParseInt(r.home_visitation_count),
                IncidentCount          = ParseInt(r.incident_count),
                Notes                  = r.notes
            });
            count++;
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"safehouse_monthly_metrics: {count}");
    }

    // ─── Public Impact Snapshots ──────────────────────────────────────────────
    private async Task SeedPublicSnapshots(string folder, SeedResult result)
    {
        var file = Path.Combine(folder, "public_impact_snapshots.csv");
        if (!File.Exists(file)) { result.Skipped.Add("public_impact_snapshots.csv"); return; }
        if (await db.PublicImpactSnapshots.AnyAsync()) { result.Skipped.Add("public_impact_snapshots (already seeded)"); return; }

        using var reader = new StreamReader(file);
        using var csv = new CsvReader(reader, CsvConfig);
        var records = csv.GetRecords<SnapshotCsvRow>().ToList();

        foreach (var r in records)
        {
            db.PublicImpactSnapshots.Add(new PublicImpactSnapshot
            {
                SnapshotDate      = ParseDate(r.snapshot_date),
                Headline          = r.headline ?? "",
                SummaryText       = r.summary_text ?? "",
                MetricPayloadJson = r.metric_payload_json,
                IsPublished       = ParseBool(r.is_published),
                PublishedAt       = ParseDateNullable(r.published_at)
            });
        }

        await db.SaveChangesAsync();
        result.Seeded.Add($"public_impact_snapshots: {records.Count}");
    }

    // ─── Parse helpers ────────────────────────────────────────────────────────
    private static DateOnly ParseDate(string? s)
        => DateOnly.TryParse(s, out var d) ? d : DateOnly.FromDateTime(DateTime.Today);

    private static DateOnly? ParseDateNullable(string? s)
        => string.IsNullOrWhiteSpace(s) ? null : DateOnly.TryParse(s, out var d) ? d : null;

    private static string? ParseDateTime(string? s)
        => string.IsNullOrWhiteSpace(s) ? DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") : s;

    private static int ParseInt(string? s)
        => int.TryParse(s, out var i) ? i : 0;

    private static int? ParseIntNullable(string? s)
        => string.IsNullOrWhiteSpace(s) ? null : int.TryParse(s, out var i) ? i : null;

    private static decimal ParseDecimal(string? s)
        => decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : 0m;

    private static decimal? ParseDecimalNullable(string? s)
        => string.IsNullOrWhiteSpace(s) ? null
           : decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : null;

    private static bool ParseBool(string? s)
        => s?.Trim().ToLower() is "true" or "1" or "yes";
}

// ─── Result type ──────────────────────────────────────────────────────────────
public class SeedResult
{
    public List<string> Seeded  { get; } = [];
    public List<string> Skipped { get; } = [];
    public List<string> Errors  { get; } = [];
    public bool Success => !Errors.Any();
}

// ─── CSV row classes (snake_case matching CSV headers) ────────────────────────
public class SafehouseCsvRow        { public string? safehouse_code { get; set; } public string? name { get; set; } public string? region { get; set; } public string? city { get; set; } public string? province { get; set; } public string? country { get; set; } public string? open_date { get; set; } public string? status { get; set; } public string? capacity_girls { get; set; } public string? capacity_staff { get; set; } public string? current_occupancy { get; set; } public string? notes { get; set; } }
public class PartnerCsvRow          { public string? partner_name { get; set; } public string? partner_type { get; set; } public string? role_type { get; set; } public string? contact_name { get; set; } public string? email { get; set; } public string? phone { get; set; } public string? region { get; set; } public string? status { get; set; } public string? start_date { get; set; } public string? end_date { get; set; } public string? notes { get; set; } }
public class SupporterCsvRow        { public string? supporter_type { get; set; } public string? display_name { get; set; } public string? organization_name { get; set; } public string? first_name { get; set; } public string? last_name { get; set; } public string? relationship_type { get; set; } public string? region { get; set; } public string? country { get; set; } public string? email { get; set; } public string? phone { get; set; } public string? status { get; set; } public string? first_donation_date { get; set; } public string? acquisition_channel { get; set; } public string? created_at { get; set; } }
public class DonationCsvRow         { public string? supporter_id { get; set; } public string? donation_type { get; set; } public string? donation_date { get; set; } public string? channel_source { get; set; } public string? currency_code { get; set; } public string? amount { get; set; } public string? estimated_value { get; set; } public string? impact_unit { get; set; } public string? is_recurring { get; set; } public string? campaign_name { get; set; } public string? notes { get; set; } }
public class InKindItemCsvRow       { public string? donation_id { get; set; } public string? item_name { get; set; } public string? item_category { get; set; } public string? quantity { get; set; } public string? unit_of_measure { get; set; } public string? estimated_unit_value { get; set; } public string? intended_use { get; set; } public string? received_condition { get; set; } }
public class AllocationCsvRow       { public string? donation_id { get; set; } public string? safehouse_id { get; set; } public string? program_area { get; set; } public string? amount_allocated { get; set; } public string? allocation_date { get; set; } public string? allocation_notes { get; set; } }
public class ResidentCsvRow         { public string? case_control_no { get; set; } public string? internal_code { get; set; } public string? safehouse_id { get; set; } public string? case_status { get; set; } public string? sex { get; set; } public string? date_of_birth { get; set; } public string? birth_status { get; set; } public string? place_of_birth { get; set; } public string? religion { get; set; } public string? case_category { get; set; } public string? sub_cat_orphaned { get; set; } public string? sub_cat_trafficked { get; set; } public string? sub_cat_child_labor { get; set; } public string? sub_cat_physical_abuse { get; set; } public string? sub_cat_sexual_abuse { get; set; } public string? sub_cat_osaec { get; set; } public string? sub_cat_cicl { get; set; } public string? sub_cat_at_risk { get; set; } public string? sub_cat_street_child { get; set; } public string? sub_cat_child_with_hiv { get; set; } public string? is_pwd { get; set; } public string? pwd_type { get; set; } public string? has_special_needs { get; set; } public string? special_needs_diagnosis { get; set; } public string? family_is_4ps { get; set; } public string? family_solo_parent { get; set; } public string? family_indigenous { get; set; } public string? family_parent_pwd { get; set; } public string? family_informal_settler { get; set; } public string? date_of_admission { get; set; } public string? age_upon_admission { get; set; } public string? referral_source { get; set; } public string? referring_agency_person { get; set; } public string? assigned_social_worker { get; set; } public string? initial_case_assessment { get; set; } public string? date_case_study_prepared { get; set; } public string? reintegration_type { get; set; } public string? reintegration_status { get; set; } public string? initial_risk_level { get; set; } public string? current_risk_level { get; set; } public string? date_closed { get; set; } public string? created_at { get; set; } }
public class ProcessRecordingCsvRow { public string? resident_id { get; set; } public string? session_date { get; set; } public string? social_worker { get; set; } public string? session_type { get; set; } public string? session_duration_minutes { get; set; } public string? emotional_state_observed { get; set; } public string? emotional_state_end { get; set; } public string? session_narrative { get; set; } public string? interventions_applied { get; set; } public string? follow_up_actions { get; set; } public string? progress_noted { get; set; } public string? concerns_flagged { get; set; } public string? referral_made { get; set; } }
public class HomeVisitationCsvRow   { public string? resident_id { get; set; } public string? visit_date { get; set; } public string? social_worker { get; set; } public string? visit_type { get; set; } public string? location_visited { get; set; } public string? family_members_present { get; set; } public string? purpose { get; set; } public string? observations { get; set; } public string? family_cooperation_level { get; set; } public string? safety_concerns_noted { get; set; } public string? follow_up_needed { get; set; } public string? follow_up_notes { get; set; } public string? visit_outcome { get; set; } }
public class EducationRecordCsvRow  { public string? resident_id { get; set; } public string? record_date { get; set; } public string? education_level { get; set; } public string? school_name { get; set; } public string? enrollment_status { get; set; } public string? attendance_rate { get; set; } public string? progress_percent { get; set; } public string? completion_status { get; set; } public string? notes { get; set; } }
public class HealthRecordCsvRow     { public string? resident_id { get; set; } public string? record_date { get; set; } public string? weight_kg { get; set; } public string? height_cm { get; set; } public string? bmi { get; set; } public string? nutrition_score { get; set; } public string? sleep_score { get; set; } public string? energy_score { get; set; } public string? general_health_score { get; set; } public string? medical_checkup_done { get; set; } public string? dental_checkup_done { get; set; } public string? psychological_checkup_done { get; set; } }
public class InterventionPlanCsvRow { public string? resident_id { get; set; } public string? plan_category { get; set; } public string? plan_description { get; set; } public string? services_provided { get; set; } public string? target_value { get; set; } public string? target_date { get; set; } public string? status { get; set; } public string? case_conference_date { get; set; } public string? created_at { get; set; } public string? updated_at { get; set; } }
public class IncidentReportCsvRow   { public string? resident_id { get; set; } public string? safehouse_id { get; set; } public string? incident_date { get; set; } public string? incident_type { get; set; } public string? severity { get; set; } public string? description { get; set; } public string? response_taken { get; set; } public string? resolved { get; set; } public string? resolution_date { get; set; } public string? reported_by { get; set; } public string? follow_up_required { get; set; } }
public class SocialMediaPostCsvRow  { public string? platform { get; set; } public string? platform_post_id { get; set; } public string? post_url { get; set; } public string? created_at { get; set; } public string? day_of_week { get; set; } public string? post_hour { get; set; } public string? post_type { get; set; } public string? media_type { get; set; } public string? caption { get; set; } public string? hashtags { get; set; } public string? num_hashtags { get; set; } public string? mentions_count { get; set; } public string? has_call_to_action { get; set; } public string? call_to_action_type { get; set; } public string? content_topic { get; set; } public string? sentiment_tone { get; set; } public string? caption_length { get; set; } public string? features_resident_story { get; set; } public string? campaign_name { get; set; } public string? is_boosted { get; set; } public string? boost_budget_php { get; set; } public string? impressions { get; set; } public string? reach { get; set; } public string? likes { get; set; } public string? comments { get; set; } public string? shares { get; set; } public string? saves { get; set; } public string? click_throughs { get; set; } public string? video_views { get; set; } public string? engagement_rate { get; set; } public string? profile_visits { get; set; } public string? donation_referrals { get; set; } public string? estimated_donation_value_php { get; set; } public string? follower_count_at_post { get; set; } }
public class MonthlyMetricCsvRow    { public string? safehouse_id { get; set; } public string? month_start { get; set; } public string? month_end { get; set; } public string? active_residents { get; set; } public string? avg_education_progress { get; set; } public string? avg_health_score { get; set; } public string? process_recording_count { get; set; } public string? home_visitation_count { get; set; } public string? incident_count { get; set; } public string? notes { get; set; } }
public class SnapshotCsvRow         { public string? snapshot_date { get; set; } public string? headline { get; set; } public string? summary_text { get; set; } public string? metric_payload_json { get; set; } public string? is_published { get; set; } public string? published_at { get; set; } }
