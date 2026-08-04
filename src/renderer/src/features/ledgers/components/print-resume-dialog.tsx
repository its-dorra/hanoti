import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
  DialogFooter
} from '#components/ui/dialog'
import { Button } from '#components/ui/button'
import { printResume } from '../utils'
import { Printer } from 'lucide-react'
import { DatePicker } from '#components/date-picker'

export default function PrintResumeDialog({ clientId }: { clientId: number }) {
  const [open, setOpen] = useState(false)
  const [resumeDate, setResumeDate] = useState<Date | undefined>(new Date())
  const [error, setError] = useState<string | null>(null)
  const handlePrint = async () => {
    if (!resumeDate) {
      setError('يرجى اختيار تاريخ ملخص الحساب قبل الطباعة.')
      return
    }
    await printResume(clientId, resumeDate)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Printer />
          <span>طباعة كشف الحساب</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>طباعة كشف الحساب</DialogTitle>
          <DialogDescription>هل أنت متأكد أنك تريد طباعة كشف الحساب للعميل؟</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <DatePicker date={resumeDate} setDate={setResumeDate} />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
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
