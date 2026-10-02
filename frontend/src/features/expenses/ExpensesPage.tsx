import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { FilterSelect } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { MonthStepper } from '../../components/ui/MonthStepper'
import { Pagination } from '../../components/ui/Pagination'
import { ReceiptButton, ReceiptViewer } from '../../components/ui/Receipt'
import { applyReceiptChange } from '../../lib/receipts'
import { RowActions } from '../../components/ui/RowActions'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { useAsync } from '../../hooks/useAsync'
import { useCrudPage } from '../../hooks/useCrudPage'
import { useDebounced } from '../../hooks/useDebounced'
import { useStepBackWhenEmpty } from '../../hooks/usePage'
import { currentMonth, formatCurrency, formatDate, formatMonth } from '../../lib/format'
import { categoryFilterOptions as categoryFilter, categoryLabels, paymentDisplay } from '../../lib/labels'
import type { Expense } from '../../types'
import { expensesApi, exportExpenses } from './api'
import { ExpenseForm } from './ExpenseForm'

export function ExpensesPage() {
  const [month, setMonth] = useState(currentMonth())
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<Expense | null>(null)
  const [exporting, setExporting] = useState(false)
  const q = useDebounced(search.trim())
  // A search looks through every month by default ("when did we last service the bike?").
  const [searchAllMonths, setSearchAllMonths] = useState(true)
  const allMonths = !!q && searchAllMonths

  const filters = { month: allMonths ? undefined : month, category, q }
  const { data, loading, error, reload } = useAsync(
    () => expensesApi.page({ ...filters, page: String(page) }),
    [month, category, q, allMonths, page],
  )
  // Across months, dates need their year.
  const dateOpts: Intl.DateTimeFormatOptions = allMonths ? {} : { year: undefined }
  const crud = useCrudPage(expensesApi, reload)
  useStepBackWhenEmpty(data, loading, page, setPage)

  // Any filter change starts again from the first page.
  function changeMonth(m: string) {
    setMonth(m)
    setSearchAllMonths(false) // stepping months while searching means "this month, please"
    setPage(1)
  }
  function setScope(all: boolean) {
    setSearchAllMonths(all)
    setPage(1)
  }
  function changeCategory(c: string) {
    setCategory(c)
    setPage(1)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportExpenses(filters)
    } finally {
      setExporting(false)
    }
  }

  const rows = data?.data ?? []
  const filtered = !!(q || category)

  return (
    <>
      <PageHeader
        eyebrow="Chapter II — Expenses"
        title="The Expense Book"
        description="Every rupiah that leaves the house, recorded month by month."
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={exporting || !data?.summary.count}>
              {exporting ? 'Preparing…' : '⤓ Export CSV'}
            </Button>
            {/* Phones use the tab bar's + instead. Wrapped: a display class on Button clashes with its inline-flex. */}
            <span className="hidden sm:block">
              <Button onClick={crud.openCreate}>+ Record Expense</Button>
            </span>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:mb-8 md:flex-row md:items-center md:justify-between">
        {/* Dimmed while a search spans every month: the month isn't what's being shown. */}
        <div className={allMonths ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
          <MonthStepper month={month} onChange={changeMonth} />
        </div>
        <div className="flex gap-3">
          <input
            type="search"
            aria-label="Search expenses"
            placeholder="Search descriptions…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-transparent px-4 text-base transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-border-hover focus-visible:border-accent sm:text-sm md:w-56 md:flex-none"
          />
          <FilterSelect label="Filter by category" options={categoryFilter} value={category} onChange={(e) => changeCategory(e.target.value)} className="max-w-[45%] sm:max-w-none" />
        </div>
      </div>

      {q && (
        <p role="status" className="-mt-2 mb-4 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground sm:-mt-4 sm:mb-6">
          <span className="small-caps text-accent">Search</span>
          <span>
            {allMonths ? 'Searching all months' : <>Searching {formatMonth(month)} only</>}
          </span>
          <button
            type="button"
            onClick={() => setScope(!allMonths)}
            className="min-h-11 touch-manipulation text-accent underline underline-offset-4 hover:text-foreground"
          >
            {allMonths ? `Only ${formatMonth(month)}` : 'Search all months'}
          </button>
        </p>
      )}

      <Card accentTop className="overflow-hidden">
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={filtered ? 'Nothing matches' : 'This page is still blank'}
            message={
              allMonths
                ? `No expense in any month matches “${q}”.`
                : filtered
                  ? 'Try a different search or category.'
                  : `No expenses recorded for ${formatMonth(month)}.`
            }
            action={!filtered && <Button variant="outline" onClick={crud.openCreate}>Record the first one</Button>}
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* Phones: the total first, then tappable rows (tap to edit; delete lives in the form). */}
            <div className="flex items-baseline justify-between border-b border-border bg-muted/50 px-4 py-3 md:hidden">
              <span className="small-caps text-[0.625rem] text-muted-foreground">
                {data?.summary.count} {q ? 'found' : 'transactions'}
              </span>
              <span className="figure text-xl">{formatCurrency(data?.summary.total_amount ?? 0)}</span>
            </div>
            <ul className="divide-y divide-border md:hidden">
              {rows.map((e) => (
                <li key={e.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => crud.openEdit(e)}
                    className="flex min-h-16 min-w-0 flex-1 touch-manipulation items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {formatDate(e.spent_at, dateOpts)} · {categoryLabels[e.category]} · {e.paid_by}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="figure block whitespace-nowrap text-base">{formatCurrency(e.amount)}</span>
                      <span className="block whitespace-nowrap text-[0.6875rem] text-muted-foreground">{paymentDisplay(e.payment_method, e.bank)}</span>
                    </span>
                  </button>
                  {e.has_receipt && (
                    <span className="pr-2">
                      <ReceiptButton label={e.title} onClick={() => setViewing(e)} />
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th>Category</Th>
                  <Th className="hidden lg:table-cell">Paid by</Th>
                  <Th className="text-right">Amount</Th>
                  <Th><span className="sr-only">Actions</span></Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <Tr key={e.id}>
                    <Td className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatDate(e.spent_at, dateOpts)}
                    </Td>
                    <Td>
                      <p className="font-medium">{e.title}</p>
                    </Td>
                    <Td className="text-muted-foreground">{categoryLabels[e.category]}</Td>
                    <Td className="hidden text-muted-foreground lg:table-cell">
                      {e.paid_by} <span className="text-muted-foreground/60">· {paymentDisplay(e.payment_method, e.bank)}</span>
                    </Td>
                    <Td className="figure whitespace-nowrap text-right text-base">{formatCurrency(e.amount)}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        {e.has_receipt && <ReceiptButton label={e.title} onClick={() => setViewing(e)} />}
                        <RowActions label={e.title} onEdit={() => crud.openEdit(e)} onDelete={() => crud.askDelete(e)} />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            </div>
            <div className="hidden items-baseline justify-between border-t-2 border-double border-border bg-muted/50 px-6 py-5 sm:px-8 md:flex">
              <span className="small-caps text-muted-foreground">
                Total · {data?.summary.count} {q ? `found${allMonths ? ' across all months' : ''}` : 'transactions'}
              </span>
              <span className="figure text-2xl">{formatCurrency(data?.summary.total_amount ?? 0)}</span>
            </div>
            {data && <Pagination meta={data.meta} onPage={setPage} />}
          </div>
        )}
      </Card>

      <Modal
        open={crud.formOpen}
        eyebrow={crud.editing ? 'Edit entry' : 'New entry'}
        title={crud.editing ? crud.editing.title : 'New Expense'}
        onClose={crud.closeForm}
      >
        <ExpenseForm
          initial={crud.editing}
          saving={crud.saving}
          errors={crud.errors}
          onSubmit={(input, receipt) => crud.save(input, (saved) => applyReceiptChange('expenses', saved.id, receipt))}
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
        target={viewing && { type: 'expenses', id: viewing.id, title: viewing.title }}
        onClose={() => setViewing(null)}
      />

      <ConfirmDialog
        open={!!crud.deleting}
        title="Delete this expense?"
        message={`“${crud.deleting?.title}” will be permanently removed from the book${crud.deleting?.has_receipt ? ', along with its receipt' : ''}.`}
        busy={crud.saving}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
        onCancel={crud.cancelDelete}
      />
    </>
  )
}
