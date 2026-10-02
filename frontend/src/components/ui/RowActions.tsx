/** Inline edit/delete text links for a table row or card. */
export function RowActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string
  onEdit: () => void
  onDelete: () => void
}) {
  const link =
    'min-h-11 touch-manipulation px-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:underline'
  return (
    <div className="flex justify-end gap-1">
      <button type="button" onClick={onEdit} aria-label={`Edit ${label}`} className={`${link} decoration-accent hover:text-foreground`}>
        Edit
      </button>
      <button type="button" onClick={onDelete} aria-label={`Delete ${label}`} className={`${link} hover:text-danger`}>
        Delete
      </button>
    </div>
  )
}
