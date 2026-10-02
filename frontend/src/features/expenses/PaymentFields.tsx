import { SelectField } from '../../components/ui/Field'
import { useCatalog } from '../catalog/useCatalog'

/**
 * Payment method, plus an account picker (the bank for Bank Transfer, the
 * wallet for E-Wallet…) that appears only when the method has accounts.
 * Renders as grid cells, so it drops straight into a two-column form grid.
 * The account starts unchosen on purpose: picking the wrong one by default
 * would go unnoticed.
 */
export function PaymentFields({
  method,
  account,
  initial,
  onMethodChange,
  onAccountChange,
  errors,
}: {
  method: string
  account: string
  /** The record's saved choices, kept selectable even if hidden since. */
  initial?: { method: string; account: string | null }
  onMethodChange: (method: string) => void
  onAccountChange: (account: string) => void
  errors: Record<string, string>
}) {
  const { methodOptions, accountOptions, needsAccount } = useCatalog()

  return (
    <>
      <SelectField
        label="Payment Method"
        options={methodOptions(initial?.method)}
        value={method}
        onChange={(e) => onMethodChange(e.target.value)}
        error={errors.payment_method}
      />
      {needsAccount(method) && (
        <SelectField
          label={method === 'transfer' ? 'Bank' : 'Account'}
          options={[{ value: '', label: 'Choose…' }, ...accountOptions(method, initial?.account)]}
          value={account}
          onChange={(e) => onAccountChange(e.target.value)}
          error={errors.payment_account}
          required
        />
      )}
    </>
  )
}
