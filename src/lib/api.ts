// HTTP client + types matching CamiKasifi-backend DTOs.
//
// Auth: token Supabase session'undan dinamik okunur (supabaseClient singleton'ı).
// JWT decode / localStorage saklama mantığı yok — Supabase SDK halleder.

import { supabase } from './supabaseClient'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

export type WebUserType = 'ADMIN' | 'IMAM' | 'CEMAAT'

export interface UserProfile {
  id: number
  email: string
  type: WebUserType
  name: string
  surname: string
  birthday: string | null
  referralCode?: string | null
  points?: number | null
  phoneNumber?: string | null
  phoneVisible?: boolean | null
}

/// `PUT /api/users/me` body. Şifre değişimi backend'de değil Supabase'de
/// yapılır (supabase.auth.updateUser({password})), bu yüzden bu DTO'da yok.
export interface UserUpdateInput {
  name: string
  surname: string
  birthday?: string | null
  phoneNumber?: string | null
  phoneVisible?: boolean | null
}

export interface Mosque {
  id: number
  name: string
  city: string
  district: string
  neighbourhood: string
  radius: number
  latitude: number
  longitude: number
  osmId?: number | null
}

export interface MosqueInput {
  name: string
  city: string
  district: string
  neighbourhood: string
  radius: number
  latitude: number
  longitude: number
}

export interface Competition {
  id: number
  name: string
  centralMosqueId?: number | null
}

export interface LeaderboardEntry {
  personId: number
  name: string
  surname: string
  totalPoint: number
  rank: number
}

export type SalahType =
  | 'FAJR'
  | 'DHUHR'
  | 'ASR'
  | 'MAGHRIB'
  | 'ISHA'
export type ApprovalKind = 'CENTRAL' | 'GUEST'

/// İmamın manuel ibadet ekleme sonucu (POST /api/competitions/{id}/manual-attendance).
export interface ManualAttendanceResult {
  added: number
  skipped: number
  pointsAdded: number
  skippedDetails: string[]
}

export interface ApprovalItem {
  id: number
  competitionId: number | null
  competitionName: string | null
  personId: number | null
  personName: string | null
  personSurname: string | null
  salahSessionId: number | null
  salahType: SalahType | null
  salahDate: string | null
  sessionStartTime: string | null
  sessionEndTime: string | null
  mosqueId: number | null
  mosqueName: string | null
  status: string
  type: ApprovalKind | string | null
  point: number | null
  createdAt: string | null
  /** Faz 1B anti-cheat: oturuma toplanan flag CSV'si list olarak. */
  suspiciousFlags?: string[] | null
  /** Faz 1B: ardışık ping'lerden gözlenen pik hız (km/h). */
  maxSpeedKmh?: number | null
}

export interface BulkApprovalError {
  id: number
  reason: string
}

export interface BulkApprovalResult {
  succeeded: number
  failed: number
  succeededIds: number[]
  errors: BulkApprovalError[]
}

/* ───── Faz 1A — Cami profili ───── */

export interface MosqueImamInfo {
  userId: number
  name: string
  surname: string
  phone: string | null
}

export interface MosqueTopAttendee {
  personId: number
  name: string
  surname: string
  validSessionCount: number
}

export interface MosqueProfile {
  id: number
  name: string
  city: string
  district: string
  neighbourhood: string
  radius: number | null
  latitude: number | null
  longitude: number | null
  historyText: string | null
  photoUrl: string | null
  imams: MosqueImamInfo[]
  topAttendees: MosqueTopAttendee[]
}

export interface ImamMosqueProfileUpdateInput {
  historyText?: string | null
  photoUrl?: string | null
  radius?: number | null
}

/* ───── Faz 3 — Duyuru / Etkinlik ───── */

export type AnnouncementType =
  | 'HUTBE'
  | 'GENERAL'
  | 'IFTAR'
  | 'MEVLID'
  | 'TAZIYE'
  | 'OTHER'

export interface MosqueAnnouncement {
  id: number
  mosqueId: number
  authorId: number
  authorName: string
  authorSurname: string
  type: AnnouncementType
  title: string
  body: string | null
  eventAt: string | null
  createdAt: string
  pushedToCount: number | null
}

