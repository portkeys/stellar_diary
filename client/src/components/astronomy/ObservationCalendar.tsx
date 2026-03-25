import { useMemo } from "react";

interface ObservationCalendarProps {
  /** Map of "YYYY-MM-DD" → observation count */
  dateCountMap: Map<string, number>;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const ObservationCalendar = ({ dateCountMap }: ObservationCalendarProps) => {
  const { weeks, monthPositions, totalYear } = useMemo(() => {
    const today = new Date();
    // Go back ~52 weeks (364 days)
    const start = new Date(today);
    start.setDate(start.getDate() - 363);
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay());

    const weeksArr: { date: Date; count: number; key: string }[][] = [];
    const monthPos: { label: string; col: number }[] = [];
    let currentWeek: { date: Date; count: number; key: string }[] = [];
    let lastMonth = -1;
    let total = 0;

    const cursor = new Date(start);
    while (cursor <= today) {
      const key = formatDateKey(cursor);
      const count = dateCountMap.get(key) || 0;
      total += count;

      if (cursor.getDay() === 0 && currentWeek.length > 0) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }

      // Track month label positions
      if (cursor.getMonth() !== lastMonth) {
        monthPos.push({ label: MONTH_LABELS[cursor.getMonth()], col: weeksArr.length });
        lastMonth = cursor.getMonth();
      }

      currentWeek.push({ date: new Date(cursor), count, key });
      cursor.setDate(cursor.getDate() + 1);
    }
    if (currentWeek.length > 0) weeksArr.push(currentWeek);

    return { weeks: weeksArr, monthPositions: monthPos, totalYear: total };
  }, [dateCountMap]);

  const getCellStyle = (count: number): string => {
    if (count === 0) return "bg-space-blue-dark";
    // Solid colors for clear visual distinction on dark backgrounds
    if (count === 1) return "bg-[#5e4a1e]";   // dim gold-brown
    if (count === 2) return "bg-[#9a7b2f]";   // medium gold
    return "bg-[#f5c842]";                      // bright gold
  };

  const cellSize = 13;
  const gap = 3;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-star-dim">
          {totalYear} observation{totalYear !== 1 ? "s" : ""} in the last year
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col mr-1" style={{ gap }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-star-dim flex items-center justify-end pr-1"
                style={{ height: cellSize, width: 28 }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div>
            {/* Month labels */}
            <div className="flex" style={{ height: 14, marginBottom: 2 }}>
              {monthPositions.map((mp, i) => {
                const nextCol = i + 1 < monthPositions.length ? monthPositions[i + 1].col : weeks.length;
                const span = nextCol - mp.col;
                return (
                  <div
                    key={`${mp.label}-${mp.col}`}
                    className="text-[10px] text-star-dim"
                    style={{ width: span * (cellSize + gap), minWidth: 0 }}
                  >
                    {span >= 3 ? mp.label : ""}
                  </div>
                );
              })}
            </div>

            {/* Cells */}
            <div className="flex" style={{ gap }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap }}>
                  {Array.from({ length: 7 }).map((_, di) => {
                    const day = week.find((d) => d.date.getDay() === di);
                    if (!day) {
                      return <div key={di} style={{ width: cellSize, height: cellSize }} />;
                    }
                    const isToday = day.key === formatDateKey(new Date());
                    return (
                      <div
                        key={di}
                        className={`rounded-sm ${getCellStyle(day.count)} ${isToday ? "ring-1 ring-nebula-pink" : ""}`}
                        style={{ width: cellSize, height: cellSize }}
                        title={`${day.key}: ${day.count} observation${day.count !== 1 ? "s" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-star-dim">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-space-blue-dark" />
          <div className="w-3 h-3 rounded-sm bg-[#5e4a1e]" />
          <div className="w-3 h-3 rounded-sm bg-[#9a7b2f]" />
          <div className="w-3 h-3 rounded-sm bg-[#f5c842]" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ObservationCalendar;
