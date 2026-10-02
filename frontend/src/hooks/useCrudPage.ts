import { useState } from 'react'
import { ApiError } from '../lib/api'

interface CrudApi<T, TInput> {
  create: (input: TInput) => Promise<T>
  update: (id: number, input: Partial<TInput>) => Promise<T>
  remove: (id: number) => Promise<void>
}

/** 422 → first message per field; anything else → a form-level message. */
function toFieldErrors(e: unknown): Record<string, string> {
  if (e instanceof ApiError && e.status === 422 && Object.keys(e.errors).length) {
    return Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]]))
  }
  return { _form: e instanceof Error ? e.message : 'Something went wrong.' }
}

/**
 * Shared state machine for a list page with a create/edit modal and a delete
 * confirmation. Pages only render; this owns what's open and what's in flight.
 */
export function useCrudPage<T extends { id: number }, TInput>(api: CrudApi<T, TInput>, onChange: () => void) {
  const [editing, setEditing] = useState<T | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<T | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const openCreate = () => {
    setEditing(null)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (item: T) => {
    setEditing(item)
    setErrors({})
    setFormOpen(true)
  }

  const closeForm = () => setFormOpen(false)

  /** `after` runs once the record exists, e.g. to upload a receipt for its new id. */
  async function save(input: TInput, after?: (saved: T) => Promise<unknown>) {
    setSaving(true)
    setErrors({})
    let saved: T
    try {
      saved = editing ? await api.update(editing.id, input) : await api.create(input)
    } catch (e) {
      setErrors(toFieldErrors(e))
      setSaving(false)
      return
    }

    try {
      await after?.(saved)
      setFormOpen(false)
    } catch (e) {
      // The record exists now. Keep the form open on *that* record, so a retry
      // updates it instead of creating a duplicate.
      setEditing(saved)
      const reason = Object.values(toFieldErrors(e))[0]
      setErrors({ _form: `Saved, but the receipt could not be attached: ${reason}` })
    } finally {
      setSaving(false)
      onChange()
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setSaving(true)
    setDeleteError(null)
    try {
      await api.remove(deleting.id)
      setDeleting(null)
      onChange()
    } catch (e) {
      // e.g. 422 "still has records" — keep the dialog open and say why.
      const first = e instanceof ApiError ? Object.values(e.errors)[0]?.[0] : undefined
      setDeleteError(first ?? (e instanceof Error ? e.message : 'Could not delete.'))
    } finally {
      setSaving(false)
    }
  }

  return {
    editing,
    formOpen,
    deleting,
    deleteError,
    saving,
    errors,
    openCreate,
    openEdit,
    closeForm,
    save,
    askDelete: (item: T) => {
      setDeleteError(null)
      setDeleting(item)
    },
    cancelDelete: () => setDeleting(null),
    confirmDelete,
  }
}
