import React, { useState, useMemo } from 'react';
import { MarketEvent } from '../types';
import { Download, ChevronRight, ChevronDown, ExternalLink, ArrowUpDown, FileText, CheckCircle2, AlertTriangle, ShieldAlert, Filter, RotateCcw } from 'lucide-react';

interface EventsTableProps {
  events: MarketEvent[];
  onSelectEvent: (event: MarketEvent) => void;
  isFetching?: boolean;
  selectedMarket?: string;
  onMarketChange?: (m: string) => void;
  selectedDirection?: string;
  onDirectionChange?: (d: string) => void;
  selectedMonth?: string;
  onMonthChange?: (m: string) => void;
  availableMonths?: string[];
  onResetFilters?: () => void;
}

export const EventsTable: React.FC<EventsTableProps> = ({
  events,
  onSelectEvent,
  isFetching,
  selectedMarket = 'ALL',
  onMarketChange,
  selectedDirection = 'ALL',
  onDirectionChange,
  selectedMonth = 'ALL',
  onMonthChange,
  availableMonths = [],
  onResetFilters
}) => {
  const [sortField, setSortField] = useState<'date' | 'market' | 'eventType'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default newest first
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Sorting
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [events, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / pageSize));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEvents.slice(start, start + pageSize);
  }, [sortedEvents, currentPage, pageSize]);

  const handleSort = (field: 'date' | 'market' | 'eventType') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for new field
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Export to CSV with UTF-8 BOM so MS Excel in Windows opens Korean text cleanly
  const exportToCSV = () => {
    if (events.length === 0) return;

    const headers = ['일자', '시장', '구분', '매수/매도', '공시제목', '발행/제출기관', '공시번호', '비고'];
    const rows = events.map((e) => [
      `"${e.date}"`,
      `"${e.market}"`,
      `"${e.eventType}"`,
      `"${e.direction}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.org.replace(/"/g, '""')}"`,
      `"${e.disclosureNo || ''}"`,
      `"${(e.notes || e.indexImpact || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `krx_sidecar_cb_events_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            상세 공시 및 발동 목록
          </h2>
          <span className="text-xs text-slate-500 font-normal">
            (총 {events.length}건)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            disabled={events.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            title="CSV 파일 다운로드 (Excel 한글 호환)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 내보내기</span>
          </button>
        </div>
      </div>

      {/* Detailed Inline Filter Bar (시장별, 매수/매도별, 기간(월)별) */}
      <div className="px-3.5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Market Filter Pills */}
          {onMarketChange && (
            <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 pl-1.5 pr-0.5">시장:</span>
              <button
                onClick={() => onMarketChange('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  selectedMarket === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => onMarketChange('유가증권(코스피)')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  selectedMarket === '유가증권(코스피)'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                코스피
              </button>
              <button
                onClick={() => onMarketChange('코스닥')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  selectedMarket === '코스닥'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                코스닥
              </button>
            </div>
          )}

          {/* Direction Filter Pills */}
          {onDirectionChange && (
            <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 pl-1.5 pr-0.5">방향:</span>
              <button
                onClick={() => onDirectionChange('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  selectedDirection === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => onDirectionChange('매수')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  selectedDirection === '매수'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                📈 매수
              </button>
              <button
                onClick={() => onDirectionChange('매도')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  selectedDirection === '매도'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                📉 매도
              </button>
            </div>
          )}

          {/* Month Selector */}
          {onMonthChange && availableMonths.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-bold text-slate-500">월별:</span>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="px-2 py-1 text-[11px] font-bold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
              >
                <option value="ALL">전체 월</option>
                {availableMonths.map((ym) => {
                  const [y, m] = ym.split('-');
                  return (
                    <option key={ym} value={ym}>
                      📅 {y}년 {parseInt(m, 10)}월
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Reset Filter Button if active */}
        {onResetFilters && (selectedMarket !== 'ALL' || selectedDirection !== 'ALL' || selectedMonth !== 'ALL') && (
          <button
            onClick={onResetFilters}
            className="px-2 py-1 text-[10px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-md shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3 text-indigo-600" />
            <span>필터 해제</span>
          </button>
        )}
      </div>

      {/* Mobile Card List View (visible on mobile < md) */}
      <div className="block md:hidden space-y-3 p-3">
        {isFetching ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))
        ) : paginatedEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            조건에 맞는 발동 내역이 없습니다.
          </div>
        ) : (
          paginatedEvents.map((evt) => {
            const isBuy = evt.direction === '매수';
            const isSell = evt.direction === '매도';
            const isCb = evt.eventType === '서킷브레이커';

            return (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="p-3.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-2xs space-y-2 cursor-pointer transition-colors active:bg-slate-50"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        evt.market === '유가증권(코스피)'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {evt.market === '유가증권(코스피)' ? '코스피' : evt.market}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center space-x-0.5 ${
                        isBuy
                          ? 'bg-emerald-100 text-emerald-800'
                          : isSell
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      <span>{isCb ? '서킷브레이커' : `${evt.direction} 사이드카`}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {evt.date} {evt.time}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {evt.title}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="truncate">소관: {evt.org}</span>
                  <span className="text-indigo-600 font-bold shrink-0 flex items-center space-x-0.5">
                    <span>상세보기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Data Table (visible on md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 uppercase font-bold border-b border-slate-200 tracking-wider">
              <th className="py-3 px-4 w-10 text-center">#</th>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>일자</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('market')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>시장</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('eventType')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>구분</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">매수/매도</th>
              <th className="py-3 px-4">공시제목</th>
              <th className="py-3 px-4 hidden md:table-cell">발행/제출기관</th>
              <th className="py-3 px-4 text-center">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {isFetching ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4 text-center"><div className="h-3 bg-slate-200 rounded w-4 mx-auto"></div></td>
                  <td className="py-3 px-4"><div className="h-3 bg-slate-200 rounded w-20"></div></td>
                  <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                  <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                  <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-14"></div></td>
                  <td className="py-3 px-4"><div className="h-3 bg-slate-200 rounded w-64"></div></td>
                  <td className="py-3 px-4 hidden md:table-cell"><div className="h-3 bg-slate-100 rounded w-28"></div></td>
                  <td className="py-3 px-4 text-center"><div className="h-4 bg-slate-100 rounded w-12 mx-auto"></div></td>
                </tr>
              ))
            ) : paginatedEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-normal">
                  조건에 맞는 발동 내역이 없습니다.
                </td>
              </tr>
            ) : (
              paginatedEvents.map((evt, idx) => {
                const isExpanded = expandedId === evt.id;
                const rowNum = (currentPage - 1) * pageSize + idx + 1;

                return (
                  <React.Fragment key={evt.id}>
                    <tr
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-indigo-50/60' : ''
                      }`}
                      onClick={() => toggleExpand(evt.id)}
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {rowNum}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {evt.date}
                        {evt.time && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            {evt.time}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            evt.market === '유가증권(코스피)'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : evt.market === '코스닥'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {evt.market}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            evt.eventType === '서킷브레이커'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {evt.eventType}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {evt.direction === '매수' ? (
                          <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ▲ 매수
                          </span>
                        ) : evt.direction === '매도' ? (
                          <span className="inline-flex items-center text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            ▼ 매도
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs sm:max-w-md truncate font-medium text-slate-800">
                        {evt.title}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-slate-500 max-w-xs truncate">
                        {evt.org}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(evt);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          title="상세 모달 보기"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Inline Expanded Row */}
                    {isExpanded && (
                      <tr className="bg-indigo-50/40 border-b border-indigo-100">
                        <td colSpan={8} className="p-4">
                          <div className="bg-white rounded-lg p-3.5 border border-indigo-100 shadow-xs space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                                <span>{evt.title}</span>
                              </h4>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                                <span>공시번호: <strong>{evt.disclosureNo || '-'}</strong></span>
                                <span>|</span>
                                <span>제출: <strong>{evt.org}</strong></span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                              <div>
                                <span className="text-slate-500 font-medium">발동 지수 영향:</span>
                                <p className="text-slate-800 font-semibold mt-0.5">
                                  {evt.indexImpact || '선물지수 변동률 조건 충족으로 인한 자동 발동'}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">특이사항 / 시장배경:</span>
                                <p className="text-slate-700 mt-0.5">
                                  {evt.notes || '프로그램매매 호가 효력정지(5분간) 조치 실행'}
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                              <a
                                href={`https://kind.krx.co.kr/disclosure/details.do?method=searchDetailsMktactSub`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                <span>한국거래소 KIND 직접 확인</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
        <div>
          <span>
            전체 <strong>{sortedEvents.length}</strong>개 중 <strong>{Math.min((currentPage - 1) * pageSize + 1, sortedEvents.length)}</strong> - <strong>{Math.min(currentPage * pageSize, sortedEvents.length)}</strong> 표시
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
          >
            이전
          </button>
          <span className="px-2 font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};
