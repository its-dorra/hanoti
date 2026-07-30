'use client'

import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { arDZ } from 'react-day-picker/locale'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function DatePicker({
  date,
  setDate
}: {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="w-70 justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon />
          {date ? format(date, 'PPP') : <span>اختر تاريخا</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} locale={arDZ} />
      </PopoverContent>
    </Popover>
  )
}
