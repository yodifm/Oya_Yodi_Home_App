import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { FilterSelect } from '../../components/ui/Field'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { today } from '../../lib/format'
import type { Paginated } from '../../types'
import { useAuth } from '../auth/useAuth'
import type { ActivityEntry, ActivitySubject } from './format'
import { dayKey, dayLabel, describe, fieldLabel, formatValue, subjectLabels, summaryText, timeOf } from './format'

const fetchActivity = (params: Record<string, string | undefined>) =>
  api.request<Paginated<ActivityEntry>>(`/activity${api.query(params)}`)

const typeOptions = [
  { value: '', label: 'All records' },
  ...(Object.entries(subjectLabels) as [ActivitySubject, string][]).map(([value, label]) => ({ value, label })),
]

const actionTone = {
  created: 'text-success',
  updated: 'text-accent',
  deleted: 'text-danger',
} as const

function Entry({ entry }: { entry: ActivityEntry }) {
  const changes = entry.changes ? Object.entries(entry.changes) : []
  return (
    <li className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-8">
      <span
        aria-hidden
        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent-muted font-display text-base italic text-accent"
      >
        {entry.user?.charAt(0) ?? '·'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm">
            <span className="font-medium">{entry.user ?? 'System'}</span>{' '}
            <span className={cn('font-medium', actionTone[entry.action])}>{describe(entry)}</span>
          </p>
          <time dateTime={entry.created_at} className="shrink-0 font-mono text-xs text-muted-foreground">
            {timeOf(entry.created_at)}
          </time>
        </div>
        <p className={cn('mt-0.5 truncate', entry.action === 'deleted' && 'text-muted-foreground line-through decoration-danger/50')}>
          {summaryText(entry)}
        </p>
        {changes.length > 0 && (
          <dl className="mt-2 space-y-1 rounded-md bg-muted/60 px-3 py-2 text-xs">
            {changes.map(([field, pair]) => (
              <div key={field} className="flex flex-wrap gap-x-2">
                <dt className="small-caps text-[0.625rem] text-muted-foreground">{fieldLabel(field)}</dt>
                <dd className="min-w-0 break-words">
                  {pair === null ? (
                    <span className="text-muted-foreground">changed</span>
                  ) : (
                    <>
                      <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                        {formatValue(entry.subject_type, field, pair[0])}
                      </span>
                      <span aria-label="changed to" className="px-1.5 text-accent">
                        →
                      </span>
                      <span className="font-medium">{formatValue(entry.subject_type, field, pair[1])}</span>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </li>
  )
}

export function ActivityPage() {
  const { members } = useAuth()
  const [userId, setUserId] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error, reload } = useAsync(
    () => fetchActivity({ user_id: userId, subject_type: type, page: String(page) }),
    [userId, type, page],
  )

  const personOptions = [{ value: '', label: 'Everyone' }, ...members.map((m) => ({ value: String(m.id), label: m.name }))]

  // Group consecutive entries by local calendar day (they arrive newest first).
  const todayKey = today()
  const yesterday = new Date(`${todayKey}T00:00:00`)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = yesterday.toLocaleDateString('en-CA')
  const groups: { key: string; entries: ActivityEntry[] }[] = []
  for (const entry of data?.data ?? []) {
    const key = dayKey(entry.created_at)
    if (groups.at(-1)?.key !== key) groups.push({ key, entries: [] })
    groups.at(-1)!.entries.push(entry)
  }

  return (
    <>
      <PageHeader
        eyebrow="Chapter VIII — Activity"
        title={
          <>
            Who Did <span className="italic text-accent">What</span>
          </>
        }
        description="Every addition, edit and removal in the book — by whom, and when."
        actions={
          <div className="flex w-full gap-3 lg:w-auto">
            <FilterSelect
              label="Filter by person"
              options={personOptions}
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value)
                setPage(1)
              }}
              className="min-w-0 flex-1 bg-card shadow-sm lg:flex-none"
            />
            <FilterSelect
              label="Filter by record type"
              options={typeOptions}
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                setPage(1)
              }}
              className="min-w-0 flex-1 bg-card shadow-sm lg:flex-none"
            />
          </div>
        }
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            title="Nothing recorded yet"
            message={userId || type ? 'No activity matches these filters.' : 'Changes appear here as soon as anyone adds, edits or removes something.'}
          />
        </Card>
      ) : (
        <div className={cn('space-y-8 transition-opacity', loading && 'opacity-60')}>
          {groups.map((group) => (
            <section key={group.key} aria-label={dayLabel(group.key, todayKey, yesterdayKey)}>
              <h2 className="small-caps mb-3 text-accent">{dayLabel(group.key, todayKey, yesterdayKey)}</h2>
              <Card className="overflow-hidden">
                <ol className="divide-y divide-border">
                  {group.entries.map((entry) => (
                    <Entry key={entry.id} entry={entry} />
                  ))}
                </ol>
              </Card>
            </section>
          ))}
          {data && data.meta.last_page > 1 && (
            <Card className="overflow-hidden">
              <Pagination meta={data.meta} onPage={setPage} />
            </Card>
          )}
        </div>
      )}
    </>
  )
}
