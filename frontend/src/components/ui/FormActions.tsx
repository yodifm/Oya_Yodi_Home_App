import { Button } from './Button'

/**
 * Footer shared by every create/edit form: form-level error, then actions.
 * On phones it sticks to the bottom of the sheet so Save is always in reach;
 * Cancel is dropped there (the sheet's × and backdrop already close it).
 */
export function FormActions({
  saving,
  isEdit,
  error,
  onCancel,
  onDelete,
}: {
  saving: boolean
  isEdit: boolean
  error?: string
  onCancel: () => void
  /** Offered when editing — on phones the list rows have no delete button. */
  onDelete?: () => void
}) {
  return (
    <>
      {error && (
        <p role="alert" className="mt-6 rounded-md bg-danger-muted px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 -mx-5 mt-8 flex items-center gap-3 border-t border-border bg-card px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:mt-10 sm:px-0 sm:pb-0 sm:pt-6">
        {isEdit && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="min-h-11 touch-manipulation px-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-danger hover:underline"
          >
            Delete
          </button>
        )}
        <div className="ml-auto flex flex-1 items-center justify-end gap-3 sm:flex-none">
          {/* Wrapped: a display class on Button would clash with its own inline-flex. */}
          <span className="hidden sm:block">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </span>
          <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Entry'}
          </Button>
        </div>
      </div>
    </>
  )
}
