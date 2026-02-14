import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ObservationCalendarProps {
  /** Map of "YYYY-MM-DD" → observation count */
  dateCountMap: Map<string, number>;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const ObservationCalendar = ({ dateCountMap }: ObservationCalendarProps) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const navigateMonth = (direction: -1 | 1) => {
    const newDate = new Date(viewYear, viewMonth + direction);
    setViewYear(newDate.getFullYear());
    setViewMonth(newDate.getMonth());
  };

  const monthTotal = useMemo(() => {
    let total = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDateKey(viewYear, viewMonth, d);
      total += dateCountMap.get(key) || 0;
    }
    return total;
  }, [dateCountMap, viewYear, viewMonth, daysInMonth]);

  const getCellColor = (count: number) => {
    if (count === 0) return "bg-space-blue-dark";
    if (count === 1) return "bg-stellar-gold/30";
    if (count === 2) return "bg-stellar-gold/60";
    return "bg-stellar-gold";
  };

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-star-white">{monthLabel}</h3>
          <p className="text-sm text-star-dim">
            {monthTotal} observation{monthTotal !== 1 ? "s" : ""} this month
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs text-star-dim py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = formatDateKey(viewYear, viewMonth, day);
          const count = dateCountMap.get(key) || 0;
          const isToday = key === todayKey;

          return (
            <div
              key={day}
              className={`aspect-square rounded-md flex items-center justify-center text-xs relative cursor-default transition-colors ${getCellColor(count)} ${
                isToday ? "ring-2 ring-nebula-pink" : ""
              } ${count > 0 ? "text-space-blue-dark font-medium" : "text-star-dim"}`}
              title={`${key}: ${count} observation${count !== 1 ? "s" : ""}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-4 text-xs text-star-dim">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm bg-space-blue-dark" />
          <div className="w-4 h-4 rounded-sm bg-stellar-gold/30" />
          <div className="w-4 h-4 rounded-sm bg-stellar-gold/60" />
          <div className="w-4 h-4 rounded-sm bg-stellar-gold" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ObservationCalendar;
