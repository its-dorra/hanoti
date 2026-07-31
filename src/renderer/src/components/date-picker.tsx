'use client'

import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { arDZ } from 'react-day-picker/locale'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '#lib/utils'

export function DatePicker({
  date,
  setDate,
  buttonClassName,
  calendarClassName
}: {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  buttonClassName?: string
  calendarClassName?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            'w-74 justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
            buttonClassName
          )}
        >
          <CalendarIcon />
          {date ? format(date, 'PPP') : <span>اختر تاريخا</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          className={cn('w-74', calendarClassName)}
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={arDZ}
          disabled={{
            after: new Date()
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