export interface MosqueAnnouncementCreateInput {
  type: AnnouncementType
  title: string
  body?: string | null
  eventAt?: string | null
  notifyAttendees?: boolean
}

/* ───── Faz 3 — Cemaat analitiği ───── */

export interface MosqueAnalytics {
  mosqueId: number
  windowDays: number
  uniqueAttendees: number
  totalValidSessions: number
  bySalahType: Record<string, number>
  byDayOfWeek: Record<string, number>
  weakestSalahType: string | null
  ageDistribution: Record<string, number>
  visitFrequencyBuckets: Record<string, number>
  topAttendees: MosqueTopAttendee[]
}

export type CompetitionRoleType = 'OWNER' | 'MANAGER' | 'APPROVER'
export type CompetitionRoleStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type IncentiveRuleType =
  | 'DAILY_SALAH'
  | 'DAILY_ALL_SALAH'
  | 'WEEKLY_SALAH_COUNT'

/** Owner/manager view — direct mirror of `Incentive` JPA entity. */
export interface Incentive {
  id: number
  title: string
  description: string | null
  rewardPoints: number
  ruleType: IncentiveRuleType
  targetSalahType: SalahType | null
  targetCount: number | null
  startsAt: string | null
  endsAt: string | null
  active: boolean
}

export interface IncentiveInput {
  title: string
  description?: string | null
  ruleType: IncentiveRuleType
  rewardPoints: number
  targetSalahType?: SalahType | null
  targetCount?: number | null
  startsAt?: string | null
  endsAt?: string | null
  active?: boolean
}

/** Per-user incentive view returned inside the envelope from `/api/me/incentives`. */
export interface IncentiveProgress {
  id: number
  competitionId: number
  title: string
  description: string | null
  ruleType: IncentiveRuleType | string
  rewardPoints: number
  progress: number
  target: number
  completed: boolean
  claimed: boolean
  claimable: boolean
  endsAt: string | null
  period: string
}

export interface MyIncentivesResponse {
  hasCompetition: boolean
  competitionId: number | null
  competitionName: string | null
  items: IncentiveProgress[]
}

export interface IncentiveClaimResult {
  incentiveId: number
  claimedAt: string
  bonusAwarded: number
  totalPoints: number
}

export interface AdminUser {
  id: number
  email: string
  type: WebUserType
  name: string | null
  surname: string | null
  mosqueIds: number[]
}

/// `POST /api/admin/users` cevabı. Backend Supabase'de kayıt açıp şifre belirleme
/// e-postası tetikler; `emailSent=false` ise admin manuel uyarmalıdır.
export interface AdminUserCreateResponse extends AdminUser {
  emailSent: boolean
}

export interface CompetitionRole {
  id: number
  userId: number
  email: string
  name: string
  surname: string
  type: CompetitionRoleType
  status: CompetitionRoleStatus
  mosqueIds: number[]
}

/* ───── İmam cami başvurusu ───── */

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** `ImamMosqueApplicationResponse` karşılığı — imam ve yönetici aynı şekli görür. */
export interface ImamMosqueApplication {
  id: number
  applicantUserId: number
  applicantName: string | null
  applicantSurname: string | null
  applicantEmail: string
  mosqueId: number
  mosqueName: string
  mosqueCity: string
  mosqueDistrict: string
  mosqueNeighbourhood: string
  note: string | null
  contactPhone: string | null
  roleTitle: string | null
  status: ApplicationStatus
  decisionNote: string | null
  decidedByName: string | null
  createdAt: string
  decidedAt: string | null
}

export interface ImamMosqueApplicationInput {
  mosqueId: number
  note?: string | null
  contactPhone?: string | null
  roleTitle?: string | null
}

/** İmam self-kayıt gövdesi. Kimlik (sub/email) Supabase JWT'sinden alınır.
 *  Cami listeden seçilmez — serbest metin (cami adı + ilçe + il). */
export interface ImamRegistrationInput {
  name: string
  surname: string
  phone?: string | null
  mosqueName: string
  district: string
  city: string
  note?: string | null
  roleTitle?: string | null
}

