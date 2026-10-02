import { api } from '../../lib/api'
import type { Catalog, CatalogItem } from '../../types'

/** Which list an item belongs to, and where its endpoints live. */
export type CatalogList = 'category' | 'method' | 'account'

const base: Record<CatalogList, string> = {
  category: '/categories',
  method: '/payment-methods',
  account: '/payment-accounts',
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

export const fetchCatalog = () => api.request<Catalog>('/catalog')

export const createItem = (list: CatalogList, name: string, methodId?: number) =>
  api
    .request<{ data: CatalogItem }>(list === 'account' ? `/payment-methods/${methodId}/accounts` : base[list], json('POST', { name }))
    .then((r) => r.data)

/** Rename and/or hide (archived: true) or show again. */
export const updateItem = (list: CatalogList, id: number, patch: { name?: string; archived?: boolean }) =>
  api.request<{ data: CatalogItem }>(`${base[list]}/${id}`, json('PATCH', patch)).then((r) => r.data)

/** Deletes an unused item; one that records use is hidden instead. */
export const removeItem = (list: CatalogList, id: number) =>
  api.request<{ result: 'deleted' | 'archived' }>(`${base[list]}/${id}`, { method: 'DELETE' }).then((r) => r.result)

export const reorderItems = (list: CatalogList, ids: number[], methodId?: number) =>
  api.request(list === 'account' ? `/payment-methods/${methodId}/accounts/order` : `${base[list]}/order`, json('PUT', { ids }))
