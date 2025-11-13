"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

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

interface DateTimePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Pilih tanggal",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [time, setTime] = React.useState<string>(
    date ? format(date, "HH:mm") : "10:00"
  )

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setTime(format(date, "HH:mm"))
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Apply the current time to the new date
      const [hStr, mStr] = time.split(":");
      const hours = Number(hStr ?? 0);
      const minutes = Number(mStr ?? 0);
      newDate.setHours(hours, minutes, 0, 0);
      setSelectedDate(newDate);
      onDateChange?.(newDate);
      setOpen(false);
    } else {
      setSelectedDate(undefined);
      onDateChange?.(undefined);
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    
    if (selectedDate && newTime) {
      const [hStr, mStr] = newTime.split(":");
      const hours = Number(hStr ?? 0);
      const minutes = Number(mStr ?? 0);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      setSelectedDate(newDate);
      onDateChange?.(newDate);
    }
  }

  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1">
          Tanggal
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className={cn(
                "w-[200px] justify-between font-normal bg-zinc-100 dark:bg-black",
                !selectedDate && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              {selectedDate ? format(selectedDate, "dd MMM yyyy", { locale: id }) : placeholder}
              <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1">
          Waktu
        </Label>
        <Input
          type="time"
          id="time-picker"
          value={time}
          onChange={handleTimeChange}
          disabled={disabled}
          className="w-[120px] bg-zinc-100 dark:bg-black"
        />
      </div>
    </div>
  )
}