/* ───── Rozet kataloğu (admin) ───── */

export type BadgeCategory =
  | 'PRAYER_STREAK'
  | 'TOTAL_PRAYERS'
  | 'FULL_DAY'
  | 'FRIDAY_STREAK'
  | 'MOSQUE_LOYALTY'
  | 'POINTS'
  | 'COMPETITION_WIN'

export const BADGE_CATEGORIES: BadgeCategory[] = [
  'PRAYER_STREAK',
  'TOTAL_PRAYERS',
  'FULL_DAY',
  'FRIDAY_STREAK',
  'MOSQUE_LOYALTY',
  'POINTS',
  'COMPETITION_WIN',
]

export const BADGE_CATEGORY_LABELS: Record<BadgeCategory, string> = {
  PRAYER_STREAK: 'Vakit Ustası',
  TOTAL_PRAYERS: 'Toplam Namaz',
  FULL_DAY: 'Tam Gün',
  FRIDAY_STREAK: 'Cuma Sadakati',
  MOSQUE_LOYALTY: 'Cami Sadakati',
  POINTS: 'Puan',
  COMPETITION_WIN: 'Yarışma Şampiyonu',
}

export type BadgeTier = 'CIRAK' | 'KALFA' | 'USTA' | 'USTAD'

export const BADGE_TIERS: BadgeTier[] = ['CIRAK', 'KALFA', 'USTA', 'USTAD']

export const BADGE_TIER_LABELS: Record<BadgeTier, string> = {
  CIRAK: 'Çırak',
  KALFA: 'Kalfa',
  USTA: 'Usta',
  USTAD: 'Üstad',
}

export const BADGE_ICON_KEYS = [
  'prayer_fajr',
  'prayer_dhuhr',
  'prayer_asr',
  'prayer_maghrib',
  'prayer_isha',
  'total_prayers',
  'full_day',
  'friday',
  'mosque',
  'points',
  'trophy',
] as const

/// Admin rozet katalogu satırı — backend `AdminBadgeResponse` karşılığı.
/// `earnedByCount` silme kararı için ipucu: > 0 ise silme 409 alır.
export interface AdminBadge {
  id: number
  code: string
  name: string
  description: string
  category: BadgeCategory | string
  tier: BadgeTier | string
  targetValue: number
  iconKey: string
  salahType: SalahType | null
  sortOrder: number
  earnedByCount: number
}

export interface BadgeInput {
  code: string
  name: string
  description: string
  category: BadgeCategory
  tier: BadgeTier
  targetValue: number
  iconKey: string
  salahType?: SalahType | null
  sortOrder?: number | null
}

export class ApiError extends Error {
  status: number
  fieldErrors?: Array<{ field: string; message: string }>
  constructor(status: number, message: string, fieldErrors?: ApiError['fieldErrors']) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const { data } = await supabase().auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8'
  const token = await getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) || `İstek başarısız (${res.status})`
    throw new ApiError(res.status, msg, data?.fieldErrors)
  }
  return data as T
}

