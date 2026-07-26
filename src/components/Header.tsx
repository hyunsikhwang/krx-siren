import React, { useRef } from 'react';
import { ShieldAlert, RefreshCw, HelpCircle, Terminal, Download, Upload } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  lastUpdated: string;
  isFetching: boolean;
  onRefresh: () => void;
  onOpenGuide: () => void;
  onOpenLogs: () => void;
  onExportData?: () => void;
  onImportData?: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  lastUpdated,
  isFetching,
  onRefresh,
  onOpenGuide,
  onOpenLogs,
  onExportData,
  onImportData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportData) {
      onImportData(file);
      e.target.value = ''; // reset file input
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Hidden File Input for Data Restore */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-2.5">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 shrink-0">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white">
                KRX 시장조치(사이드카/서킷브레이커)
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                KIND 연동
              </span>
              <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                무료 영구 보관
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
              코스피·코스닥 시장 프로그램매매 효력정지(사이드카) 및 매매거래중단(서킷브레이커) 현황 모니터링
            </p>
          </div>
        </div>

        {/* Action Controls & Info */}
        <div className="flex items-center justify-between md:justify-end space-x-1.5 sm:space-x-2 flex-wrap gap-y-1">
          {/* Total Count Badge */}
          <div className="hidden lg:flex items-center px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>보관 데이터:</span>
            <span className="font-bold text-white text-sm">{totalCount}건</span>
          </div>

          {/* Backup Data Button */}
          {onExportData && (
            <button
              onClick={onExportData}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
              title="수집 데이터 0원 영구 보관 (JSON 백업 다운로드)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">데이터 백업</span>
            </button>
          )}

          {/* Restore Data Button */}
          {onImportData && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors cursor-pointer"
              title="백업한 JSON 파일 업로드로 수집 데이터 복원/통합"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">데이터 복원</span>
            </button>
          )}

          {/* Crawl Diagnostics & Server Logs Button */}
          <button
            onClick={onOpenLogs}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="KRX KIND 크롤링 상세로그 확인"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">상세로그</span>
          </button>

          {/* Educational Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="사이드카/서킷브레이커 발동 조건 및 가이드"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">발동기준</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isFetching}
            className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm transition-all cursor-pointer ${
              isFetching ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="text-[11px] sm:text-xs">{isFetching ? '조회 중' : '실시간 동기화'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
