const envBaseUrl = import.meta.env.VITE_API_URL?.trim();
const BASE_URL = envBaseUrl
  ? envBaseUrl.replace(/\/+$/, '')
  : (import.meta.env.DEV ? '' : 'http://localhost:5000');

function getToken(): string | null {
  return localStorage.getItem('hh_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token expired — clear and redirect to login
    localStorage.removeItem('hh_token');
    localStorage.removeItem('hh_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login:      (email: string, password: string) =>
      request<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    loginMfa:   (userId: string, code: string) =>
      request<LoginResponse>('/api/auth/login/mfa', { method: 'POST', body: JSON.stringify({ userId, code }) }),
    register:   (email: string, password: string, displayName: string) =>
      request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
    me:         () => request<MeResponse>('/api/auth/me'),
    mfaSetup:   () => request<MfaSetupResponse>('/api/auth/mfa/setup'),
    mfaEnable:  (code: string) =>
      request('/api/auth/mfa/enable', { method: 'POST', body: JSON.stringify({ code }) }),
    mfaDisable: (password: string) =>
      request('/api/auth/mfa/disable', { method: 'POST', body: JSON.stringify({ password }) }),
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    public: () => request<PublicStats>('/api/dashboard/public'),
    admin:  () => request<AdminStats>('/api/dashboard/admin'),
    reports:(months = 12, safehouseId?: number) =>
      request<Reports>(`/api/dashboard/reports?months=${months}${safehouseId ? `&safehouseId=${safehouseId}` : ''}`),
  },

  // ─── Residents ─────────────────────────────────────────────────────────────
  residents: {
    list: (params: ResidentListParams = {}) => {
      const q = new URLSearchParams();
      if (params.status)       q.set('status', params.status);
      if (params.safehouseId)  q.set('safehouseId', String(params.safehouseId));
      if (params.caseCategory) q.set('caseCategory', params.caseCategory);
      if (params.riskLevel)    q.set('riskLevel', params.riskLevel);
      if (params.search)       q.set('search', params.search);
      if (params.page)         q.set('page', String(params.page));
      if (params.pageSize)     q.set('pageSize', String(params.pageSize));
      return request<PaginatedResponse<ResidentListItem>>(`/api/residents?${q}`);
    },
    get:    (id: number) => request<Resident>(`/api/residents/${id}`),
    create: (data: Partial<Resident>) =>
      request<Resident>('/api/residents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Resident>) =>
      request('/api/residents/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/api/residents/${id}`, { method: 'DELETE' }),
    processRecordings: {
      list:   (id: number) => request<ProcessRecording[]>(`/api/residents/${id}/process-recordings`),
      create: (id: number, data: Partial<ProcessRecording>) =>
        request(`/api/residents/${id}/process-recordings`, { method: 'POST', body: JSON.stringify(data) }),
    },
    homeVisitations: {
      list:   (id: number) => request<HomeVisitation[]>(`/api/residents/${id}/home-visitations`),
      create: (id: number, data: Partial<HomeVisitation>) =>
        request(`/api/residents/${id}/home-visitations`, { method: 'POST', body: JSON.stringify(data) }),
    },
    interventionPlans: {
      list:   (id: number) => request<InterventionPlan[]>(`/api/residents/${id}/intervention-plans`),
      create: (id: number, data: Partial<InterventionPlan>) =>
        request(`/api/residents/${id}/intervention-plans`, { method: 'POST', body: JSON.stringify(data) }),
    },
  },

  // ─── Donations & Supporters ────────────────────────────────────────────────
  donations: {
    list:   (params: { type?: string; campaign?: string; page?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.type)     q.set('type', params.type);
      if (params.campaign) q.set('campaign', params.campaign);
      if (params.page)     q.set('page', String(params.page));
      return request<PaginatedResponse<DonationListItem>>(`/api/donations?${q}`);
    },
    get:    (id: number) => request(`/api/donations/${id}`),
    create: (data: CreateDonationDto) =>
      request('/api/donations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: unknown) =>
      request(`/api/donations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/api/donations/${id}`, { method: 'DELETE' }),
  },

  supporters: {
    list:   (params: { type?: string; status?: string; search?: string; page?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.type)   q.set('type', params.type);
      if (params.status) q.set('status', params.status);
      if (params.search) q.set('search', params.search);
      if (params.page)   q.set('page', String(params.page));
      return request<PaginatedResponse<Supporter>>(`/api/supporters?${q}`);
    },
    get:    (id: number) => request<Supporter>(`/api/supporters/${id}`),
    create: (data: Partial<Supporter>) =>
      request('/api/supporters', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Supporter>) =>
      request(`/api/supporters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/api/supporters/${id}`, { method: 'DELETE' }),
  },

  safehouses: {
    list:   (status?: string) => request<Safehouse[]>(`/api/safehouses${status ? `?status=${status}` : ''}`),
    get:    (id: number) => request<Safehouse>(`/api/safehouses/${id}`),
    create: (data: Partial<Safehouse>) =>
      request('/api/safehouses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Safehouse>) =>
      request(`/api/safehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/api/safehouses/${id}`, { method: 'DELETE' }),
  },

  // ─── Social Planner ────────────────────────────────────────────────────────
  socialPlanner: {
    options: () => request<{
      platforms: {value:string;count:number}[];
      daysOfWeek: {value:string;count:number}[];
      postTypes: {value:string;count:number}[];
      mediaTypes: {value:string;count:number}[];
      contentTopics: {value:string;count:number}[];
      sentimentTones: {value:string;count:number}[];
      callToActionTypes: {value:string;count:number}[];
      campaignNames: {value:string;count:number}[];
    }>('/api/social-planner/options'),
    predictEffective:     (body: unknown) => request<{probability:number;prediction:number;label_col:string}>('/api/social-planner/predict/effective',     { method: 'POST', body: JSON.stringify(body) }),
    predictEngagementRate:(body: unknown) => request<{prediction:number;target_col:string}>('/api/social-planner/predict/engagement-rate', { method: 'POST', body: JSON.stringify(body) }),
    predictDonationValue: (body: unknown) => request<{prediction:number;target_col:string}>('/api/social-planner/predict/donation-value',  { method: 'POST', body: JSON.stringify(body) }),
  },

  // ─── Storytelling ──────────────────────────────────────────────────────────
  storytelling: {
    timePeriodSummary: (start: string, end: string) =>
      request<TimePeriodImpactResponse>(
        `/api/storytelling/time-period-summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      ),
    supporterImpact: (supporterId: number) =>
      request<SupporterImpactResponse>(`/api/storytelling/supporter-impact/${supporterId}`),
    projectedImpact: (amountPhp: number, programArea: string) =>
      request<ProjectedImpactResponse>('/api/storytelling/projected-impact', {
        method: 'POST',
        body: JSON.stringify({ amount_php: amountPhp, program_area: programArea }),
      }),
  },

  // ─── ML Stubs ──────────────────────────────────────────────────────────────
  ml: {
    reintegrationReadiness: (residentId: number) =>
      request(`/api/ml/reintegration-readiness/${residentId}`),
    donorChurnRisk: () => request('/api/ml/donor-churn-risk'),
    socialMediaRecommendations: () => request('/api/ml/social-media-recommendations'),
    residentRiskFlags: () => request('/api/ml/resident-risk-flags'),
    donorPredictions: (supporterIds: number[]) =>
      request<DonorPrediction[]>('/api/ml/donor-predictions', {
        method: 'POST', body: JSON.stringify(supporterIds),
      }),
  },
};

// ─── ML API (proxied through backend to avoid CORS) ───────────────────────────
async function mlRequest<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

// Emotional state → valence score (0 = very negative, 1 = very positive)
const VALENCE_MAP: Record<string, number> = {
  Happy: 0.9, Joyful: 0.9, Confident: 0.85, Hopeful: 0.8, Grateful: 0.8,
  Calm: 0.75, Content: 0.75, Peaceful: 0.75, Relaxed: 0.7,
  Neutral: 0.5, Indifferent: 0.5,
  Confused: 0.35, Worried: 0.3,
  Sad: 0.2, Withdrawn: 0.2, Frustrated: 0.2,
  Anxious: 0.2, Fearful: 0.15, Angry: 0.15,
  Distressed: 0.1, Depressed: 0.1, Overwhelmed: 0.1,
};

function getValence(state: string): number {
  if (!state) return 0.5;
  const key = Object.keys(VALENCE_MAP).find(k => state.toLowerCase().includes(k.toLowerCase()));
  return key ? VALENCE_MAP[key] : 0.5;
}

const RISK_ORD: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

export interface ResidentRiskInput {
  age_months?: number;
  risk_level_ord?: number;
  case_category?: string;
  referral_source?: string;
  birth_status?: string;
  sub_cat_orphaned?: number;
  sub_cat_trafficked?: number;
  sub_cat_child_labor?: number;
  sub_cat_physical_abuse?: number;
  sub_cat_sexual_abuse?: number;
  sub_cat_osaec?: number;
  sub_cat_cicl?: number;
  sub_cat_at_risk?: number;
  sub_cat_street_child?: number;
  sub_cat_child_with_hiv?: number;
  is_pwd?: number;
  has_special_needs?: number;
  family_is_4ps?: number;
  family_solo_parent?: number;
  family_indigenous?: number;
  family_parent_pwd?: number;
  family_informal_settler?: number;
  session_type?: string;
  session_duration_min?: number;
  emo_state_obs?: string;
  emo_state_end?: string;
  emo_obs_valence?: number;
  emo_end_valence?: number;
  emo_improved?: number;
  first_progress_noted?: number;
  first_concerns_flagged?: number;
  first_referral_made?: number;
}

export interface ResidentRiskResult {
  risk_score: number;
  struggling_probability: number;
  struggling_flag: number;
  cls_threshold: number;
}

export function buildResidentRiskInput(resident: Resident, firstRecording?: ProcessRecording): ResidentRiskInput {
  const dob = new Date(resident.dateOfBirth);
  const admitted = new Date(resident.dateOfAdmission);
  const ageMonths = Math.floor((admitted.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

  const obsValence = firstRecording ? getValence(firstRecording.emotionalStateObserved) : undefined;
  const endValence = firstRecording ? getValence(firstRecording.emotionalStateEnd) : undefined;

  return {
    age_months:             ageMonths,
    risk_level_ord:         RISK_ORD[resident.initialRiskLevel] ?? 2,
    case_category:          resident.caseCategory,
    referral_source:        resident.referralSource,
    birth_status:           resident.birthStatus,
    sub_cat_orphaned:       resident.subCatOrphaned ? 1 : 0,
    sub_cat_trafficked:     resident.subCatTrafficked ? 1 : 0,
    sub_cat_child_labor:    resident.subCatChildLabor ? 1 : 0,
    sub_cat_physical_abuse: resident.subCatPhysicalAbuse ? 1 : 0,
    sub_cat_sexual_abuse:   resident.subCatSexualAbuse ? 1 : 0,
    sub_cat_osaec:          resident.subCatOsaec ? 1 : 0,
    sub_cat_cicl:           resident.subCatCicl ? 1 : 0,
    sub_cat_at_risk:        resident.subCatAtRisk ? 1 : 0,
    sub_cat_street_child:   resident.subCatStreetChild ? 1 : 0,
    sub_cat_child_with_hiv: resident.subCatChildWithHiv ? 1 : 0,
    is_pwd:                 resident.isPwd ? 1 : 0,
    has_special_needs:      resident.hasSpecialNeeds ? 1 : 0,
    family_is_4ps:          resident.familyIs4Ps ? 1 : 0,
    family_solo_parent:     resident.familySoloParent ? 1 : 0,
    family_indigenous:      resident.familyIndigenous ? 1 : 0,
    family_parent_pwd:      resident.familyParentPwd ? 1 : 0,
    family_informal_settler: resident.familyInformalSettler ? 1 : 0,
    ...(firstRecording && {
      session_type:          firstRecording.sessionType,
      session_duration_min:  firstRecording.sessionDurationMinutes,
      emo_state_obs:         firstRecording.emotionalStateObserved,
      emo_state_end:         firstRecording.emotionalStateEnd,
      emo_obs_valence:       obsValence,
      emo_end_valence:       endValence,
      emo_improved:          (endValence! > obsValence!) ? 1 : 0,
      first_progress_noted:  firstRecording.progressNoted ? 1 : 0,
      first_concerns_flagged: firstRecording.concernsFlagged ? 1 : 0,
      first_referral_made:   firstRecording.referralMade ? 1 : 0,
    }),
  };
}

export const mlApi = {
  residentRisk: (input: ResidentRiskInput) =>
    mlRequest<ResidentRiskResult>('/api/ml/resident-risk', input),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  token?: string;
  email?: string;
  displayName?: string;
  roles?: string[];
  mfaRequired: boolean;
  userId?: string;
}

export interface MeResponse {
  id: string;
  email: string;
  displayName: string;
  supporterId?: number;
  twoFactorEnabled: boolean;
  roles: string[];
}

export interface MfaSetupResponse {
  key: string;
  qrCodeUri: string;
}

export interface PublicStats {
  totalGirlsServed: number;
  activeResidents: number;
  activeSafehouses: number;
  reintegrationRate: number;
  avgEducationProgress: number;
  avgHealthScore: number;
  totalRaisedUsd: number;
}

export interface AdminStats {
  activeResidents: number;
  criticalRisk: number;
  highRisk: number;
  recentDonationCount: number;
  recentDonationValue: number;
  upcomingConferences: unknown[];
  recentIncidents: unknown[];
  safehouseOverview: SafehouseOverviewItem[];
}

export interface SafehouseOverviewItem {
  safehouseId: number;
  name: string;
  region: string;
  currentOccupancy: number;
  capacityGirls: number;
  occupancyPct: number;
}

export interface Reports {
  donationTrends: { year: number; month: number; total: number; count: number }[];
  educationTrends: { year: number; month: number; avgProgress: number }[];
  healthTrends: { year: number; month: number; avgHealth: number; avgNutrition: number }[];
  reintegrationOutcomes: unknown[];
  safehousePerformance: unknown[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  data: T[];
}

// ─── Storytelling types (stubbed — fill in when storytelling branch merges) ───
export interface TimePeriodImpactResponse { [key: string]: unknown; }
export interface SupporterImpactResponse  { [key: string]: unknown; }
export interface ProjectedImpactResponse  { [key: string]: unknown; }

export interface ResidentListParams {
  status?: string;
  safehouseId?: number;
  caseCategory?: string;
  riskLevel?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ResidentListItem {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  caseStatus: string;
  caseCategory: string;
  dateOfAdmission: string;
  currentRiskLevel: string;
  reintegrationStatus?: string;
  safehouseName: string;
  safehouseId: number;
  assignedSocialWorker?: string;
}

export interface Resident extends ResidentListItem {
  dateOfBirth: string;
  sex: string;
  birthStatus: string;
  placeOfBirth?: string;
  religion?: string;
  subCatOrphaned: boolean;
  subCatTrafficked: boolean;
  subCatChildLabor: boolean;
  subCatPhysicalAbuse: boolean;
  subCatSexualAbuse: boolean;
  subCatOsaec: boolean;
  subCatCicl: boolean;
  subCatAtRisk: boolean;
  subCatStreetChild: boolean;
  subCatChildWithHiv: boolean;
  isPwd: boolean;
  pwdType?: string;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis?: string;
  familyIs4Ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyParentPwd: boolean;
  familyInformalSettler: boolean;
  referralSource: string;
  referringAgencyPerson?: string;
  assignedSocialWorker?: string;
  initialCaseAssessment?: string;
  reintegrationType?: string;
  initialRiskLevel: string;
  dateClosed?: string;
  createdAt: string;
}

export interface ProcessRecording {
  recordingId: number;
  residentId: number;
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  sessionDurationMinutes: number;
  emotionalStateObserved: string;
  emotionalStateEnd: string;
  sessionNarrative: string;
  interventionsApplied?: string;
  followUpActions?: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
  referralMade: boolean;
}

export interface HomeVisitation {
  visitationId: number;
  residentId: number;
  visitDate: string;
  socialWorker: string;
  visitType: string;
  locationVisited?: string;
  familyMembersPresent?: string;
  purpose?: string;
  observations?: string;
  familyCooperationLevel: string;
  safetyConcernsNoted: boolean;
  followUpNeeded: boolean;
  followUpNotes?: string;
  visitOutcome: string;
}

export interface InterventionPlan {
  planId: number;
  residentId: number;
  planCategory: string;
  planDescription: string;
  servicesProvided?: string;
  targetValue?: number;
  targetDate: string;
  status: string;
  caseConferenceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonationListItem {
  donationId: number;
  supporterId: number;
  displayName: string;
  donationType: string;
  donationDate: string;
  amount?: number;
  currencyCode?: string;
  campaignName?: string;
  isRecurring: boolean;
  channelSource?: string;
}

export interface CreateDonationDto {
  supporterId: number;
  donationType: string;
  amount?: number;
  isRecurring: boolean;
  campaignName?: string;
  channelSource?: string;
  notes?: string;
}

export interface Supporter {
  supporterId: number;
  supporterType: string;
  displayName: string;
  organizationName?: string;
  firstName?: string;
  lastName?: string;
  relationshipType: string;
  region?: string;
  country?: string;
  email?: string;
  phone?: string;
  status: string;
  firstDonationDate?: string;
  acquisitionChannel?: string;
  createdAt: string;
}

export interface DonorPrediction {
  supporterId: number;
  ltv:       { probability: number; prediction: number };
  retention: { probability: number; prediction: number };
}

export interface Safehouse {
  safehouseId: number;
  safehouseCode: string;
  name: string;
  region: string;
  city: string;
  province: string;
  country: string;
  openDate: string;
  status: string;
  capacityGirls: number;
  capacityStaff: number;
  currentOccupancy: number;
  notes?: string;
}