export const api = {
  auth: {
    // login/register Supabase tarafına taşındı. Buradan yalnız `me` çağrısı kaldı.
    me: () => request<UserProfile>('GET', '/api/users/me'),
  },
  users: {
    update: (input: UserUpdateInput) =>
      request<UserProfile>('PUT', '/api/users/me', input),
  },
  mosques: {
    list: () => request<Mosque[]>('GET', '/api/mosques'),
    profile: (id: number) =>
      request<MosqueProfile>('GET', `/api/mosques/${id}/profile`),
    announcements: (id: number) =>
      request<MosqueAnnouncement[]>('GET', `/api/mosques/${id}/announcements`),
    events: (id: number) =>
      request<MosqueAnnouncement[]>('GET', `/api/mosques/${id}/events`),
    search: (params: {
      q?: string
      city?: string
      district?: string
      limit?: number
    }) => {
      const usp = new URLSearchParams()
      if (params.q && params.q.trim()) usp.set('q', params.q.trim())
      if (params.city && params.city.trim()) usp.set('city', params.city.trim())
      if (params.district && params.district.trim())
        usp.set('district', params.district.trim())
      if (params.limit != null) usp.set('limit', String(params.limit))
      const qs = usp.toString()
      return request<Mosque[]>(
        'GET',
        `/api/mosques/search${qs ? `?${qs}` : ''}`,
      )
    },
    create: (input: MosqueInput) =>
      request<Mosque>('POST', '/api/admin/mosques', input),
    update: (id: number, input: MosqueInput) =>
      request<Mosque>('PUT', `/api/admin/mosques/${id}`, input),
    remove: (id: number) =>
      request<void>('DELETE', `/api/admin/mosques/${id}`),
  },
  imamMosques: {
    list: () => request<Mosque[]>('GET', '/api/imams/me/mosques'),
    updateProfile: (
      mosqueId: number,
      input: ImamMosqueProfileUpdateInput,
    ) =>
      request<Mosque>(
        'PUT',
        `/api/imams/me/mosques/${mosqueId}/profile`,
        input,
      ),
    createAnnouncement: (
      mosqueId: number,
      input: MosqueAnnouncementCreateInput,
    ) =>
      request<MosqueAnnouncement>(
        'POST',
        `/api/imams/me/mosques/${mosqueId}/announcements`,
        input,
      ),
    analytics: (mosqueId: number) =>
      request<MosqueAnalytics>(
        'GET',
        `/api/imams/me/mosques/${mosqueId}/analytics`,
      ),
  },
  imamRegistrations: {
    /** İmam self-kayıt: profil + PENDING başvuru oluşturur (provisioning yolu). */
    create: (input: ImamRegistrationInput) =>
      request<ImamMosqueApplication>('POST', '/api/imam-registrations', input),
  },
  imamMosqueApplications: {
    /** İmamın kendi başvuruları (durumlarıyla). */
    listMine: () =>
      request<ImamMosqueApplication[]>(
        'GET',
        '/api/imams/me/mosque-applications',
      ),
    apply: (input: ImamMosqueApplicationInput) =>
      request<ImamMosqueApplication>(
        'POST',
        '/api/imams/me/mosque-applications',
        input,
      ),
  },
  adminImamApplications: {
    list: (status?: ApplicationStatus) => {
      const q = status ? `?status=${status}` : ''
      return request<ImamMosqueApplication[]>(
        'GET',
        `/api/admin/imam-applications${q}`,
      )
    },
    pendingCount: () =>
      request<{ count: number }>(
        'GET',
        '/api/admin/imam-applications/pending-count',
      ),
    /** Onayla — `mosqueId` doluysa yönetici camiyi değiştirmiş olur. */
    approve: (
      id: number,
      input?: { mosqueId?: number | null; decisionNote?: string | null },
    ) =>
      request<ImamMosqueApplication>(
        'POST',
        `/api/admin/imam-applications/${id}/approve`,
        input ?? {},
      ),
    reject: (id: number, input?: { decisionNote?: string | null }) =>
      request<ImamMosqueApplication>(
        'POST',
        `/api/admin/imam-applications/${id}/reject`,
        input ?? {},
      ),
  },
  adminUsers: {
    list: (type?: WebUserType) => {
      const q = type ? `?type=${type}` : ''
      return request<AdminUser[]>('GET', `/api/admin/users${q}`)
    },
    create: (input: {
      email: string
      name: string
      surname: string
      type: WebUserType
    }) => request<AdminUserCreateResponse>('POST', '/api/admin/users', input),
    updateType: (userId: number, type: WebUserType) =>
      request<AdminUser>('PUT', `/api/admin/users/${userId}/type`, { type }),
    updateMosques: (userId: number, mosqueIds: number[]) =>
      request<AdminUser>(
        'PUT',
        `/api/admin/users/${userId}/mosques`,
        { mosqueIds },
      ),
  },
  adminBadges: {
    list: () => request<AdminBadge[]>('GET', '/api/admin/badges'),
    create: (input: BadgeInput) =>
      request<AdminBadge>('POST', '/api/admin/badges', input),
    update: (id: number, input: BadgeInput) =>
      request<AdminBadge>('PUT', `/api/admin/badges/${id}`, input),
    remove: (id: number) =>
      request<void>('DELETE', `/api/admin/badges/${id}`),
  },
  competitions: {
    list: () => request<Competition[]>('GET', '/api/competitions'),
    create: (input: { name: string; centralMosqueId?: number | null }) =>
      request<Competition>('POST', '/api/competitions', input),
    leaderboard: (id: number) =>
      request<LeaderboardEntry[]>('GET', `/api/competitions/${id}/leaderboard`),
    manualAttendance: (
      competitionId: number,
      input: {
        personId: number
        entries: { salahDate: string; salahType: SalahType }[]
      },
    ) =>
      request<ManualAttendanceResult>(
        'POST',
        `/api/competitions/${competitionId}/manual-attendance`,
        input,
      ),
  },
  approvals: {
    list: (competitionId?: number) => {
      const query =
        competitionId != null ? `?competitionId=${competitionId}` : ''
      return request<ApprovalItem[]>('GET', `/api/approvals${query}`)
    },
    approve: (id: number) =>
      request<ApprovalItem>('POST', `/api/approvals/${id}/approve`, {}),
    reject: (id: number) =>
      request<ApprovalItem>('POST', `/api/approvals/${id}/reject`, {}),
    bulkApprove: (ids: number[]) =>
      request<BulkApprovalResult>('POST', '/api/approvals/bulk-approve', {
        ids,
      }),
    bulkReject: (ids: number[]) =>
      request<BulkApprovalResult>('POST', '/api/approvals/bulk-reject', {
        ids,
      }),
  },
  incentives: {
    /** Cemaat'in (kendi yarışmasındaki) teşviklerini envelope olarak getir. */
    myList: () => request<MyIncentivesResponse>('GET', '/api/me/incentives'),
    claim: (id: number) =>
      request<IncentiveClaimResult>(
        'POST',
        `/api/me/incentives/${id}/claim`,
        {},
      ),
  },
  competitionIncentives: {
    list: (competitionId: number) =>
      request<Incentive[]>(
        'GET',
        `/api/competitions/${competitionId}/incentives`,
      ),
    create: (competitionId: number, input: IncentiveInput) =>
      request<Incentive>(
        'POST',
        `/api/competitions/${competitionId}/incentives`,
        input,
      ),
    update: (competitionId: number, id: number, input: IncentiveInput) =>
      request<Incentive>(
        'PUT',
        `/api/competitions/${competitionId}/incentives/${id}`,
        input,
      ),
    remove: (competitionId: number, id: number) =>
      request<void>(
        'DELETE',
        `/api/competitions/${competitionId}/incentives/${id}`,
      ),
  },
  competitionRoles: {
    list: (competitionId: number) =>
      request<CompetitionRole[]>(
        'GET',
        `/api/competitions/${competitionId}/roles`,
      ),
    assign: (
      competitionId: number,
      input: { userId: number; type: CompetitionRoleType; mosqueIds?: number[] },
    ) =>
      request<CompetitionRole>(
        'POST',
        `/api/competitions/${competitionId}/roles`,
        input,
      ),
    remove: (competitionId: number, roleId: number) =>
      request<void>(
        'DELETE',
        `/api/competitions/${competitionId}/roles/${roleId}`,
      ),
    requestApprover: (competitionId: number) =>
      request<CompetitionRole>(
        'POST',
        `/api/competitions/${competitionId}/role-requests`,
        {},
      ),
    listRequests: (competitionId: number) =>
      request<CompetitionRole[]>(
        'GET',
        `/api/competitions/${competitionId}/role-requests`,
      ),
    approveRequest: (
      competitionId: number,
      roleId: number,
      input?: { mosqueIds?: number[] },
    ) =>
      request<CompetitionRole>(
        'POST',
        `/api/competitions/${competitionId}/role-requests/${roleId}/approve`,
        input ?? {},
      ),
    rejectRequest: (competitionId: number, roleId: number) =>
      request<CompetitionRole>(
        'POST',
        `/api/competitions/${competitionId}/role-requests/${roleId}/reject`,
        {},
      ),
  },
}
