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
    // Only redirect if there was an existing token (expired session).
    // If there's no token, this is a failed login attempt — let the error bubble up normally.
    if (getToken()) {
      localStorage.removeItem('hh_token');
      localStorage.removeItem('hh_user');
      window.location.href = '/login';
    }
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? 'Incorrect username or password.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    const message = err.message
      ?? (Array.isArray(err.errors) ? err.errors.join(' ') : undefined)
      ?? `HTTP ${res.status}`;
    throw new Error(message);
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

  // ─── Admin: User Management ────────────────────────────────────────────────
  admin: {
    users: {
      list:    () => request<AdminUser[]>('/api/admin/users'),
      setRole: (userId: string, role: string) =>
        request(`/api/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
      delete: (userId: string) =>
        request(`/api/admin/users/${userId}`, { method: 'DELETE' }),
    },
  },

  // ─── ML Stubs ──────────────────────────────────────────────────────────────
  ml: {
    reintegrationReadiness: (residentId: number) =>
      request(`/api/ml/reintegration-readiness/${residentId}`),
    donorChurnRisk: () => request('/api/ml/donor-churn-risk'),
    socialMediaRecommendations: () => request('/api/ml/social-media-recommendations'),
    residentRiskFlags: () => request('/api/ml/resident-risk-flags'),
  },
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

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  twoFactorEnabled: boolean;
  supporterId?: number;
  roles: string[];
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
