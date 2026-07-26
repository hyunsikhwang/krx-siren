import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MarketEvent, DateRange, EventSummaryStats, CrawlResponse, CrawlLogEntry } from './types';
import { Header } from './components/Header';
import { DateFilterPanel } from './components/DateFilterPanel';
import { KpiStatsCards } from './components/KpiStatsCards';
import { MarketDirectionMatrix } from './components/MarketDirectionMatrix';
import { MonthlyCalendarView } from './components/MonthlyCalendarView';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { EventsTable } from './components/EventsTable';
import { EventDetailModal } from './components/EventDetailModal';
import { EducationalGuide } from './components/EducationalGuide';
import { CrawlLogsModal } from './components/CrawlLogsModal';
import { ExternalLink, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

export default function App() {
  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Date range state (Default: 올해 초 ~ 현재)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: `${currentYear}-01-01`,
    endDate: todayStr
  });

  // 2. Data state
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'seed' | string>('live');
  const [wafBlocked, setWafBlocked] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastFetchedAt, setLastFetchedAt] = useState<string>('');

  // Crawl logs state
  const [crawlLogs, setCrawlLogs] = useState<CrawlLogEntry[]>([]);
  const [persistentCount, setPersistentCount] = useState<number>(0);

  // 3. Filter & View states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'calendar' | 'matrix'>('all');

  // Compute available YYYY-MM months from event dataset
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [events]);

  // 4. Modal states
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);

  // Fetch Crawl Diagnostic Logs independently
  const fetchCrawlLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/krx/logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setCrawlLogs(data.logs);
        }
        if (typeof data.persistentCount === 'number') {
          setPersistentCount(data.persistentCount);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch crawl logs:', e);
    }
  }, []);

  // Data loading function from API
  const fetchKrxData = useCallback(async (range: DateRange, forceLive: boolean = false, forceFull: boolean = false) => {
    setIsFetching(true);
    setStatusMessage(
      forceFull
        ? 'KRX KIND 전체 기간 (1,000+ 페이지 탐색) 정밀 전체 크롤링 중입니다... (수십 초 소요될 수 있습니다)'
        : 'KRX KIND 실시간 공시 데이터를 수집 중입니다...'
    );

    try {
      const queryParams = new URLSearchParams({
        startDate: range.startDate,
        endDate: range.endDate,
        forceLive: forceLive ? 'true' : 'false',
        forceFull: forceFull ? 'true' : 'false'
      });

      const response = await fetch(`/api/krx/crawl?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const resData: CrawlResponse = await response.json();

      if (Array.isArray(resData.logs)) {
        setCrawlLogs(resData.logs);
      }

      if (resData.success && Array.isArray(resData.data)) {
        setEvents(resData.data);
        setDataSource(resData.source);
        setWafBlocked(!!resData.wafBlocked);
        setStatusMessage(resData.message || 'KRX 실시간 공시 조회 완료');
        setLastFetchedAt(resData.fetchedAt);
        fetchCrawlLogs();
      } else {
        throw new Error(resData.error || '응답 포맷 오류');
      }
    } catch (err: any) {
      console.error('[App] Live Crawl API Error:', err);
      setEvents([]);
      setDataSource('live');
      setWafBlocked(true);
      setStatusMessage(`KRX 실시간 통신 오류: ${err.message || '네트워크 접속 연동 실패'}`);
      setLastFetchedAt(new Date().toISOString());
    } finally {
      setIsFetching(false);
    }
  }, [fetchCrawlLogs]);

  // Initial load on mount or dateRange change
  useEffect(() => {
    fetchKrxData(dateRange, false);
    fetchCrawlLogs();
  }, [dateRange, fetchKrxData, fetchCrawlLogs]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMarket('ALL');
    setSelectedType('ALL');
    setSelectedDirection('ALL');
    setSelectedMonth('ALL');
    setDateRange({
      startDate: `${currentYear}-01-01`,
      endDate: todayStr
    });
  };

  // Matrix Cell Selection Handler
  const handleMatrixFilterSelect = (market: string, direction: string) => {
    setSelectedMarket(market);
    setSelectedDirection(direction);
  };

  // Filtered Events Calculation
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Selected Month filter takes priority if set, otherwise apply dateRange
      if (selectedMonth !== 'ALL') {
        if (!evt.date || !evt.date.startsWith(selectedMonth)) {
          return false;
        }
      } else {
        // Date range guard
        if (evt.date < dateRange.startDate || evt.date > dateRange.endDate) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = evt.title.toLowerCase().includes(q);
        const orgMatch = evt.org.toLowerCase().includes(q);
        const noMatch = (evt.disclosureNo || '').includes(q);
        if (!titleMatch && !orgMatch && !noMatch) return false;
      }

      // Market
      if (selectedMarket !== 'ALL' && evt.market !== selectedMarket) {
        return false;
      }

      // Type
      if (selectedType !== 'ALL' && evt.eventType !== selectedType) {
        return false;
      }

      // Direction
      if (selectedDirection !== 'ALL' && evt.direction !== selectedDirection) {
        return false;
      }

      return true;
    });
  }, [events, dateRange, selectedMonth, searchQuery, selectedMarket, selectedType, selectedDirection]);

  // Compute Summary KPI Stats
  const summaryStats = useMemo<EventSummaryStats>(() => {
    let sidecarTotal = 0;
    let circuitBreakerTotal = 0;
    let kospiTotal = 0;
    let kosdaqTotal = 0;
    let buySidecarCount = 0;
    let sellSidecarCount = 0;

    filteredEvents.forEach((evt) => {
      if (evt.eventType === '사이드카') {
        sidecarTotal++;
      } else if (evt.eventType === '서킷브레이커') {
        circuitBreakerTotal++;
      }

      if (evt.market === '유가증권(코스피)') {
        kospiTotal++;
      } else if (evt.market === '코스닥') {
        kosdaqTotal++;
      }

      if (evt.direction === '매수') {
        buySidecarCount++;
      } else if (evt.direction === '매도') {
        sellSidecarCount++;
      }
    });

    const latestEvent = filteredEvents.length > 0 ? filteredEvents[0] : undefined;

    return {
      totalEvents: filteredEvents.length,
      sidecarTotal,
      circuitBreakerTotal,
      kospiTotal,
      kosdaqTotal,
      buySidecarCount,
      sellSidecarCount,
      latestEvent
    };
  }, [filteredEvents]);

  // Export & Import handlers for 0-cost persistent backup/restore
  const handleExportData = () => {
    window.location.href = '/api/krx/export';
  };

  const handleImportData = async (file: File) => {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      if (!Array.isArray(jsonData)) {
        alert('올바른 데이터 배열 형태의 JSON 파일이 아닙니다.');
        return;
      }

      setIsFetching(true);
      const res = await fetch('/api/krx/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData)
      });

      const result = await res.json();
      if (result.success) {
        alert(`데이터 복원 완료!\n${result.message}`);
        fetchKrxData(dateRange, true);
      } else {
        alert(`복원 실패: ${result.message}`);
      }
    } catch (err) {
      console.error('Import process error:', err);
      alert('파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Header */}
      <Header
        totalCount={summaryStats.totalEvents}
        lastUpdated={lastFetchedAt}
        isFetching={isFetching}
        onRefresh={() => fetchKrxData(dateRange, true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenLogs={() => setIsLogsOpen(true)}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Prominent Loading & Sync Banner */}
        {isFetching && (
          <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-lg border border-indigo-700 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-800/90 rounded-xl shrink-0">
                <RefreshCw className="w-5 h-5 text-indigo-200 animate-spin" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                  <span>KRX 데이터 수집 및 영구 DB 동기화 진행 중...</span>
                </h4>
                <p className="text-xs text-indigo-200/90 mt-0.5">
                  {statusMessage || '한국거래소(KRX) 공시 데이터 및 Firestore 영구 저장소를 불러오고 있습니다. 잠시만 기다려주세요.'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-center">
              <span className="px-3 py-1 bg-indigo-800 text-indigo-200 text-xs font-mono font-bold rounded-lg border border-indigo-700 animate-pulse">
                LOADING...
              </span>
            </div>
          </div>
        )}

        {/* 1. Date Range & Search Filter Bar */}
        <DateFilterPanel
          dateRange={dateRange}
          onDateChange={setDateRange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMarket={selectedMarket}
          onMarketChange={setSelectedMarket}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedDirection={selectedDirection}
          onDirectionChange={setSelectedDirection}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          availableMonths={availableMonths}
          onResetFilters={handleResetFilters}
          dataSource={dataSource}
          wafBlocked={wafBlocked}
          message={statusMessage}
          onOpenLogs={() => setIsLogsOpen(true)}
        />

        {/* 2. Top Summary KPI Stats Cards (At a Glance) */}
        <KpiStatsCards
          stats={summaryStats}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          isFetching={isFetching}
        />

        {/* View Mode Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>🔍 전체 대시보드 뷰</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>🗓️ 월별 캘린더 뷰</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>📊 시장/방향 집계표 뷰</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium px-2 text-right">
            조회된 공시: <strong className="text-slate-900 font-mono">{filteredEvents.length}건</strong>
          </div>
        </div>

        {/* 3. Monthly Calendar View */}
        {(activeTab === 'all' || activeTab === 'calendar') && (
          <MonthlyCalendarView
            events={filteredEvents}
            onSelectEvent={(evt) => setSelectedEvent(evt)}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            isFetching={isFetching}
          />
        )}

        {/* 4. Market x Direction Breakdown Matrix Table */}
        {(activeTab === 'all' || activeTab === 'matrix') && (
          <MarketDirectionMatrix
            events={filteredEvents}
            selectedMarket={selectedMarket}
            selectedDirection={selectedDirection}
            onSelectFilter={handleMatrixFilterSelect}
            isFetching={isFetching}
          />
        )}

        {/* 5. Analytics Visual Charts (Trend Bar Chart & Ratio Pie Charts) */}
        {(activeTab === 'all' || activeTab === 'matrix') && (
          <AnalyticsCharts events={filteredEvents} isFetching={isFetching} />
        )}

        {/* 6. Detailed Events Table & CSV Exporter */}
        <EventsTable
          events={filteredEvents}
          onSelectEvent={(evt) => setSelectedEvent(evt)}
          isFetching={isFetching}
          selectedMarket={selectedMarket}
          onMarketChange={setSelectedMarket}
          selectedDirection={selectedDirection}
          onDirectionChange={setSelectedDirection}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          availableMonths={availableMonths}
          onResetFilters={handleResetFilters}
        />
      </main>

      {/* Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Educational Guide Modal */}
      <EducationalGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Crawl Diagnostics & Server Logs Modal */}
      <CrawlLogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={crawlLogs}
        persistentCount={persistentCount}
        onRefreshLogs={fetchCrawlLogs}
        onForceRecrawl={() => fetchKrxData(dateRange, true, false)}
        onForceFullRecrawl={() => fetchKrxData(dateRange, true, true)}
        isFetching={isFetching}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">
              KRX 시장조치(사이드카 / 서킷브레이커) 분석 시스템
            </span>
          </div>
          <div className="flex items-center space-x-4 text-slate-500">
            <span>출처: 한국거래소(KRX) KIND (kind.krx.co.kr)</span>
            <span>|</span>
            <a
              href="https://kind.krx.co.kr/disclosure/details.do?method=searchDetailsMktactSub"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-400 transition-colors flex items-center space-x-1"
            >
              <span>KIND 바로가기</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
