// HTTP client + types matching CamiKasifi-backend DTOs.

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
const TOKEN_KEY = 'camikasifi.jwt'

export type Role = 'ROLE_ADMIN' | 'ROLE_IMAM' | 'ROLE_CEMAAT'
export type WebUserType = 'ADMIN' | 'IMAM' | 'CEMAAT'

export interface UserProfile {
  id: number
  email: string
  type: WebUserType
  name: string
  surname: string
  birthday: string | null
  referralCode?: string | null
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  user: UserProfile
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
}

export type CompetitionRoleType = 'OWNER' | 'MANAGER' | 'APPROVER'
export type CompetitionRoleStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AdminUser {
  id: number
  email: string
  type: WebUserType
  name: string | null
  surname: string | null
  mosqueIds: number[]
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

export class ApiError extends Error {
  status: number
  fieldErrors?: Array<{ field: string; message: string }>
  constructor(status: number, message: string, fieldErrors?: ApiError['fieldErrors']) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

export interface JwtPayload {
  sub: string
  uid: number
  exp: number
  iat: number
  roles: Role[]
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json))) as JwtPayload
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
  const token = getToken()
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
    login: (email: string, password: string) =>
      request<AuthResponse>('POST', '/api/auth/login', { email, password }),
    register: (input: {
      email: string
      password: string
      name: string
      surname: string
      birthday?: string
      referralCode?: string
      type?: WebUserType
    }) => request<AuthResponse>('POST', '/api/auth/register', input),
    me: () => request<UserProfile>('GET', '/api/users/me'),
  },
  mosques: {
    list: () => request<Mosque[]>('GET', '/api/mosques'),
    create: (input: MosqueInput) =>
      request<Mosque>('POST', '/api/admin/mosques', input),
    update: (id: number, input: MosqueInput) =>
      request<Mosque>('PUT', `/api/admin/mosques/${id}`, input),
    remove: (id: number) =>
      request<void>('DELETE', `/api/admin/mosques/${id}`),
  },
  imamMosques: {
    list: () => request<Mosque[]>('GET', '/api/imams/me/mosques'),
    update: (mosqueIds: number[]) =>
      request<Mosque[]>('PUT', '/api/imams/me/mosques', { mosqueIds }),
  },
  adminUsers: {
    list: (type?: WebUserType) => {
      const q = type ? `?type=${type}` : ''
      return request<AdminUser[]>('GET', `/api/admin/users${q}`)
    },
    updateMosques: (userId: number, mosqueIds: number[]) =>
      request<AdminUser>(
        'PUT',
        `/api/admin/users/${userId}/mosques`,
        { mosqueIds },
      ),
  },
  competitions: {
    list: () => request<Competition[]>('GET', '/api/competitions'),
    create: (input: { name: string; centralMosqueId?: number | null }) =>
      request<Competition>('POST', '/api/competitions', input),
    leaderboard: (id: number) =>
      request<LeaderboardEntry[]>('GET', `/api/competitions/${id}/leaderboard`),
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
