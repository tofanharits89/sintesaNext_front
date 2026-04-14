"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date | undefined
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showTime?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  showTime = false,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "00:00"
  )

  React.useEffect(() => {
    setSelectedDate(date)
    if (date) {
      setTimeValue(format(date, "HH:mm"))
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate && showTime) {
      const [hStr, mStr] = timeValue.split(":");
      const hours = Number(hStr ?? 0);
      const minutes = Number(mStr ?? 0);
      newDate.setHours(hours, minutes)
    }
    setSelectedDate(newDate)
    onDateChange?.(newDate)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeValue = e.target.value
    setTimeValue(newTimeValue)
    
    if (selectedDate) {
      const [hStr, mStr] = newTimeValue.split(":");
      const hours = Number(hStr ?? 0);
      const minutes = Number(mStr ?? 0);
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes)
      setSelectedDate(newDate)
      onDateChange?.(newDate)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-zinc-100 dark:bg-black active:scale-100",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            showTime ? (
              format(selectedDate, "PPP HH:mm")
            ) : (
              format(selectedDate, "PPP")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        {showTime && (
          <div className="p-3 border-t">
            <Label htmlFor="time-picker" className="text-sm font-medium">Time</Label>
            <Input
              id="time-picker"
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-full mt-1"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
