import type { Paginated, ValidationErrors } from '../types'
import { getToken, setToken } from './token'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

let onUnauthorized: () => void = () => {}

/** Called when the API rejects the stored token (expired or revoked). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

/** fetch() with the bearer token; maps 401 to sign-out and non-2xx to ApiError. */
async function send(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const isForm = init.body instanceof FormData
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      // FormData sets its own multipart boundary header.
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (res.status === 401 && token) {
    setToken(null)
    onUnauthorized()
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Partial<ValidationErrors>
    throw new ApiError(res.status, body.message ?? `Request failed (${res.status})`, body.errors)
  }
  return res
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await send(path, init)
  if (res.status === 204) return undefined as T
  return (await res.json().catch(() => ({}))) as T
}

function query(params?: Record<string, string | undefined>) {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v) as [string, string][]
  return entries.length ? `?${new URLSearchParams(entries)}` : ''
}

/** Upload one file as multipart form data. */
function upload<T>(path: string, field: string, file: File) {
  const body = new FormData()
  body.append(field, file)
  return request<T>(path, { method: 'POST', body })
}

/** Fetch an authenticated file (receipt, export) as a Blob. */
async function blob(path: string): Promise<Blob> {
  return (await send(path, { headers: { Accept: '*/*' } })).blob()
}

/** Download an authenticated file — an <a href> can't carry the bearer token. */
async function download(path: string, fallbackName: string) {
  const res = await send(path, { headers: { Accept: '*/*' } })
  const name = /filename="?([^";]+)"?/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? fallbackName
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Typed CRUD client for a Laravel apiResource that wraps payloads in `data`. */
export function resource<T, TInput = Omit<T, 'id'>, TSummary = unknown>(name: string) {
  return {
    list: (params?: Record<string, string | undefined>) =>
      request<{ data: T[] }>(`/${name}${query(params)}`).then((r) => r.data),
    /** One page of a paginated index, with Laravel's meta and the endpoint's summary. */
    page: (params?: Record<string, string | undefined>) =>
      request<Paginated<T, TSummary>>(`/${name}${query(params)}`),
    create: (input: TInput) =>
      request<{ data: T }>(`/${name}`, { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data),
    update: (id: number, input: Partial<TInput>) =>
      request<{ data: T }>(`/${name}/${id}`, { method: 'PUT', body: JSON.stringify(input) }).then((r) => r.data),
    remove: (id: number) => request<void>(`/${name}/${id}`, { method: 'DELETE' }),
  }
}

/** Receipt endpoints shared by expenses and reimbursements. */
export const receipts = {
  upload: (type: 'expenses' | 'reimbursements', id: number, file: File) =>
    upload<{ has_receipt: boolean }>(`/${type}/${id}/receipt`, 'receipt', file),
  remove: (type: 'expenses' | 'reimbursements', id: number) =>
    request<void>(`/${type}/${id}/receipt`, { method: 'DELETE' }),
  blob: (type: 'expenses' | 'reimbursements', id: number) => blob(`/${type}/${id}/receipt`),
}

export const api = { request, query, download }
