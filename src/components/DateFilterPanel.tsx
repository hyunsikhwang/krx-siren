import React from 'react';
import { Calendar, Search, Filter, RotateCcw, AlertTriangle } from 'lucide-react';
import { DateRange, MarketType, EventType, EventDirection } from '../types';

interface DateFilterPanelProps {
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedMarket: string;
  onMarketChange: (m: string) => void;
  selectedType: string;
  onTypeChange: (t: string) => void;
  selectedDirection: string;
  onDirectionChange: (d: string) => void;
  selectedMonth?: string;
  onMonthChange?: (m: string) => void;
  availableMonths?: string[];
  onResetFilters: () => void;
  dataSource: 'live' | 'cache' | 'seed' | string;
  wafBlocked?: boolean;
  message?: string;
  onOpenLogs?: () => void;
}

export const DateFilterPanel: React.FC<DateFilterPanelProps> = ({
  dateRange,
  onDateChange,
  searchQuery,
  onSearchChange,
  selectedMarket,
  onMarketChange,
  selectedType,
  onTypeChange,
  selectedDirection,
  onDirectionChange,
  selectedMonth = 'ALL',
  onMonthChange,
  availableMonths = [],
  onResetFilters,
  dataSource,
  wafBlocked,
  message,
  onOpenLogs
}) => {
  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().split('T')[0];

  const handlePreset = (preset: 'this_year' | '1m' | '3m' | '2025' | '2024' | 'all') => {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    if (preset === 'this_year') {
      onDateChange({ startDate: `${currentYear}-01-01`, endDate: todayISO });
    } else if (preset === '1m') {
      const past = new Date(today);
      past.setMonth(past.getMonth() - 1);
      onDateChange({ startDate: past.toISOString().split('T')[0], endDate: todayISO });
    } else if (preset === '3m') {
      const past = new Date(today);
      past.setMonth(past.getMonth() - 3);
      onDateChange({ startDate: past.toISOString().split('T')[0], endDate: todayISO });
    } else if (preset === '2025') {
      onDateChange({ startDate: '2025-01-01', endDate: '2025-12-31' });
    } else if (preset === '2024') {
      onDateChange({ startDate: '2024-01-01', endDate: '2024-12-31' });
    } else if (preset === 'all') {
      onDateChange({ startDate: '2024-01-01', endDate: todayISO });
    }
  };

  const isThisYearDefault = dateRange.startDate === `${currentYear}-01-01` && dateRange.endDate >= `${currentYear}-07-01`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Row: Date Range Selector & Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Date Inputs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center space-x-2 text-slate-700 font-semibold text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>조회 기간 설정:</span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => onDateChange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50 font-medium"
            />
            <span className="text-slate-400 font-medium">~</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => onDateChange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50 font-medium"
            />
          </div>
        </div>

        {/* Preset Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-1 hidden sm:inline">빠른선택:</span>
          <button
            onClick={() => handlePreset('this_year')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isThisYearDefault
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            올해 초 ~ 현재 (기본)
          </button>
          <button
            onClick={() => handlePreset('3m')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
          >
            최근 3개월
          </button>
          <button
            onClick={() => handlePreset('2025')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
          >
            2025년
          </button>
          <button
            onClick={() => handlePreset('2024')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
          >
            2024년 (폭락장)
          </button>
          <button
            onClick={() => handlePreset('all')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
          >
            전체 기간
          </button>
        </div>
      </div>

      {/* Bottom Row: Detailed Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="공시제목 / 제출기관 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Market */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-500 font-medium hidden md:inline">시장:</span>
            <select
              value={selectedMarket}
              onChange={(e) => onMarketChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">시장 전체</option>
              <option value="유가증권(코스피)">코스피(KOSPI)</option>
              <option value="코스닥">코스닥(KOSDAQ)</option>
            </select>
          </div>

          {/* Event Type */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-500 font-medium hidden md:inline">구분:</span>
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">조치구분 전체</option>
              <option value="사이드카">사이드카</option>
              <option value="서킷브레이커">서킷브레이커</option>
            </select>
          </div>

          {/* Direction */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-500 font-medium hidden md:inline">방향:</span>
            <select
              value={selectedDirection}
              onChange={(e) => onDirectionChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">매수/매도 전체</option>
              <option value="매수">매수 사이드카 (급등)</option>
              <option value="매도">매도 사이드카 (급락)</option>
            </select>
          </div>

          {/* Month Filter */}
          {onMonthChange && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-slate-500 font-medium hidden md:inline">월별:</span>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">전체 월</option>
                {availableMonths.map((ym) => {
                  const [y, m] = ym.split('-');
                  return (
                    <option key={ym} value={ym}>
                      {y}년 {parseInt(m, 10)}월
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={onResetFilters}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="필터 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notice Banner if WAF or Message */}
      {(wafBlocked || message) && (
        <div className={`p-2.5 rounded-lg text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border ${
          wafBlocked 
            ? 'bg-amber-50 border-amber-200 text-amber-800' 
            : 'bg-indigo-50 border-indigo-100 text-indigo-900'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${wafBlocked ? 'text-amber-600' : 'text-indigo-600'}`} />
            <span>{message || 'KIND 데이터베이스 조회가 완료되었습니다.'}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            {onOpenLogs && (
              <button
                onClick={onOpenLogs}
                className="px-2 py-0.5 font-semibold text-[11px] rounded bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 transition-colors cursor-pointer shadow-2xs"
              >
                📋 크롤링 상세로그 확인
              </button>
            )}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded font-semibold bg-white/80 border border-slate-200">
              {dataSource === 'kind-persistent-store'
                ? '💾 KRX 영구 보관 DB'
                : dataSource === 'kind-full-crawled'
                ? '🔍 KRX 전체 1,000+P 정밀 수집'
                : '⚡ KRX KIND 실시간 연동'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
