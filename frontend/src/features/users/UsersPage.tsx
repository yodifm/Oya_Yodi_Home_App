import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { Switch } from '../../components/ui/Switch'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useAsync } from '../../hooks/useAsync'
import { useCrudPage } from '../../hooks/useCrudPage'
import { formatDate } from '../../lib/format'
import type { ManagedUser } from '../../types'
import { useAuth } from '../auth/useAuth'
import { usersApi } from './api'
import { UserForm } from './UserForm'

const link =
  'min-h-11 touch-manipulation px-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:underline disabled:pointer-events-none disabled:opacity-40'

function UserCard({
  user,
  isMe,
  onEdit,
  onDelete,
  onToggleEmail,
}: {
  user: ManagedUser
  isMe: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleEmail: (on: boolean) => Promise<void>
}) {
  const [savingEmail, setSavingEmail] = useState(false)
  const inUse = user.expenses_count + user.claims_count > 0
  // Explain *why* delete is unavailable instead of failing after a click.
  const deleteBlocked = isMe ? 'You cannot delete your own account.' : inUse ? 'Has expenses or claims — reassign them first.' : null

  return (
    <Card hoverEffect accentTop={isMe} className="flex flex-col p-5 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent-muted font-display text-2xl italic text-accent"
        >
          {user.name.charAt(0)}
        </span>
        {isMe && <Badge tone="accent">You</Badge>}
      </div>

      <h3 className="mt-5 text-2xl">{user.name}</h3>
      <p className="truncate text-sm text-muted-foreground">{user.email}</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <dt className="small-caps text-[0.625rem] text-muted-foreground">Expenses paid</dt>
          <dd className="figure mt-1 text-2xl">{user.expenses_count}</dd>
        </div>
        <div>
          <dt className="small-caps text-[0.625rem] text-muted-foreground">Claims</dt>
          <dd className="figure mt-1 text-2xl">{user.claims_count}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-border pt-2">
        <Switch
          label="Email updates"
          description={user.email_notifications ? `Sent to ${user.email}` : 'Off — no emails for this person'}
          checked={user.email_notifications}
          disabled={savingEmail}
          onChange={async (on) => {
            setSavingEmail(true)
            try {
              await onToggleEmail(on)
            } finally {
              setSavingEmail(false)
            }
          }}
        />
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
          <span className="small-caps text-[0.625rem] text-muted-foreground">
            {user.created_at ? `Since ${formatDate(user.created_at, { day: undefined })}` : ''}
          </span>
          <div className="flex gap-1">
            <button type="button" onClick={onEdit} aria-label={`Edit ${user.name}`} className={`${link} decoration-accent hover:text-foreground`}>
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={!!deleteBlocked}
              title={deleteBlocked ?? undefined}
              aria-label={`Delete ${user.name}`}
              className={`${link} hover:text-danger`}
            >
              Delete
            </button>
          </div>
        </div>
        {deleteBlocked && <p className="mt-1 text-xs text-muted-foreground/80">{deleteBlocked}</p>}
      </div>
    </Card>
  )
}

export function UsersPage() {
  const { user: me, refresh } = useAuth()
  const { data = [], loading, error, reload } = useAsync(() => usersApi.list(), [])
  // Users feed the Paid by / Claimed by dropdowns, so refresh those too.
  const crud = useCrudPage(usersApi, () => {
    reload()
    void refresh()
  })

  return (
    <>
      <PageHeader
        eyebrow="Chapter VIII — Users"
        title={
          <>
            The <span className="italic text-accent">Household</span>
          </>
        }
        description="Everyone who can sign in. Each person also appears in the “Paid by” and “Claimed by” lists."
        actions={<Button onClick={crud.openCreate}>+ Add User</Button>}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-4 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {data.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              isMe={u.id === me?.id}
              onEdit={() => crud.openEdit(u)}
              onDelete={() => crud.askDelete(u)}
              onToggleEmail={async (on) => {
                await usersApi.update(u.id, { name: u.name, email: u.email, password: null, password_confirmation: null, email_notifications: on })
                reload()
              }}
            />
          ))}
        </div>
      )}

      <Modal
        open={crud.formOpen}
        eyebrow={crud.editing ? 'Edit user' : 'New user'}
        title={crud.editing ? crud.editing.name : 'Add a User'}
        onClose={crud.closeForm}
      >
        <UserForm initial={crud.editing} saving={crud.saving} errors={crud.errors} onSubmit={crud.save} onCancel={crud.closeForm} />
      </Modal>

      <ConfirmDialog
        open={!!crud.deleting}
        title="Delete this user?"
        message={`${crud.deleting?.name} will no longer be able to sign in.`}
        busy={crud.saving}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
        onCancel={crud.cancelDelete}
      />
    </>
  )
}
