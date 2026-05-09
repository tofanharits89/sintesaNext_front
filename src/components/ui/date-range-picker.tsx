"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { id } from "date-fns/locale/id"

import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  date?: DateRange | undefined
  onDateChange?: (date: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  disabledDates?: any
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  placeholder = "Pilih rentang tanggal",
  disabled = false,
  disabledDates,
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            noAnimate={true}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal bg-zinc-100 dark:bg-black",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd MMM yyyy", { locale: id })} -{" "}
                  {format(date.to, "dd MMM yyyy", { locale: id })}
                </>
              ) : (
                format(date.from, "dd MMM yyyy", { locale: id })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from ?? new Date()}
            selected={date}
            numberOfMonths={2}
            locale={id}
            disabled={disabledDates}
            {...(onDateChange && { onSelect: onDateChange })}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
