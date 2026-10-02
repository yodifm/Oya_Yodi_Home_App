import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { ProgressRule } from '../../components/ui/ProgressRule'
import { RowActions } from '../../components/ui/RowActions'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { Tabs } from '../../components/ui/Tabs'
import { useAsync } from '../../hooks/useAsync'
import { useCrudPage } from '../../hooks/useCrudPage'
import { cn } from '../../lib/cn'
import { formatCurrency, formatDate } from '../../lib/format'
import { priorityLabels, wishlistStatusLabels } from '../../lib/labels'
import type { WishlistItem, WishlistStatus } from '../../types'
import { priorityTone, progressOf, wishlistApi, wishlistStatusTone } from './api'
import { PurchaseForm } from './PurchaseForm'
import { WishlistForm } from './WishlistForm'

type Filter = WishlistStatus | 'open'

function WishlistCard({
  item,
  onEdit,
  onDelete,
  onPurchase,
}: {
  item: WishlistItem
  onEdit: () => void
  onDelete: () => void
  onPurchase: () => void
}) {
  const progress = progressOf(item)
  const purchased = item.status === 'purchased'
  const remaining = Math.max(0, item.estimated_price - item.saved_amount)

  return (
    <Card hoverEffect accentTop={item.priority === 'high' && !purchased} className={cn('flex flex-col p-5 sm:p-8', purchased && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={wishlistStatusTone[item.status]}>{wishlistStatusLabels[item.status]}</Badge>
        {!purchased && <Badge tone={priorityTone[item.priority]}>{priorityLabels[item.priority]} priority</Badge>}
      </div>

      <h3 className={cn('mt-5 text-xl font-semibold leading-snug', purchased && 'line-through decoration-accent/60')}>
        {item.url ? (
          <a href={item.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-accent hover:underline">
            {item.name}
          </a>
        ) : (
          item.name
        )}
      </h3>
      <p className="figure mt-2 text-3xl">{formatCurrency(item.estimated_price)}</p>
      {item.created_by && (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="grid size-5 place-items-center rounded-full border border-accent/40 font-display text-[0.6875rem] italic text-accent"
          >
            {item.created_by.charAt(0)}
          </span>
          <span>
            Added by <span className="font-medium text-foreground">{item.created_by}</span>
            {item.created_at && ` · ${formatDate(item.created_at)}`}
          </span>
        </p>
      )}

      <div className="mt-6 space-y-2">
        <ProgressRule value={purchased ? 1 : progress} label={`Savings progress for ${item.name}`} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            <span className="font-mono">{Math.round((purchased ? 1 : progress) * 100)}%</span> saved
          </span>
          {!purchased && <span>{formatCurrency(remaining)} to go</span>}
        </div>
      </div>

      {item.notes && <p className="mt-4 text-sm italic text-muted-foreground">{item.notes}</p>}

      {purchased ? (
        item.expense_id && (
          <p className="mt-4 text-sm text-muted-foreground">
            <span aria-hidden className="text-success">✓ </span>Recorded in the expense book.
          </p>
        )
      ) : (
        <Button variant="outline" size="sm" onClick={onPurchase} className="mt-6 self-start">
          Mark purchased
        </Button>
      )}

      {/* mt-auto pins the footer to the card bottom so a row of cards aligns. */}
      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
          <span className="small-caps text-[0.625rem] text-muted-foreground">
            {item.target_date ? `Target ${formatDate(item.target_date, { day: undefined })}` : 'No target date'}
          </span>
          <RowActions label={item.name} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </Card>
  )
}

export function WishlistPage() {
  const [filter, setFilter] = useState<Filter>('open')
  const { data = [], loading, error, reload } = useAsync(() => wishlistApi.list(), [])
  const crud = useCrudPage(wishlistApi, reload)
  const [buying, setBuying] = useState<WishlistItem | null>(null)

  const open = data.filter((i) => i.status !== 'purchased')
  const rows = filter === 'open' ? open : data.filter((i) => i.status === filter)
  const totalRemaining = open.reduce((s, i) => s + Math.max(0, i.estimated_price - i.saved_amount), 0)
  const totalSaved = open.reduce((s, i) => s + i.saved_amount, 0)
  const totalPrice = open.reduce((s, i) => s + i.estimated_price, 0)

  return (
    <>
      <PageHeader
        eyebrow="Chapter IV — Wishlist"
        title={
          <>
            Things We <span className="italic text-accent">Long For</span>
          </>
        }
        description="Things we would love for the house, ordered by priority and how close the savings are."
        actions={<Button onClick={crud.openCreate}>+ Add Wish</Button>}
      />

      {/* Asymmetric summary: the shortfall leads, the saved total supports. */}
      <section aria-label="Wishlist summary" className="mb-8 grid gap-3 sm:mb-12 sm:gap-6 md:grid-cols-[1.3fr_0.7fr]">
        <Card featured className="p-5 sm:p-8">
          <p className="small-caps text-muted-foreground">Still needed</p>
          <p className="figure mt-3 text-4xl leading-none sm:text-5xl">{formatCurrency(totalRemaining)}</p>
          <div className="mt-6">
            <ProgressRule value={totalPrice ? totalSaved / totalPrice : 0} label="Overall wishlist progress" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            for {open.length} items not yet purchased
          </p>
        </Card>
        <Card accentTop className="flex flex-col justify-between p-5 sm:p-8">
          <p className="small-caps text-muted-foreground">Saved so far</p>
          <p className="figure mt-3 text-3xl">{formatCurrency(totalSaved)}</p>
          <p className="mt-3 text-sm text-muted-foreground">of {formatCurrency(totalPrice)} in total</p>
        </Card>
      </section>

      <Tabs<Filter>
        label="Filter by status"
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'open', label: 'Not purchased', count: open.length },
          ...(Object.keys(wishlistStatusLabels) as WishlistStatus[]).map((s) => ({
            value: s,
            label: wishlistStatusLabels[s],
            count: data.filter((i) => i.status === s).length,
          })),
        ]}
      />

      <div className="mt-8">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <Card>
            <EmptyState
              title="The list is empty"
              message="Write down what you would like to buy, then track the savings here."
              action={<Button variant="outline" onClick={crud.openCreate}>Add a wish</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((item) => (
              <WishlistCard key={item.id} item={item} onEdit={() => crud.openEdit(item)} onDelete={() => crud.askDelete(item)}
                onPurchase={() => setBuying(item)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={crud.formOpen}
        eyebrow={crud.editing ? 'Edit wish' : 'New wish'}
        title={crud.editing ? crud.editing.name : 'Add to Wishlist'}
        onClose={crud.closeForm}
      >
        <WishlistForm initial={crud.editing} saving={crud.saving} errors={crud.errors} onSubmit={crud.save} onCancel={crud.closeForm} />
      </Modal>

      <Modal open={!!buying} eyebrow="We bought it" title={buying?.name ?? ''} onClose={() => setBuying(null)}>
        {buying && (
          <PurchaseForm
            item={buying}
            onCancel={() => setBuying(null)}
            onDone={() => {
              setBuying(null)
              reload()
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!crud.deleting}
        title="Remove from wishlist?"
        message={`“${crud.deleting?.name}” will be permanently deleted.`}
        busy={crud.saving}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
        onCancel={crud.cancelDelete}
      />
    </>
  )
}
