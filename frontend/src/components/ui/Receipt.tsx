import { useEffect, useId, useState } from 'react'
import { receipts } from '../../lib/api'
import { MAX_RECEIPT_BYTES, RECEIPT_ACCEPT } from '../../lib/receipts'
import type { ReceiptChange, ReceiptOwner } from '../../lib/receipts'
import { Modal } from './Modal'

/**
 * Optional receipt picker for a form. Validates type/size up front so the
 * user isn't told after the record is already saved.
 */
export function ReceiptField({
  hasExisting,
  value,
  onChange,
}: {
  hasExisting: boolean
  value: ReceiptChange
  onChange: (change: ReceiptChange) => void
}) {
  const id = useId()
  const [error, setError] = useState<string | null>(null)

  const current =
    value.kind === 'replace' ? value.file.name : value.kind === 'remove' ? null : hasExisting ? 'Receipt attached' : null

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="small-caps text-muted-foreground">
        Receipt <span className="normal-case tracking-normal text-muted-foreground/60">· optional</span>
      </span>
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-border px-4 py-3">
        <span aria-hidden className="font-display text-xl text-accent/70">
          ⎙
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {current ?? 'Photo or PDF of the receipt, up to 8 MB'}
        </span>
        <label
          htmlFor={id}
          className="min-h-11 cursor-pointer touch-manipulation content-center rounded-md px-3 text-sm text-accent underline-offset-4 hover:underline"
        >
          {current ? 'Replace' : 'Choose file'}
        </label>
        {current && (
          <button
            type="button"
            onClick={() => onChange(hasExisting ? { kind: 'remove' } : { kind: 'keep' })}
            className="min-h-11 touch-manipulation px-2 text-sm text-muted-foreground underline-offset-4 hover:text-danger hover:underline"
          >
            Remove
          </button>
        )}
        <input
          id={id}
          type="file"
          accept={RECEIPT_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            // The picker's filter can be bypassed ("All files"), so check here too.
            if (!RECEIPT_ACCEPT.split(',').includes(file.type)) return setError('Use a JPG, PNG or WEBP photo, or a PDF.')
            if (file.size > MAX_RECEIPT_BYTES) return setError('That file is larger than 8 MB.')
            setError(null)
            onChange({ kind: 'replace', file })
          }}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}

/** Small "view receipt" icon button for list rows. */
export function ReceiptButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View receipt for ${label}`}
      title="View receipt"
      className="grid size-9 touch-manipulation place-items-center rounded-md text-base text-accent transition-colors hover:bg-accent-muted"
    >
      <span aria-hidden>⎙</span>
    </button>
  )
}

/**
 * Shows a receipt in a modal. The file sits behind auth, so it is fetched as a
 * blob (with the token) and shown through an object URL.
 */
export function ReceiptViewer({
  target,
  onClose,
}: {
  target: { type: ReceiptOwner; id: number; title: string } | null
  onClose: () => void
}) {
  const [state, setState] = useState<{ url: string; isPdf: boolean } | { error: string } | null>(null)
  // Callers pass a fresh object each render; key the fetch on identity, not the object.
  const type = target?.type
  const id = target?.id

  useEffect(() => {
    if (!type || !id) return
    let url: string | null = null
    let cancelled = false
    receipts
      .blob(type, id)
      .then((b) => {
        if (cancelled) return
        url = URL.createObjectURL(b)
        setState({ url, isPdf: b.type === 'application/pdf' })
      })
      .catch((e: unknown) => !cancelled && setState({ error: e instanceof Error ? e.message : 'Could not load the receipt.' }))
    return () => {
      cancelled = true
      setState(null)
      if (url) URL.revokeObjectURL(url)
    }
  }, [type, id])

  return (
    <Modal open={!!target} eyebrow="Receipt" title={target?.title ?? ''} onClose={onClose}>
      {!state ? (
        <p className="small-caps py-16 text-center text-muted-foreground">Loading…</p>
      ) : 'error' in state ? (
        <p role="alert" className="py-10 text-center text-danger">
          {state.error}
        </p>
      ) : state.isPdf ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <iframe src={state.url} title={`Receipt for ${target?.title}`} className="h-[60vh] w-full rounded-md border border-border" />
          <a href={state.url} target="_blank" rel="noreferrer" className="text-sm text-accent underline underline-offset-4">
            Open PDF in a new tab
          </a>
        </div>
      ) : (
        <figure className="flex flex-col items-center gap-4">
          <img src={state.url} alt={`Receipt for ${target?.title}`} className="max-h-[65vh] w-auto rounded-md border border-border object-contain shadow-sm" />
          <a href={state.url} target="_blank" rel="noreferrer" className="text-sm text-accent underline underline-offset-4">
            Open full size
          </a>
        </figure>
      )}
    </Modal>
  )
}
