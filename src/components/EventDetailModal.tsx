import React from 'react';
import { MarketEvent } from '../types';
import { X, ShieldAlert, AlertTriangle, Calendar, Building, FileText, ExternalLink, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface EventDetailModalProps {
  event: MarketEvent | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  const isSidecar = event.eventType === '사이드카';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className={`p-5 text-white flex items-center justify-between ${
          isSidecar
            ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900'
            : 'bg-gradient-to-r from-rose-900 via-red-900 to-slate-900'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${isSidecar ? 'bg-blue-600/40' : 'bg-rose-600/40'}`}>
              {isSidecar ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded tracking-wide uppercase ${
                isSidecar ? 'bg-blue-500/30 text-blue-200' : 'bg-rose-500/30 text-rose-200'
              }`}>
                {event.eventType} 발동 공시
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {event.market} 시장 조치
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Main Title */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">공시 제목</div>
            <div className="text-sm font-bold text-slate-900 mt-1 leading-snug">
              {event.title}
            </div>
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center text-slate-400 text-[11px]">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>발동 일자</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{event.date}</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>발동 시각</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{event.time || '장중 발동'}</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center text-slate-400 text-[11px]">
                <Building className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>제출 기관</span>
              </div>
              <div className="font-bold text-slate-800 truncate">{event.org}</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center text-slate-400 text-[11px]">
                {event.direction === '매수' ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1 text-rose-600" />
                )}
                <span>방향 구분</span>
              </div>
              <div className={`font-bold text-sm ${
                event.direction === '매수' ? 'text-emerald-700' : event.direction === '매도' ? 'text-rose-700' : 'text-slate-800'
              }`}>
                {event.direction === '매수' ? '▲ 매수 (지수 급등)' : event.direction === '매도' ? '▼ 매도 (지수 급락)' : '-'}
              </div>
            </div>
          </div>

          {/* Details / Index Impact */}
          {event.indexImpact && (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <span className="font-bold text-indigo-900 block mb-0.5">지수 영향 및 사유:</span>
              <p className="text-indigo-950 font-medium">{event.indexImpact}</p>
            </div>
          )}

          {event.notes && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">시장 배경 및 조치 사항:</span>
              <p className="text-slate-600">{event.notes}</p>
            </div>
          )}

          {/* Educational Note */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong className="block font-bold mb-0.5">💡 시장 안정화 장치 안내:</strong>
            {isSidecar ? (
              <span>
                사이드카(Sidecar)는 선물 가격이 급등락할 때 프로그램매매 호가 효력을 5분간 정지시켜 주식 시장의 과도한 충격을 완화합니다. 5분 경과 후 자동 해제됩니다.
              </span>
            ) : (
              <span>
                서킷브레이커(Circuit Breaker)는 주가지수가 8% 이상 급락할 때 발동하며, 전 현물 및 선물 옵션 매매거래를 20분간 일시 전면 중단합니다.
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <a
            href="https://kind.krx.co.kr/disclosure/details.do?method=searchDetailsMktactSub"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>KRX KIND 공시 원문 검색</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
