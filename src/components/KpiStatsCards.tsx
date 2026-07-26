import React from 'react';
import { ShieldAlert, TrendingDown, TrendingUp, AlertTriangle, Activity, CalendarClock } from 'lucide-react';
import { EventSummaryStats } from '../types';

interface KpiStatsCardsProps {
  stats: EventSummaryStats;
  startDate: string;
  endDate: string;
  isFetching?: boolean;
}

export const KpiStatsCards: React.FC<KpiStatsCardsProps> = ({ stats, startDate, endDate, isFetching }) => {
  if (isFetching) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs animate-pulse flex flex-col justify-between space-y-3 min-h-[140px]">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-slate-200 rounded w-24"></div>
              <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-indigo-100/70 rounded w-20"></div>
              <div className="h-2 bg-slate-100 rounded w-32"></div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-3 bg-slate-200 rounded w-16"></div>
              <div className="h-3 bg-slate-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Events Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            총 발동 횟수
          </span>
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalEvents}
            <span className="text-base font-normal text-slate-500 ml-1">건</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {startDate} ~ {endDate}
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>코스피: <strong className="text-slate-800">{stats.kospiTotal}건</strong></span>
          <span className="text-slate-300">|</span>
          <span>코스닥: <strong className="text-slate-800">{stats.kosdaqTotal}건</strong></span>
        </div>
      </div>

      {/* 2. Sidecar Total Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            사이드카 (Sidecar)
          </span>
          <div className="p-2 bg-blue-50 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-3xl font-extrabold text-blue-900 tracking-tight">
            {stats.sidecarTotal}
            <span className="text-base font-normal text-slate-500 ml-1">건</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            프로그램매매 호가 5분간 효력정지
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="text-rose-600 font-medium">매도: <strong>{stats.sellSidecarCount}건</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-600 font-medium">매수: <strong>{stats.buySidecarCount}건</strong></span>
        </div>
      </div>

      {/* 3. Circuit Breaker Total Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            서킷브레이커 (CB)
          </span>
          <div className="p-2 bg-rose-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-3xl font-extrabold text-rose-900 tracking-tight">
            {stats.circuitBreakerTotal}
            <span className="text-base font-normal text-slate-500 ml-1">건</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            주식 시장 20분간 거래 전면 중단
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
          {stats.circuitBreakerTotal > 0 ? (
            <span className="text-rose-700 font-medium">⚠️ 지수 폭락성 거래중단 발생</span>
          ) : (
            <span className="text-emerald-600 font-medium">✅ 전면 매매중단 없음</span>
          )}
        </div>
      </div>

      {/* 4. Direction Ratio Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            매수 / 매도 방향
          </span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-emerald-700">매수 {stats.buySidecarCount}</span>
            <span className="text-slate-400 font-light">:</span>
            <span className="text-xl font-bold text-rose-700">매도 {stats.sellSidecarCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.buySidecarCount >= stats.sellSidecarCount ? '증시 급등 우세 장세' : '증시 급락 우세 장세'}
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
            <div
              className="bg-emerald-500 h-full"
              style={{
                width: `${
                  stats.totalEvents > 0 ? (stats.buySidecarCount / stats.totalEvents) * 100 : 50
                }%`
              }}
              title={`매수 ${stats.buySidecarCount}건`}
            ></div>
            <div
              className="bg-rose-500 h-full"
              style={{
                width: `${
                  stats.totalEvents > 0 ? (stats.sellSidecarCount / stats.totalEvents) * 100 : 50
                }%`
              }}
              title={`매도 ${stats.sellSidecarCount}건`}
            ></div>
          </div>
        </div>
      </div>

      {/* 5. Latest Event Spotlight */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between col-span-1 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            최근 발동 공시
          </span>
          <CalendarClock className="w-4 h-4 text-indigo-400" />
        </div>
        {stats.latestEvent ? (
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-amber-400">
                {stats.latestEvent.date}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                {stats.latestEvent.market}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-200 mt-1.5 line-clamp-2 leading-tight">
              {stats.latestEvent.title}
            </p>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-400">
            해당 기간 발동 내역 없음
          </div>
        )}
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
          <span>{stats.latestEvent?.org || '한국거래소'}</span>
          <span className="text-indigo-400 font-semibold">{stats.latestEvent?.eventType || '-'}</span>
        </div>
      </div>
    </div>
  );
};
