import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { ApiError } from '../../lib/api'
import { cn } from '../../lib/cn'
import { notifyDataChanged } from '../../lib/events'
import type { CatalogItem, PaymentMethodItem } from '../../types'
import type { CatalogList } from './api'
import { createItem, removeItem, reorderItems, updateItem } from './api'
import { useCatalog } from './useCatalog'

const messageOf = (e: unknown) =>
  e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : e instanceof Error ? e.message : 'Something went wrong.'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const smallButton =
  'grid h-11 w-8 shrink-0 touch-manipulation place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 sm:size-8'

const textButton =
  'min-h-11 shrink-0 touch-manipulation px-1.5 text-sm sm:px-2 text-muted-foreground underline-offset-4 transition-colors hover:underline sm:min-h-8'

/** What a removal will do, for the confirm dialog. */
interface PendingRemoval {
  list: CatalogList
  item: CatalogItem
  /** Extra consequence of deleting, e.g. "Its budget goes too." */
  note?: string
}

/** A name input with an Add button, for the end of a list. */
function AddForm({ placeholder, label, onAdd, autoFocus }: { placeholder: string; label: string; onAdd: (name: string) => Promise<void>; autoFocus?: boolean }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onAdd(name.trim())
      setName('')
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          aria-label={label}
          placeholder={placeholder}
          value={name}
          maxLength={40}
          autoFocus={autoFocus}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!error || undefined}
          className="h-11 min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 text-base transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-border-hover focus-visible:border-accent aria-invalid:border-danger sm:text-sm"
        />
        <Button type="submit" size="sm" variant={name.trim() ? 'primary' : 'outline'} disabled={!name.trim() || saving} className="min-h-11">
          {saving ? 'Adding…' : 'Add'}
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  )
}

/** One item: name and usage, reorder arrows, rename in place, hide/delete or show again. */
function ItemRow({
  item,
  list,
  nested,
  onMove,
  onRemove,
  canMoveUp,
  canMoveDown,
}: {
  item: CatalogItem
  list: CatalogList
  nested?: boolean
  onMove?: (direction: -1 | 1) => void
  onRemove: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}) {
  const { refresh } = useCatalog()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(patch: { name?: string; archived?: boolean }) {
    setSaving(true)
    setError(null)
    try {
      await updateItem(list, item.id, patch)
      await refresh()
      notifyDataChanged()
      setEditing(false)
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <li className={cn('px-4 py-3 sm:px-6', nested && 'pl-4 sm:pl-12')}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (draft.trim() && draft.trim() !== item.name) void save({ name: draft.trim() })
            else setEditing(false)
          }}
          className="flex flex-col gap-1"
        >
          <div className="flex gap-2">
            <input
              aria-label={`New name for ${item.name}`}
              value={draft}
              maxLength={40}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
              aria-invalid={!!error || undefined}
              className="h-11 min-w-0 flex-1 rounded-md border border-accent bg-transparent px-3 text-base focus-visible:border-accent aria-invalid:border-danger sm:text-sm"
            />
            <Button type="submit" size="sm" disabled={saving} className="min-h-11">
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="min-h-11">
              Cancel
            </Button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </form>
      </li>
    )
  }

  return (
    <li className={cn('flex items-center gap-1 px-4 py-3 sm:gap-3 sm:px-6', nested && 'pl-4 sm:pl-12', item.archived && 'bg-muted/40')}>
      <div className="min-w-0 flex-1">
        <p className={cn('flex items-center gap-2', nested ? 'text-sm' : 'font-medium', item.archived && 'text-muted-foreground')}>
          <span className="min-w-0 sm:truncate">{item.name}</span>
          {item.archived && <Badge>Hidden</Badge>}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.usage ? plural(item.usage, 'expense') : 'Not used yet'}
          {error && <span className="ml-2 text-danger">{error}</span>}
        </p>
      </div>

      {item.archived ? (
        <button type="button" onClick={() => void save({ archived: false })} disabled={saving} className={cn(textButton, 'hover:text-accent')}>
          Show again
        </button>
      ) : (
        <>
          {onMove && (
            <>
              <button type="button" aria-label={`Move ${item.name} up`} title="Move up" disabled={!canMoveUp} onClick={() => onMove(-1)} className={smallButton}>
                ↑
              </button>
              <button type="button" aria-label={`Move ${item.name} down`} title="Move down" disabled={!canMoveDown} onClick={() => onMove(1)} className={smallButton}>
                ↓
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setDraft(item.name)
              setError(null)
              setEditing(true)
            }}
            className={cn(textButton, 'hover:text-foreground')}
          >
            Rename
          </button>
          <button type="button" onClick={onRemove} className={cn(textButton, 'hover:text-danger')}>
            {item.usage ? 'Hide' : 'Delete'}
          </button>
        </>
      )}
    </li>
  )
}

