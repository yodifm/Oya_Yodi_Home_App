import { useEffect, useState } from 'react'
import { expensesApi } from '../../features/expenses/api'
import { ExpenseForm } from '../../features/expenses/ExpenseForm'
import { useCrudPage } from '../../hooks/useCrudPage'
import { notifyDataChanged } from '../../lib/events'
import { applyReceiptChange } from '../../lib/receipts'
import { Modal } from '../ui/Modal'
import { Toast } from './MobileNav'

/**
 * The quick-add expense sheet behind the tab bar's + button. It saves like the
 * Expenses page does, then tells every open page to refresh.
 */
export function useQuickAddExpense() {
  const [toast, setToast] = useState<string | null>(null)
  const crud = useCrudPage(expensesApi, () => {
    notifyDataChanged()
    setToast('Expense recorded')
  })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const sheet = (
    <>
      <Modal open={crud.formOpen} eyebrow="Quick entry" title={crud.editing ? crud.editing.title : 'New Expense'} onClose={crud.closeForm}>
        <ExpenseForm
          initial={crud.editing}
          saving={crud.saving}
          errors={crud.errors}
          onSubmit={(input, receipt) => crud.save(input, (saved) => applyReceiptChange('expenses', saved.id, receipt))}
          onCancel={crud.closeForm}
        />
      </Modal>
      <Toast message={toast} />
    </>
  )

  return { open: crud.openCreate, sheet }
}
