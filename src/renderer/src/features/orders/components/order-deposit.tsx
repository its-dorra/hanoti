import { Input } from '#components/ui/input'
import { Label } from '#components/ui/label'

interface OrderDepositProps {
  value: number
  onChange: (value: number) => void
}

export function OrderDeposit({ value, onChange }: OrderDepositProps) {
  return (
    <div className="max-w-xs space-y-1.5">
      <Label htmlFor="depositAmount">المبلغ المودع (اختياري)</Label>

      <Input
        id="depositAmount"
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value)

          onChange(Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0)
        }}
      />

      <p className="text-xs text-muted-foreground">
        دفعة تُسجَّل بشكل مستقل عند إنشاء الطلب — ستُخصم من دين العميل تلقائيًا.
      </p>
    </div>
  )
}