/** Active items in order (with arrows), then hidden ones. */
function ItemList({
  items,
  list,
  nested,
  methodId,
  onRemove,
}: {
  items: CatalogItem[]
  list: CatalogList
  nested?: boolean
  methodId?: number
  onRemove: (item: CatalogItem) => void
}) {
  const { refresh } = useCatalog()
  const active = items.filter((i) => !i.archived)
  const hidden = items.filter((i) => i.archived)

  async function move(index: number, direction: -1 | 1) {
    const order = [...active]
    ;[order[index], order[index + direction]] = [order[index + direction], order[index]]
    await reorderItems(list, [...order, ...hidden].map((i) => i.id), methodId)
    await refresh()
  }

  return (
    <>
      {active.map((item, i) => (
        <ItemRow
          key={item.id}
          item={item}
          list={list}
          nested={nested}
          onMove={active.length > 1 ? (d) => void move(i, d) : undefined}
          canMoveUp={i > 0}
          canMoveDown={i < active.length - 1}
          onRemove={() => onRemove(item)}
        />
      ))}
      {hidden.map((item) => (
        <ItemRow key={item.id} item={item} list={list} nested={nested} onRemove={() => onRemove(item)} />
      ))}
    </>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-4">
      <SectionLabel align="start">{title}</SectionLabel>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Card className="overflow-hidden">{children}</Card>
    </section>
  )
}

