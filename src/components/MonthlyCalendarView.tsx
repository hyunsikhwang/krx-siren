import React, { useState, useMemo } from 'react';
import { MarketEvent } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ExternalLink,
  Layers,
  Filter,
  Info
} from 'lucide-react';

interface MonthlyCalendarViewProps {
  events: MarketEvent[];
  onSelectEvent: (event: MarketEvent) => void;
  startDate?: string;
  endDate?: string;
  isFetching?: boolean;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  events,
  onSelectEvent,
  isFetching
}) => {
  if (isFetching) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-6 bg-slate-200 rounded w-60"></div>
          <div className="h-8 bg-slate-100 rounded-xl w-40"></div>
        </div>
        <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100/80 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }
  // Determine default initial year/month based on latest event or current date
  const defaultYearMonth = useMemo(() => {
    if (events.length > 0) {
      // sort desc by date
      const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date));
      return sorted[0].date.slice(0, 7); // "YYYY-MM"
    }
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }, [events]);

  const [activeYearMonth, setActiveYearMonth] = useState<string>(defaultYearMonth);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; list: MarketEvent[] } | null>(null);

  // Parse active year & month
  const [activeYear, activeMonth] = useMemo(() => {
    const parts = activeYearMonth.split('-');
    return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
  }, [activeYearMonth]);

  // Navigate Months
  const handlePrevMonth = () => {
    let y = activeYear;
    let m = activeMonth - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setActiveYearMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let y = activeYear;
    let m = activeMonth + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setActiveYearMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleTodayMonth = () => {
    const now = new Date();
    setActiveYearMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  // Group events by date map
  const eventsByDate = useMemo(() => {
    const map = new Map<string, MarketEvent[]>();
    events.forEach((evt) => {
      const list = map.get(evt.date) || [];
      list.push(evt);
      map.set(evt.date, list);
    });
    return map;
  }, [events]);

  // Events filtered for the selected active month
  const currentMonthEvents = useMemo(() => {
    const prefix = `${activeYear}-${String(activeMonth).padStart(2, '0')}`;
    return events.filter((e) => e.date.startsWith(prefix));
  }, [events, activeYear, activeMonth]);

  // Monthly Statistics
  const monthStats = useMemo(() => {
    let buyCount = 0;
    let sellCount = 0;
    let cbCount = 0;
    let kospiCount = 0;
    let kosdaqCount = 0;

    currentMonthEvents.forEach((evt) => {
      if (evt.direction === '매수') buyCount++;
      else if (evt.direction === '매도') sellCount++;

      if (evt.eventType === '서킷브레이커') cbCount++;

      if (evt.market === '유가증권(코스피)') kospiCount++;
      else if (evt.market === '코스닥') kosdaqCount++;
    });

    return {
      total: currentMonthEvents.length,
      buyCount,
      sellCount,
      cbCount,
      kospiCount,
      kosdaqCount
    };
  }, [currentMonthEvents]);

  // Calendar Grid Calculation
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(activeYear, activeMonth - 1, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sun, 6 = Sat
    const daysInMonth = new Date(activeYear, activeMonth, 0).getDate();

    const daysInPrevMonth = new Date(activeYear, activeMonth - 1, 0).getDate();

    const cells = [];

    // 1. Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      let prevM = activeMonth - 1;
      let prevY = activeYear;
      if (prevM < 1) {
        prevM = 12;
        prevY -= 1;
      }
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        dayOfWeek: (startDayOfWeek - 1 - i) % 7,
        events: eventsByDate.get(dateStr) || []
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${activeYear}-${String(activeMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = (startDayOfWeek + d - 1) % 7;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        dayOfWeek,
        events: eventsByDate.get(dateStr) || []
      });
    }

    // 3. Next month padding days to fill 35 or 42 cells
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let nextD = 1; nextD <= remaining; nextD++) {
        let nextM = activeMonth + 1;
        let nextY = activeYear;
        if (nextM > 12) {
          nextM = 1;
          nextY += 1;
        }
        const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;
        cells.push({
          dateStr,
          dayNum: nextD,
          isCurrentMonth: false,
          dayOfWeek: (cells.length) % 7,
          events: eventsByDate.get(dateStr) || []
        });
      }
    }

    return cells;
  }, [activeYear, activeMonth, eventsByDate]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Available year/months in events for quick dropdown
  const availableYearMonths = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.date.slice(0, 7)));
    const currentStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    set.add(currentStr);
    return Array.from(set).sort().reverse();
  }, [events]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Calendar Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        {/* Title & Month Selector */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {activeYear}년 {activeMonth}월 시장조치 캘린더
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {monthStats.total}건 발동
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              날짜별 사이드카 및 서킷브레이커 발동 이력을 월별 달력 형태로 조회합니다.
            </p>
          </div>
        </div>

        {/* Month Navigation & Quick Dropdown Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Year-Month Select Dropdown */}
          <select
            value={activeYearMonth}
            onChange={(e) => setActiveYearMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {availableYearMonths.map((ym) => {
              const [y, m] = ym.split('-');
              return (
                <option key={ym} value={ym}>
                  {y}년 {parseInt(m, 10)}월
                </option>
              );
            })}
          </select>

          {/* Prev / Next Month Buttons */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleTodayMonth}
              className="px-2.5 py-1 hover:bg-white text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              오늘
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/60">
          <span className="text-slate-500 font-medium">월간 총 발동</span>
          <span className="font-extrabold text-slate-900 font-mono text-sm">{monthStats.total}건</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
          <span className="text-emerald-800 font-medium flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>매수 사이드카</span>
          </span>
          <span className="font-extrabold text-emerald-700 font-mono text-sm">{monthStats.buyCount}건</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-rose-50/60 rounded-lg border border-rose-100">
          <span className="text-rose-800 font-medium flex items-center space-x-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            <span>매도 사이드카</span>
          </span>
          <span className="font-extrabold text-rose-700 font-mono text-sm">{monthStats.sellCount}건</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-amber-50/60 rounded-lg border border-amber-100">
          <span className="text-amber-900 font-medium flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>서킷브레이커</span>
          </span>
          <span className="font-extrabold text-amber-800 font-mono text-sm">{monthStats.cbCount}건</span>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-2 bg-indigo-50/60 rounded-lg border border-indigo-100">
          <span className="text-indigo-900 font-medium">코스피 / 코스닥</span>
          <span className="font-extrabold text-indigo-900 font-mono text-sm">
            {monthStats.kospiCount} / {monthStats.kosdaqCount}
          </span>
        </div>
      </div>

      {/* Mobile Legend Guide */}
      <div className="flex sm:hidden items-center justify-between p-2 bg-indigo-50/80 rounded-xl border border-indigo-100 text-[10px] text-indigo-900 font-medium">
        <div className="flex items-center space-x-2">
          <span>📱 <strong>P</strong>:코스피 | <strong>Q</strong>:코스닥</span>
          <span>•</span>
          <span className="text-emerald-700 font-bold">📈매수</span>
          <span className="text-rose-700 font-bold">📉매도</span>
          <span className="text-amber-800 font-bold">⚡CB</span>
        </div>
        <span className="text-indigo-600 font-bold shrink-0">날짜터치➔상세</span>
      </div>

      {/* Calendar Grid Container */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-200 gap-px grid grid-cols-7">
        {/* Day of week headers */}
        {['일', '월', '화', '수', '목', '금', '토'].map((dow, idx) => (
          <div
            key={dow}
            className={`p-1.5 sm:p-2.5 text-center font-bold text-[11px] sm:text-xs uppercase bg-slate-100 ${
              idx === 0 ? 'text-rose-600' : idx === 6 ? 'text-blue-600' : 'text-slate-700'
            }`}
          >
            {dow}
          </div>
        ))}

        {/* Calendar Day Cells */}
        {calendarGrid.map((cell) => {
          const isToday = cell.dateStr === todayStr;
          const hasEvents = cell.events.length > 0;

          // Compute cell background
          let cellBg = cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/70 text-slate-400';
          if (cell.isCurrentMonth && (cell.dayOfWeek === 0 || cell.dayOfWeek === 6)) {
            cellBg = cell.isCurrentMonth ? 'bg-slate-50/40' : 'bg-slate-100/50 text-slate-400';
          }

          return (
            <div
              key={cell.dateStr}
              onClick={() => {
                if (hasEvents) {
                  setSelectedDayEvents({ date: cell.dateStr, list: cell.events });
                }
              }}
              className={`min-h-[62px] sm:min-h-[135px] p-1 sm:p-2 flex flex-col justify-between transition-colors ${cellBg} ${
                hasEvents ? 'ring-1 ring-indigo-300/80 cursor-pointer hover:bg-indigo-50/30' : ''
              }`}
            >
              {/* Cell Top Header: Date Number & Event Count */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-[11px] sm:text-xs font-extrabold rounded-full ${
                    isToday
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : !cell.isCurrentMonth
                      ? 'text-slate-400'
                      : cell.dayOfWeek === 0
                      ? 'text-rose-600'
                      : cell.dayOfWeek === 6
                      ? 'text-blue-600'
                      : 'text-slate-800'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {hasEvents && (
                  <span className="px-1 sm:px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black rounded-full bg-slate-900 text-white shadow-2xs">
                    {cell.events.length}
                  </span>
                )}
              </div>

              {/* Mobile View: Color & Symbol Chips (hidden on sm) */}
              <div className="block sm:hidden my-0.5 space-y-0.5">
                {cell.events.slice(0, 3).map((evt) => {
                  const isBuy = evt.direction === '매수';
                  const isSell = evt.direction === '매도';
                  const isCb = evt.eventType === '서킷브레이커';
                  const mShort = evt.market === '유가증권(코스피)' ? 'P' : 'Q';

                  return (
                    <div
                      key={evt.id}
                      className={`px-1 py-0.5 text-[9px] font-extrabold rounded flex items-center justify-between border ${
                        isBuy
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : isSell
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-amber-100 text-amber-950 border-amber-400'
                      }`}
                    >
                      <span className="flex items-center space-x-0.5">
                        <span className="text-[8px] px-0.5 bg-white/80 rounded font-mono">
                          {mShort}
                        </span>
                        <span>{isBuy ? '📈' : isSell ? '📉' : '⚡'}</span>
                      </span>
                      {evt.time && <span className="text-[8px] font-mono opacity-80">{evt.time.slice(0, 5)}</span>}
                    </div>
                  );
                })}
                {cell.events.length > 3 && (
                  <div className="text-[8px] text-center font-bold text-indigo-700 bg-indigo-50 rounded">
                    +{cell.events.length - 3}
                  </div>
                )}
              </div>

              {/* Desktop View: Full Text Single-Line Cards (hidden on mobile) */}
              <div className="hidden sm:block flex-1 space-y-1 overflow-y-auto max-h-[100px] scrollbar-thin mt-1">
                {cell.events.slice(0, 4).map((evt) => {
                  const isBuy = evt.direction === '매수';
                  const isSell = evt.direction === '매도';
                  const isCb = evt.eventType === '서킷브레이커';

                  let badgeStyle = 'bg-slate-100 text-slate-800 border-slate-200';
                  if (isBuy) {
                    badgeStyle = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300';
                  } else if (isSell) {
                    badgeStyle = 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300';
                  } else if (isCb) {
                    badgeStyle = 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400 font-extrabold';
                  }

                  const marketShort = evt.market === '유가증권(코스피)' ? '코스피' : evt.market;
                  const typeShort = isCb ? '서킷브레이커' : `${evt.direction} 사이드카`;

                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`px-1.5 py-1 text-[10px] leading-tight rounded-md border transition-all cursor-pointer shadow-2xs flex items-center justify-between space-x-1 whitespace-nowrap overflow-hidden ${badgeStyle}`}
                      title={`[${marketShort}] ${typeShort} ${evt.time ? `(${evt.time})` : ''}`}
                    >
                      <div className="flex items-center space-x-1 min-w-0 truncate font-medium">
                        {isBuy ? (
                          <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : isSell ? (
                          <TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        )}
                        <span className="font-bold shrink-0 text-[10px]">
                          [{marketShort}]
                        </span>
                        <span className="truncate font-semibold text-[10px]">
                          {typeShort}
                        </span>
                      </div>
                      {evt.time && (
                        <span className="opacity-80 font-mono text-[9px] shrink-0 ml-0.5">
                          {evt.time}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* More events indicator if > 4 */}
                {cell.events.length > 4 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDayEvents({ date: cell.dateStr, list: cell.events });
                    }}
                    className="w-full py-0.5 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 rounded transition-colors text-center cursor-pointer"
                  >
                    +{cell.events.length - 4}건 더보기
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Events List Modal Popover */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-base">
                  {selectedDayEvents.date} 시장조치 상세 ({selectedDayEvents.list.length}건)
                </h4>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {selectedDayEvents.list.map((evt) => {
                const isBuy = evt.direction === '매수';
                const isSell = evt.direction === '매도';
                const isCb = evt.eventType === '서킷브레이커';

                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedDayEvents(null);
                      onSelectEvent(evt);
                    }}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                            evt.market === '유가증권(코스피)'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {evt.market}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-extrabold rounded-md flex items-center space-x-1 ${
                            isBuy
                              ? 'bg-emerald-100 text-emerald-800'
                              : isSell
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {isBuy ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : isSell ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{evt.eventType} ({evt.direction})</span>
                        </span>
                      </div>

                      {evt.time && (
                        <div className="flex items-center space-x-1 text-xs text-slate-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{evt.time}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-800 line-clamp-2">
                      {evt.title}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>소관: {evt.org}</span>
                      <span className="text-indigo-600 font-semibold flex items-center space-x-0.5">
                        <span>상세보기</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
