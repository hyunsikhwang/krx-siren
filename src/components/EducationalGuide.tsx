import React from 'react';
import { X, ShieldAlert, AlertTriangle, Info, CheckCircle, ArrowRight } from 'lucide-react';

interface EducationalGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalGuide: React.FC<EducationalGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2.5">
            <Info className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold">
              한국거래소(KRX) 시장안정화 장치 발동 기준 안내
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* 1. Sidecar Explanation */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">사이드카 (Sidecar)</h4>
                <p className="text-[11px] text-slate-500">선물시장의 급등락이 현물시장에 과도하게 전이되는 것을 방지</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              선물가격이 기준가격 대비 크게 변동하여 1분간 지속될 경우, <strong>프로그램매매 호가의 효력을 5분간 정지</strong>합니다. 5분 경과 후에는 자동 해제되어 매매가 정상 재개됩니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 text-xs block">유가증권시장 (코스피)</span>
                <p className="text-slate-700">
                  코스피200 선물 가격이 전일종가 대비 <strong className="text-blue-800">±5% 이상</strong> 변동하여 1분간 지속될 때
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1">
                <span className="font-bold text-purple-900 text-xs block">코스닥시장</span>
                <p className="text-slate-700">
                  코스닥150 선물 가격이 전일종가 대비 <strong className="text-purple-800">±6% 이상</strong> 변동하여 1분간 지속될 때
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              📌 <strong>운영 규칙:</strong> 1일 1회에 한하여 발동하며, 장 마감 40분 전(14시 50분) 이후에는 발동하지 않습니다.
            </div>
          </div>

          {/* 2. Circuit Breaker Explanation */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">서킷브레이커 (Circuit Breaker)</h4>
                <p className="text-[11px] text-slate-500">주가가 대폭락할 때 시장 참가자들에게 냉정성을 찾을 시간을 제공</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              종합주가지수(코스피/코스닥)가 전일 종가 대비 급격히 하락하는 경우, <strong>모든 주식 및 선물옵션 시장의 매매거래를 전면 중단</strong>합니다.
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] shrink-0">1단계</span>
                <div>
                  <strong className="text-slate-900 font-bold block">지수 -8% 이상 하락 (1분간 지속)</strong>
                  <p className="text-slate-600 mt-0.5">20분간 모든 매매거래 중단 + 10분간 단일가매매 재개</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                <span className="px-2 py-0.5 rounded bg-rose-700 text-white font-bold text-[10px] shrink-0">2단계</span>
                <div>
                  <strong className="text-slate-900 font-bold block">지수 -15% 이상 하락 & 1단계 대비 1% 추가 하락 (1분간 지속)</strong>
                  <p className="text-slate-600 mt-0.5">20분간 모든 매매거래 중단 + 10분간 단일가매매 재개</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                <span className="px-2 py-0.5 rounded bg-rose-900 text-white font-bold text-[10px] shrink-0">3단계</span>
                <div>
                  <strong className="text-slate-900 font-bold block">지수 -20% 이상 하락 & 2단계 대비 1% 추가 하락 (1분간 지속)</strong>
                  <p className="text-slate-600 mt-0.5">당일 모든 매매거래 전면 종료 (조기 당일 장 종료)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