/** A payment method with its accounts (banks, wallets) nested under it. */
function MethodBlock({
  method,
  index,
  count,
  onMove,
  onRemove,
}: {
  method: PaymentMethodItem
  index: number
  count: number
  onMove: (direction: -1 | 1) => void
  onRemove: (removal: PendingRemoval) => void
}) {
  const { refresh } = useCatalog()
  const [adding, setAdding] = useState(false)
  // Cash has nothing to choose between, so it gets no accounts.
  const canHaveAccounts = method.key !== 'cash'

  return (
    <div className="border-b border-border last:border-b-0">
      <ul>
        <ItemRow
          item={method}
          list="method"
          onMove={method.archived || count < 2 ? undefined : onMove}
          canMoveUp={index > 0}
          canMoveDown={index < count - 1}
          onRemove={() =>
            onRemove({ list: 'method', item: method, note: method.accounts.length ? 'Its accounts go too.' : undefined })
          }
        />
      </ul>
      {!method.archived && (method.accounts.length > 0 || canHaveAccounts) && (
        <div className="pb-3">
          {method.accounts.length > 0 && (
            <ul className="ml-4 border-l border-accent/30 sm:ml-8">
              <ItemList
                items={method.accounts}
                list="account"
                nested
                methodId={method.id}
                onRemove={(item) => onRemove({ list: 'account', item })}
              />
            </ul>
          )}
          {canHaveAccounts && (
            <div className="pl-8 pr-4 pt-2 sm:pl-12 sm:pr-6">
              {adding ? (
                <AddForm
                  label={`New account for ${method.name}`}
                  placeholder={method.key === 'transfer' ? 'e.g. BRI' : 'e.g. GoPay'}
                  autoFocus
                  onAdd={async (name) => {
                    await createItem('account', name, method.id)
                    await refresh()
                  }}
                />
              ) : (
                <button
                  type="button"
                  aria-label={`Add an account to ${method.name}`}
                  onClick={() => setAdding(true)}
                  className={cn(textButton, 'px-0 text-accent hover:text-accent-secondary')}
                >
                  + Add {method.key === 'transfer' ? 'bank' : 'account'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CatalogPage() {
  const { catalog, refresh } = useCatalog()
  const [pending, setPending] = useState<PendingRemoval | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const methods = catalog.payment_methods
  const activeMethods = methods.filter((m) => !m.archived)

  async function confirmRemove() {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      await removeItem(pending.list, pending.item.id)
      await refresh()
      notifyDataChanged()
      setPending(null)
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  async function moveMethod(index: number, direction: -1 | 1) {
    const order = [...activeMethods]
    ;[order[index], order[index + direction]] = [order[index + direction], order[index]]
    await reorderItems('method', [...order, ...methods.filter((m) => m.archived)].map((m) => m.id))
    await refresh()
  }

  const willHide = !!pending?.item.usage

  // Usage counts change as expenses are added elsewhere; bring them up to date on arrival.
  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <>
      <PageHeader
        eyebrow="Chapter VII — Categories & Payments"
        title={
          <>
            The <span className="italic text-accent">Index</span>
          </>
        }
        description="The categories expenses are sorted into, and the ways they are paid. The order here is the order in every dropdown."
      />

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-12">
        <Section
          title="Categories"
          description="Renaming keeps every past expense, budget and report in step. Something already used can only be hidden, so its history stays intact."
        >
          <ul className="divide-y divide-border">
            <ItemList
              items={catalog.categories}
              list="category"
              onRemove={(item) => setPending({ list: 'category', item, note: 'Its budget, if it had one, goes too.' })}
            />
          </ul>
          <div className="border-t border-border px-4 py-4 sm:px-6">
            <AddForm
              label="New category"
              placeholder="New category, e.g. Pets"
              onAdd={async (name) => {
                await createItem('category', name)
                await refresh()
              }}
            />
          </div>
        </Section>

        <Section
          title="Payment Methods"
          description="A method with accounts asks which one paid — the bank for a transfer, the wallet for an e-wallet. Add accounts to any method."
        >
          {methods.map((m) => (
            <MethodBlock
              key={m.id}
              method={m}
              index={activeMethods.indexOf(m)}
              count={activeMethods.length}
              onMove={(d) => void moveMethod(activeMethods.indexOf(m), d)}
              onRemove={setPending}
            />
          ))}
          <div className="border-t border-border px-4 py-4 sm:px-6">
            <AddForm
              label="New payment method"
              placeholder="New method, e.g. QRIS"
              onAdd={async (name) => {
                await createItem('method', name)
                await refresh()
              }}
            />
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={!!pending}
        title={pending ? `${willHide ? 'Hide' : 'Delete'} “${pending.item.name}”?` : ''}
        message={
          pending
            ? willHide
              ? `It is used by ${plural(pending.item.usage, 'expense')}, so it stays on those and in reports, but is no longer offered for new entries. You can show it again any time.`
              : `Nothing uses it yet, so it is removed for good.${pending.note ? ` ${pending.note}` : ''}`
            : ''
        }
        confirmLabel={willHide ? 'Hide' : 'Delete'}
        busyLabel={willHide ? 'Hiding…' : 'Deleting…'}
        busy={busy}
        error={error}
        onConfirm={() => void confirmRemove()}
        onCancel={() => {
          setPending(null)
          setError(null)
        }}
      />
    </>
  )
}
