import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MarketEvent } from '../types';
import { BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

interface AnalyticsChartsProps {
  events: MarketEvent[];
  isFetching?: boolean;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ events, isFetching }) => {
  if (isFetching) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 h-80">
          <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="h-60 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 h-80">
          <div className="h-6 bg-slate-200 rounded w-36 mb-4"></div>
          <div className="h-60 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }
  // Monthly distribution aggregation
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; kospiSidecar: number; kosdaqSidecar: number; circuitBreaker: number }>();

    events.forEach((evt) => {
      const month = evt.date.substring(0, 7); // YYYY-MM
      if (!map.has(month)) {
        map.set(month, { month, kospiSidecar: 0, kosdaqSidecar: 0, circuitBreaker: 0 });
      }
      const entry = map.get(month)!;
      if (evt.eventType === '서킷브레이커') {
        entry.circuitBreaker += 1;
      } else if (evt.market === '유가증권(코스피)') {
        entry.kospiSidecar += 1;
      } else if (evt.market === '코스닥') {
        entry.kosdaqSidecar += 1;
      } else {
        entry.kospiSidecar += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [events]);

  // Market Distribution
  const marketPieData = useMemo(() => {
    let kospi = 0;
    let kosdaq = 0;
    let other = 0;

    events.forEach((evt) => {
      if (evt.market === '유가증권(코스피)') kospi++;
      else if (evt.market === '코스닥') kosdaq++;
      else other++;
    });

    return [
      { name: '코스피 (KOSPI)', value: kospi, color: '#3b82f6' },
      { name: '코스닥 (KOSDAQ)', value: kosdaq, color: '#8b5cf6' },
      ...(other > 0 ? [{ name: '기타', value: other, color: '#64748b' }] : [])
    ];
  }, [events]);

  // Direction Distribution
  const directionPieData = useMemo(() => {
    let buy = 0;
    let sell = 0;
    let none = 0;

    events.forEach((evt) => {
      if (evt.direction === '매수') buy++;
      else if (evt.direction === '매도') sell++;
      else none++;
    });

    return [
      { name: '매수 사이드카 (급등)', value: buy, color: '#10b981' },
      { name: '매도 사이드카 (급락)', value: sell, color: '#f43f5e' },
      ...(none > 0 ? [{ name: '서킷브레이커/기타', value: none, color: '#8b5cf6' }] : [])
    ];
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
        <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="font-medium text-slate-600">선택한 기간 동안 발생한 발동 내역이 없습니다.</p>
        <p className="text-xs text-slate-400 mt-1">상단의 조회 기간을 변경하거나 필터를 초기화해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Monthly Bar Chart (Spans 2 Columns on LG) */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">월별 발동 건수 추이</h3>
              <p className="text-xs text-slate-400">월별 코스피·코스닥 사이드카 및 서킷브레이커 집계</p>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="kospiSidecar" name="코스피 사이드카" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="kosdaqSidecar" name="코스닥 사이드카" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="circuitBreaker" name="서킷브레이커" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Doughnut / Pie Charts Column */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-6">
        {/* Market Ratio */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <PieIcon className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">시장별 분포</h3>
          </div>
          <div className="h-36 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {marketPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.375rem',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 text-xs">
            {marketPieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 text-xs">{item.name}: <strong className="text-slate-800">{item.value}건</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Direction Ratio */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center space-x-2 mb-2">
            <PieIcon className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">매수 / 매도 성향</h3>
          </div>
          <div className="h-36 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={directionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {directionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.375rem',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {directionPieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 text-xs">{item.name}: <strong className="text-slate-800">{item.value}건</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
