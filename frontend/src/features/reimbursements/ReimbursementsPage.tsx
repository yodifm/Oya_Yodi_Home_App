import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { ReceiptButton, ReceiptViewer } from '../../components/ui/Receipt'
import { applyReceiptChange } from '../../lib/receipts'
import { RowActions } from '../../components/ui/RowActions'
import { StatCard } from '../../components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { Tabs } from '../../components/ui/Tabs'
import { useAsync } from '../../hooks/useAsync'
import { useCrudPage } from '../../hooks/useCrudPage'
import { useStepBackWhenEmpty } from '../../hooks/usePage'
import { formatCurrency, formatDate } from '../../lib/format'
import { reimbursementStatusLabels } from '../../lib/labels'
import type { Reimbursement, ReimbursementStatus } from '../../types'
import { nextStep, reimbursementsApi, statusTone, toInput } from './api'
import { ReimbursementForm } from './ReimbursementForm'

type Filter = ReimbursementStatus | 'all'

export function ReimbursementsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [advancing, setAdvancing] = useState<number | null>(null)
  const [viewing, setViewing] = useState<Reimbursement | null>(null)

  const { data, loading, error, reload } = useAsync(
    () => reimbursementsApi.page({ status: filter === 'all' ? undefined : filter, page: String(page) }),
    [filter, page],
  )
  const crud = useCrudPage(reimbursementsApi, reload)
  useStepBackWhenEmpty(data, loading, page, setPage)

  const summary = data?.summary
  const total = summary ? Object.values(summary).reduce((n, s) => n + s.count, 0) : 0
  const rows = data?.data ?? []

  async function advance(claim: Reimbursement) {
    const step = nextStep[claim.status]
    if (!step) return
    setAdvancing(claim.id)
    try {
      await reimbursementsApi.update(claim.id, { ...toInput(claim), status: step.to })
      reload()
    } finally {
      setAdvancing(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Chapter III — Reimbursements"
        title="Claims & Advances"
        description="Personal money spent on the household, and its way back home."
        actions={<Button onClick={crud.openCreate}>+ Submit Claim</Button>}
      />

      <section aria-label="Claims summary" className="mb-8 grid grid-cols-2 gap-3 sm:mb-12 sm:grid-cols-3 sm:gap-6">
        <StatCard featured className="col-span-2 sm:col-span-1" label="Awaiting approval" value={formatCurrency(summary?.pending.total ?? 0)} caption={`${summary?.pending.count ?? 0} open claims`} />
        <StatCard label="Approved, not yet paid" value={formatCurrency(summary?.approved.total ?? 0)} caption={`${summary?.approved.count ?? 0} claims`} />
        <StatCard label="Paid back" value={formatCurrency(summary?.paid.total ?? 0)} caption={`${summary?.paid.count ?? 0} claims settled`} />
      </section>

      <Tabs<Filter>
        label="Filter by status"
        value={filter}
        onChange={(f) => {
          setFilter(f)
          setPage(1)
        }}
        items={[
          { value: 'all', label: 'All', count: total },
          ...(Object.keys(reimbursementStatusLabels) as ReimbursementStatus[]).map((s) => ({
            value: s,
            label: reimbursementStatusLabels[s],
            count: summary?.[s].count ?? 0,
          })),
        ]}
      />

      <Card className="mt-6 overflow-hidden sm:mt-8">
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No claims"
            message={filter === 'all' ? 'Nothing waiting to be paid back.' : `No claims with status “${reimbursementStatusLabels[filter]}”.`}
            action={filter === 'all' && <Button variant="outline" onClick={crud.openCreate}>Submit a claim</Button>}
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* Phones: tappable claim cards (tap to edit; delete lives in the form). */}
            <ul className="divide-y divide-border md:hidden">
              {rows.map((r) => {
                const step = nextStep[r.status]
                return (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => crud.openEdit(r)} className="min-w-0 flex-1 touch-manipulation text-left">
                        <span className="block truncate font-medium">{r.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {formatDate(r.submitted_at, { year: undefined })} · by {r.claimant}
                          {r.settled_at && ` · settled ${formatDate(r.settled_at, { year: undefined })}`}
                        </span>
                      </button>
                      <span className="figure whitespace-nowrap text-base">{formatCurrency(r.amount)}</span>
                    </div>
                    <div className="mt-2 flex min-h-11 items-center justify-between gap-3">
                      <Badge tone={statusTone[r.status]}>{reimbursementStatusLabels[r.status]}</Badge>
                      <div className="flex items-center gap-1">
                        {r.has_receipt && <ReceiptButton label={r.title} onClick={() => setViewing(r)} />}
                        {step && (
                          <Button size="sm" variant="outline" disabled={advancing === r.id} onClick={() => advance(r)} className="whitespace-nowrap">
                            {step.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Submitted</Th>
                    <Th>Purpose</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Amount</Th>
                    <Th><span className="sr-only">Actions</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const step = nextStep[r.status]
                    return (
                      <Tr key={r.id}>
                        <Td className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {formatDate(r.submitted_at, { year: undefined })}
                        </Td>
                        <Td>
                          <p className="font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            by {r.claimant}
                            {r.settled_at && ` · settled ${formatDate(r.settled_at, { year: undefined })}`}
                          </p>
                        </Td>
                        <Td>
                          <Badge tone={statusTone[r.status]}>{reimbursementStatusLabels[r.status]}</Badge>
                        </Td>
                        <Td className="figure whitespace-nowrap text-right text-base">{formatCurrency(r.amount)}</Td>
                        <Td>
                          <div className="flex items-center justify-end gap-2">
                            {r.has_receipt && <ReceiptButton label={r.title} onClick={() => setViewing(r)} />}
                            {step && (
                              <Button size="sm" variant="outline" disabled={advancing === r.id} onClick={() => advance(r)} className="whitespace-nowrap">
                                {step.label}
                              </Button>
                            )}
                            <RowActions label={r.title} onEdit={() => crud.openEdit(r)} onDelete={() => crud.askDelete(r)} />
                          </div>
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
            {data && <Pagination meta={data.meta} onPage={setPage} />}
          </div>
        )}
      </Card>

      <Modal
        open={crud.formOpen}
        eyebrow={crud.editing ? 'Edit claim' : 'New claim'}
        title={crud.editing ? crud.editing.title : 'Submit a Reimbursement'}
        onClose={crud.closeForm}
      >
        <ReimbursementForm
          initial={crud.editing}
          saving={crud.saving}
          errors={crud.errors}
          onSubmit={(input, receipt) => crud.save(input, (saved) => applyReceiptChange('reimbursements', saved.id, receipt))}
          onCancel={crud.closeForm}
          onDelete={() => {
            if (!crud.editing) return
            const target = crud.editing
            crud.closeForm()
            crud.askDelete(target)
          }}
        />
      </Modal>

      <ReceiptViewer
        target={viewing && { type: 'reimbursements', id: viewing.id, title: viewing.title }}
        onClose={() => setViewing(null)}
      />

      <ConfirmDialog
        open={!!crud.deleting}
        title="Delete this claim?"
        message={`The claim “${crud.deleting?.title}” will be permanently deleted.`}
        busy={crud.saving}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
        onCancel={crud.cancelDelete}
      />
    </>
  )
}
