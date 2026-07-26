import React, { useState, useEffect, useMemo } from 'react';
import { CrawlLogEntry } from '../types';
import {
  X,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Copy,
  Check,
  Filter,
  ExternalLink,
  Layers,
  Zap
} from 'lucide-react';

interface CrawlLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: CrawlLogEntry[];
  persistentCount?: number;
  onRefreshLogs: () => void;
  onForceRecrawl: () => void;
  onForceFullRecrawl?: () => void;
  isFetching: boolean;
}

export const CrawlLogsModal: React.FC<CrawlLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  persistentCount = 0,
  onRefreshLogs,
  onForceRecrawl,
  onForceFullRecrawl,
  isFetching
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Auto refresh logs every 3 seconds when fetching or open
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const interval = setInterval(() => {
      onRefreshLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, onRefreshLogs]);

  // Compute stats
  const stats = useMemo(() => {
    const total = logs.length;
    let successCount = 0;
    let blockedCount = 0;
    let rateLimitCount = 0;
    let totalMatches = 0;

    logs.forEach((log) => {
      if (log.status === 'SUCCESS') successCount++;
      if (log.status === 'BLOCKED_403') blockedCount++;
      if (log.status === 'RATE_LIMITED') rateLimitCount++;
      if (log.matchesFound) totalMatches += log.matchesFound;
    });

    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100;

    return {
      total,
      successCount,
      blockedCount,
      rateLimitCount,
      totalMatches,
      successRate
    };
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterStatus === 'SUCCESS' && log.status !== 'SUCCESS') return false;
      if (filterStatus === 'BLOCKED' && log.status !== 'BLOCKED_403' && log.status !== 'RATE_LIMITED') return false;
      if (filterStatus === 'MATCHED' && (!log.matchesFound || log.matchesFound === 0)) return false;
      if (filterStatus === 'ERROR' && log.status !== 'ERROR' && log.status !== 'TIMEOUT') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const msgMatch = log.message.toLowerCase().includes(q);
        const urlMatch = (log.url || '').toLowerCase().includes(q);
        const pageMatch = log.page ? String(log.page).includes(q) : false;
        if (!msgMatch && !urlMatch && !pageMatch) return false;
      }

      return true;
    });
  }, [logs, filterStatus, searchTerm]);

  // Copy logs text
  const handleCopyLogs = () => {
    const text = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.status}] Page:${l.page || '-'} Status:${l.statusCode || '-'} Msg:${l.message}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  KRX KIND 크롤링 상세 현황 & 차단/지연 실시간 로그
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Target: detailsExt.do
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                한국거래소(KRX) KIND 공시 크롤링 시 발생 가능한 WAF 403 차단 및 스로틀링 대기상태를 실시간 모니터링합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Diagnostic KPI Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">영구 보관 DB</p>
                <p className="text-lg font-bold text-white font-mono mt-0.5">{persistentCount}건 보관</p>
              </div>
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-emerald-400 font-medium">HTTP 200 성공율</p>
                <p className="text-lg font-bold text-emerald-300 font-mono mt-0.5">{stats.successRate}%</p>
              </div>
              <div className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-amber-400 font-medium">WAF 403 / 차단감지</p>
                <p className="text-lg font-bold text-amber-300 font-mono mt-0.5">{stats.blockedCount + stats.rateLimitCount}회</p>
              </div>
              <div className="p-2 bg-amber-900/50 rounded-lg text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-indigo-400 font-medium">발동 공시 추출</p>
                <p className="text-lg font-bold text-indigo-300 font-mono mt-0.5">{stats.totalMatches}건</p>
              </div>
              <div className="p-2 bg-indigo-900/50 rounded-lg text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Intelligent Persistent Caching Banner */}
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-200">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 font-bold text-indigo-300">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>영구 저장 캐시 및 스마트 분할 수집 방침 적용 중</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                조회월의 <strong>전월 이전 공시</strong>는 서버 디스크 DB에 영구 보존되어 불필요한 반복 수집을 방지하며, <strong>당월 공시</strong>만 빠르게 동기화합니다.
                전체 기간(1,000+ 페이지)에 대한 전체 재수집이 필요한 경우 우측 <strong>[정밀 전체 재수집]</strong> 버튼을 이용하세요.
              </p>
            </div>

            {onForceFullRecrawl && (
              <button
                onClick={onForceFullRecrawl}
                disabled={isFetching}
                className={`shrink-0 px-3 py-1.5 font-bold text-xs rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isFetching ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                <span>전체 기간 (1000+P) 정밀 재수집</span>
              </button>
            )}
          </div>

          {/* Action & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterStatus === 'ALL'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                전체 ({logs.length})
              </button>
              <button
                onClick={() => setFilterStatus('SUCCESS')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterStatus === 'SUCCESS'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                성공 (200)
              </button>
              <button
                onClick={() => setFilterStatus('BLOCKED')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterStatus === 'BLOCKED'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                차단/제한 ({stats.blockedCount + stats.rateLimitCount})
              </button>
              <button
                onClick={() => setFilterStatus('MATCHED')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterStatus === 'MATCHED'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                공시 발견
              </button>
            </div>

            {/* Controls Right */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="로그 내 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32 sm:w-40"
              />

              <button
                onClick={handleCopyLogs}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                title="전체 로그 복사"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">{copied ? '복사됨' : '로그 복사'}</span>
              </button>

              <button
                onClick={onForceRecrawl}
                disabled={isFetching}
                className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-all cursor-pointer ${
                  isFetching ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                <span>{isFetching ? '수집 중...' : '즉시 재수집'}</span>
              </button>
            </div>
          </div>

          {/* Terminal / Log Viewer */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 font-mono text-xs overflow-x-auto max-h-[400px] overflow-y-auto space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-sans">
                <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <p>표시할 크롤링 로그가 없습니다.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                if (log.status === 'SUCCESS') {
                  badgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
                } else if (log.status === 'BLOCKED_403') {
                  badgeClass = 'bg-red-950/80 text-red-300 border-red-700/60';
                } else if (log.status === 'RATE_LIMITED') {
                  badgeClass = 'bg-amber-950/80 text-amber-300 border-amber-700/60';
                } else if (log.status === 'TIMEOUT' || log.status === 'ERROR') {
                  badgeClass = 'bg-rose-950/80 text-rose-300 border-rose-700/60';
                } else if (log.status === 'INFO') {
                  badgeClass = 'bg-sky-950/80 text-sky-300 border-sky-700/60';
                }

                return (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                      <span className="text-slate-500 shrink-0 font-mono text-[11px] mt-0.5">
                        {log.timestamp}
                      </span>

                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded shrink-0 ${badgeClass}`}
                      >
                        {log.status === 'BLOCKED_403'
                          ? 'HTTP 403 차단'
                          : log.status === 'RATE_LIMITED'
                          ? '이용제한'
                          : log.status === 'SUCCESS'
                          ? 'HTTP 200'
                          : log.status}
                      </span>

                      {log.page && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded shrink-0">
                          P.{log.page}
                        </span>
                      )}

                      <p className="text-slate-200 text-xs break-all leading-relaxed font-sans">
                        {log.message}
                      </p>
                    </div>

                    {/* Metadata right */}
                    <div className="flex items-center space-x-2 shrink-0 text-[11px] text-slate-400 pl-7 sm:pl-0">
                      {log.delayMs !== undefined && (
                        <span className="text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{log.delayMs}ms</span>
                        </span>
                      )}

                      {log.matchesFound !== undefined && log.matchesFound > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-900/70 text-indigo-300 border border-indigo-700 rounded-full">
                          🔥 매칭 {log.matchesFound}건
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* KIND Direct Access Link Notice */}
          <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                한국거래소(KRX) KIND 공식 공시 URL: <code className="text-indigo-300 font-mono">https://kind.krx.co.kr/disclosure/detailsExt.do</code>
              </span>
            </div>
            <a
              href="https://kind.krx.co.kr/disclosure/details.do?method=searchDetailsMktactSub"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-semibold underline shrink-0"
            >
              <span>KIND 웹사이트 접속</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>KRX KIND 크롤러 엔진 가동 중</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
