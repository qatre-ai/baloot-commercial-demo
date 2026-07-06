"use client";

import React, { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  isoToJalaali,
  jalaaliToIso,
  jalaaliMonthDays,
  getCurrentJalaali,
  JALALI_MONTHS_FA,
  JALALI_MONTHS_EN,
  toPersianDigits,
  toLatinDigits,
  formatJalaaliDate,
  calculateAge,
} from "@/lib/jalali";

interface PersianDatePickerProps {
  /** ISO date string (YYYY-MM-DD) - the value stored in the database */
  value: string;
  /** Called when the user selects a date, returns ISO string */
  onChange: (isoDate: string) => void;
  /** RTL mode */
  isRTL?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Label for the field */
  label?: string;
  /** Whether to show the age indicator */
  showAge?: boolean;
  /** Additional class name */
  className?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  isRTL = true,
  placeholder,
  error,
  disabled = false,
  label,
  showAge = true,
  className,
}: PersianDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"calendar" | "manual">("calendar");

  // Parse current value to Jalali
  const currentJalali = useMemo(() => {
    if (!value) return null;
    return isoToJalaali(value);
  }, [value]);

  // Calendar view state - defaults to selected date or today
  const now = getCurrentJalaali();
  const [viewYear, setViewYear] = useState(() => currentJalali?.jy || now.jy);
  const [viewMonth, setViewMonth] = useState(() => currentJalali?.jm || now.jm);

  // Manual input state
  const [manualInput, setManualInput] = useState("");

  // When a new date is selected from outside, navigate the calendar view to it
  const handleOnChange = useCallback((isoDate: string) => {
    onChange(isoDate);
    if (isoDate) {
      const j = isoToJalaali(isoDate);
      if (j) {
        setViewYear(j.jy);
        setViewMonth(j.jm);
      }
    }
  }, [onChange]);

  // Generate calendar days for current view
  const calendarDays = useMemo(() => {
    const daysInMonth = jalaaliMonthDays(viewYear, viewMonth);

    // Find what day of week the 1st of the month falls on
    // Convert 1st of month to Gregorian to use Date object for day-of-week
    const firstDayIso = jalaaliToIso(viewYear, viewMonth, 1);
    if (!firstDayIso) return { days: [], firstDayOffset: 0 };

    const firstDayDate = new Date(firstDayIso);
    // In Iranian calendar, week starts on Saturday (6 = Saturday in JS)
    const jsDay = firstDayDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to Saturday-based week: Sat=0, Sun=1, ..., Fri=6
    const firstDayOffset = (jsDay + 1) % 7;

    const days: (number | null)[] = [];
    // Empty cells before first day
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(null);
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return { days, firstDayOffset };
  }, [viewYear, viewMonth]);

  const handleDaySelect = useCallback(
    (day: number) => {
      const isoDate = jalaaliToIso(viewYear, viewMonth, day);
      if (isoDate) {
        handleOnChange(isoDate);
        setOpen(false);
      }
    },
    [viewYear, viewMonth, handleOnChange]
  );

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }, [viewMonth, viewYear]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }, [viewMonth, viewYear]);

  const handleYearChange = useCallback((direction: "up" | "down") => {
    setViewYear((prev) => (direction === "up" ? prev + 1 : prev - 1));
  }, []);

  const handleManualInput = useCallback(() => {
    const cleaned = toLatinDigits(manualInput.trim());
    // Try parsing formats: YYYY/MM/DD or YYYY-MM-DD
    const match = cleaned.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/);
    if (match) {
      const [, y, m, d] = match.map(Number);
      const isoDate = jalaaliToIso(y, m, d);
      if (isoDate) {
        handleOnChange(isoDate);
        setManualInput("");
        setInputMode("calendar");
        return;
      }
    }
    // Invalid input - stay in manual mode
  }, [manualInput, handleOnChange]);

  const handleManualKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleManualInput();
      } else if (e.key === "Escape") {
        setManualInput("");
        setInputMode("calendar");
      }
    },
    [handleManualInput]
  );

  // Display value
  const displayValue = useMemo(() => {
    if (!value || !currentJalali) return "";
    return formatJalaaliDate(value, isRTL, "long");
  }, [value, currentJalali, isRTL]);

  // Age display
  const age = useMemo(() => {
    if (!showAge || !value) return null;
    return calculateAge(value);
  }, [showAge, value]);

  const isMinor = age !== null && age < 18;

  // Weekday headers (Saturday-based)
  const weekHeaders = isRTL
    ? ["ش", "ی", "د", "س", "چ", "پ", "ج"]
    : ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];

  // Today in Jalali
  const todayJalali = getCurrentJalaali();
  const isToday = (day: number) =>
    viewYear === todayJalali.jy && viewMonth === todayJalali.jm && day === todayJalali.jd;
  const isSelected = (day: number) =>
    currentJalali && viewYear === currentJalali.jy && viewMonth === currentJalali.jm && day === currentJalali.jd;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-right h-11 rounded-xl font-normal",
                !displayValue && "text-muted-foreground",
                error && "border-destructive"
              )}
            >
              <Calendar className={cn("w-4 h-4 shrink-0", isRTL ? "ml-2" : "mr-2")} />
              <span className={cn("truncate", displayValue ? "text-foreground" : "text-muted-foreground")}>
                {displayValue || (placeholder || (isRTL ? "انتخاب تاریخ (شمسی)" : "Select date (Jalali)"))}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-xl shadow-xl border-border/50"
            align="start"
            sideOffset={4}
          >
            {/* Calendar Header */}
            <div className="p-3 border-b border-border/40">
              <div className={cn("flex items-center justify-between gap-2", isRTL && "flex-row-reverse")}>
                {/* Month navigation */}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                  {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>

                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  {/* Month name */}
                  <span className="text-sm font-semibold min-w-[80px] text-center">
                    {isRTL ? JALALI_MONTHS_FA[viewMonth - 1] : JALALI_MONTHS_EN[viewMonth - 1]}
                  </span>

                  {/* Year with up/down arrows */}
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleYearChange("up")}>
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-semibold min-w-[40px] text-center" dir="ltr">
                      {isRTL ? toPersianDigits(viewYear) : viewYear}
                    </span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleYearChange("down")}>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                  {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-2">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-0 mb-1">
                {weekHeaders.map((h, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-7 flex items-center justify-center text-[10px] font-medium text-muted-foreground",
                      i === 6 && "text-red-400" // Friday is red
                    )}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0">
                {calendarDays.days.map((day, i) => (
                  <div key={i} className="h-7 flex items-center justify-center">
                    {day !== null ? (
                      <button
                        type="button"
                        onClick={() => handleDaySelect(day)}
                        className={cn(
                          "h-7 w-7 rounded-md text-xs transition-colors",
                          "hover:bg-primary/10 hover:text-primary",
                          "focus:outline-none focus:ring-1 focus:ring-primary/30",
                          isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-bold",
                          isToday(day) && !isSelected(day) && "border border-primary/30 text-primary font-medium",
                          i % 7 === 6 && !isSelected(day) && "text-red-400" // Friday
                        )}
                      >
                        {isRTL ? toPersianDigits(day) : day}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with quick actions */}
            <div className={cn("p-2 border-t border-border/40 flex items-center justify-between gap-2", isRTL && "flex-row-reverse")}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => {
                  const today = getCurrentJalaali();
                  const iso = jalaaliToIso(today.jy, today.jm, today.jd);
                  if (iso) {
                    handleOnChange(iso);
                    setOpen(false);
                  }
                }}
              >
                {isRTL ? "امروز" : "Today"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => {
                  setInputMode(inputMode === "calendar" ? "manual" : "calendar");
                }}
              >
                {inputMode === "calendar"
                  ? (isRTL ? "ورود دستی" : "Manual input")
                  : (isRTL ? "تقویم" : "Calendar")}
              </Button>
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-destructive"
                  onClick={() => {
                    handleOnChange("");
                    setOpen(false);
                  }}
                >
                  {isRTL ? "پاک کردن" : "Clear"}
                </Button>
              )}
            </div>

            {/* Manual input mode */}
            {inputMode === "manual" && (
              <div className="p-2 border-t border-border/40">
                <p className="text-[10px] text-muted-foreground mb-1.5">
                  {isRTL ? "تاریخ شمسی را وارد کنید (مثال: 1403/09/15)" : "Enter Jalali date (e.g., 1403/09/15)"}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={handleManualKeyDown}
                    placeholder={isRTL ? "1403/09/15" : "1403/09/15"}
                    dir="ltr"
                    className="h-8 text-sm rounded-lg"
                  />
                  <Button
                    size="sm"
                    className="h-8 rounded-lg shrink-0"
                    onClick={handleManualInput}
                  >
                    {isRTL ? "تأیید" : "OK"}
                  </Button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Age indicator */}
      {showAge && age !== null && (
        <div className={cn(
          "flex items-center gap-1.5 text-[11px]",
          isMinor ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        )}>
          <span>
            {isRTL
              ? `${toPersianDigits(age)} ساله${isMinor ? " (زیر ۱۸ سال)" : ""}`
              : `${age} years old${isMinor ? " (under 18)" : ""}`}
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
