import { DatePicker } from '#components/date-picker'
import { Button } from '#components/ui/button'
import { Checkbox } from '#components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger
} from '#components/ui/dialog'
import { Label } from '#components/ui/label'
import { Printer } from 'lucide-react'
import { useId, useState } from 'react'
import { printInvoice } from '../utils'

export default function PrintOrderDialog({
  orderId,
  createdAt
}: {
  orderId: number
  createdAt: Date
}) {
  const [checked, setChecked] = useState(false)
  const [date, setDate] = useState<Date | undefined>(createdAt)
  const checkboxId = useId()

  function handlePrint() {
    printInvoice(orderId, checked ? date : undefined)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Printer />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>طباعة الفاتورة</DialogHeader>
        <div className="flex items-center gap-2">
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(value) => setChecked(value === 'indeterminate' ? false : value)}
          />
          <Label htmlFor={checkboxId}>طباعة الفاتورة مع ملخص الحساب</Label>
        </div>
        {checked && (
          <div className="mt-2 space-y-2">
            <Label>تاريخ الفاتورة</Label>
            <DatePicker date={date} setDate={setDate} />
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button onClick={handlePrint}>طباعة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
