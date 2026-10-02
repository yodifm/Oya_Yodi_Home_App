import { SelectField } from '../../components/ui/Field'
import { bankLabels, paymentLabels, toOptions } from '../../lib/labels'
import type { Bank, PaymentMethod } from '../../types'

const bankOptions = [{ value: '', label: 'Choose a bank…' }, ...toOptions(bankLabels)]

/**
 * Payment method, plus a bank picker that appears only for bank transfers.
 * Renders as grid cells, so it drops straight into a two-column form grid.
 * The bank starts unchosen on purpose: picking the wrong account by default
 * would go unnoticed.
 */
export function PaymentFields({
  method,
  bank,
  onMethodChange,
  onBankChange,
  errors,
}: {
  method: PaymentMethod
  bank: Bank | ''
  onMethodChange: (method: PaymentMethod) => void
  onBankChange: (bank: Bank | '') => void
  errors: Record<string, string>
}) {
  return (
    <>
      <SelectField
        label="Payment Method"
        options={toOptions(paymentLabels)}
        value={method}
        onChange={(e) => onMethodChange(e.target.value as PaymentMethod)}
        error={errors.payment_method}
      />
      {method === 'transfer' && (
        <SelectField
          label="Bank"
          options={bankOptions}
          value={bank}
          onChange={(e) => onBankChange(e.target.value as Bank | '')}
          error={errors.bank}
          required
        />
      )}
    </>
  )
}
