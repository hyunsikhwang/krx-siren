import React, { useMemo } from 'react';
import { MarketEvent } from '../types';
import { Table, TrendingUp, TrendingDown, AlertTriangle, Layers, Grid, ArrowRight } from 'lucide-react';

interface MarketDirectionMatrixProps {
  events: MarketEvent[];
  onSelectFilter?: (market: string, direction: string) => void;
  selectedMarket?: string;
  selectedDirection?: string;
  isFetching?: boolean;
}

export const MarketDirectionMatrix: React.FC<MarketDirectionMatrixProps> = ({
  events,
  onSelectFilter,
  selectedMarket = 'ALL',
  selectedDirection = 'ALL',
  isFetching
}) => {
  if (isFetching) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="h-5 bg-slate-200 rounded w-64"></div>
          <div className="h-4 bg-slate-100 rounded w-32"></div>
        </div>
        <div className="h-40 bg-slate-100/70 rounded-xl w-full"></div>
      </div>
    );
  }
  // Cross-tabulation logic
  const matrixData = useMemo(() => {
    let kospiBuy = 0;
    let kospiSell = 0;
    let kospiOther = 0;

    let kosdaqBuy = 0;
    let kosdaqSell = 0;
    let kosdaqOther = 0;

    let otherBuy = 0;
    let otherSell = 0;
    let otherOther = 0;

    events.forEach((evt) => {
      const isKospi = evt.market === '유가증권(코스피)';
      const isKosdaq = evt.market === '코스닥';

      if (evt.direction === '매수') {
        if (isKospi) kospiBuy++;
        else if (isKosdaq) kosdaqBuy++;
        else otherBuy++;
      } else if (evt.direction === '매도') {
        if (isKospi) kospiSell++;
        else if (isKosdaq) kosdaqSell++;
        else otherSell++;
      } else {
        if (isKospi) kospiOther++;
        else if (isKosdaq) kosdaqOther++;
        else otherOther++;
      }
    });

    const kospiTotal = kospiBuy + kospiSell + kospiOther;
    const kosdaqTotal = kosdaqBuy + kosdaqSell + kosdaqOther;
    const otherTotal = otherBuy + otherSell + otherOther;

    const totalBuy = kospiBuy + kosdaqBuy + otherBuy;
    const totalSell = kospiSell + kosdaqSell + otherSell;
    const totalOther = kospiOther + kosdaqOther + otherOther;
    const grandTotal = kospiTotal + kosdaqTotal + otherTotal;

    const rows = [
      {
        marketKey: '유가증권(코스피)',
        label: '유가증권 (KOSPI)',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        buy: kospiBuy,
        sell: kospiSell,
        other: kospiOther,
        total: kospiTotal
      },
      {
        marketKey: '코스닥',
        label: '코스닥 (KOSDAQ)',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        buy: kosdaqBuy,
        sell: kosdaqSell,
        other: kosdaqOther,
        total: kosdaqTotal
      }
    ];

    if (otherTotal > 0) {
      rows.push({
        marketKey: '기타',
        label: '기타 시장',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        buy: otherBuy,
        sell: otherSell,
        other: otherOther,
        total: otherTotal
      });
    }

    return {
      rows,
      totals: {
        buy: totalBuy,
        sell: totalSell,
        other: totalOther,
        grandTotal
      }
    };
  }, [events]);

  const { rows, totals } = matrixData;

  const handleCellClick = (marketKey: string, directionKey: string) => {
    if (onSelectFilter) {
      onSelectFilter(marketKey, directionKey);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>시장별 / 매수·매도별 발동 현황 집계표</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                총 {totals.grandTotal}건
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              각 시장(코스피/코스닥)별 매수 사이드카(급등), 매도 사이드카(급락), 서킷브레이커 교차 집계
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium self-end sm:self-auto">
          * 셀을 클릭하면 해당 조합으로 아래 목록이 즉시 필터링됩니다.
        </div>
      </div>

      {/* Mobile-optimized Card Grid (visible on mobile, hidden on sm+) */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {rows.map((row) => {
          const buyPct = row.total > 0 ? Math.round((row.buy / row.total) * 100) : 0;
          const sellPct = row.total > 0 ? Math.round((row.sell / row.total) * 100) : 0;
          const otherPct = row.total > 0 ? Math.round((row.other / row.total) * 100) : 0;

          return (
            <div key={row.marketKey} className="bg-slate-50/80 rounded-xl border border-slate-200 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${row.badgeColor}`}>
                  {row.label}
                </span>
                <span className="text-xs font-extrabold text-slate-800 font-mono">
                  총 {row.total}건
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <button
                  onClick={() => handleCellClick(row.marketKey, '매수')}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="text-[10px] text-emerald-800 font-bold flex items-center space-x-0.5">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>매수</span>
                  </span>
                  <span className="text-sm font-black text-emerald-700 font-mono mt-0.5">{row.buy}건</span>
                  <span className="text-[9px] text-emerald-600/80">{buyPct}%</span>
                </button>

                <button
                  onClick={() => handleCellClick(row.marketKey, '매도')}
                  className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="text-[10px] text-rose-800 font-bold flex items-center space-x-0.5">
                    <TrendingDown className="w-3 h-3 text-rose-600" />
                    <span>매도</span>
                  </span>
                  <span className="text-sm font-black text-rose-700 font-mono mt-0.5">{row.sell}건</span>
                  <span className="text-[9px] text-rose-600/80">{sellPct}%</span>
                </button>

                <button
                  onClick={() => handleCellClick(row.marketKey, '-')}
                  className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="text-[10px] text-amber-900 font-bold flex items-center space-x-0.5">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>CB/기타</span>
                  </span>
                  <span className="text-sm font-black text-amber-800 font-mono mt-0.5">{row.other}건</span>
                  <span className="text-[9px] text-amber-700/80">{otherPct}%</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Table (visible on sm+, hidden on mobile) */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
              <th className="p-3 sm:p-3.5 border-r border-slate-200 min-w-[140px]">
                <div className="flex items-center space-x-1.5 text-slate-700">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>시장 구분</span>
                </div>
              </th>
              <th className="p-3 sm:p-3.5 border-r border-slate-200 text-center bg-emerald-50/50 min-w-[130px]">
                <div className="flex items-center justify-center space-x-1 text-emerald-800">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>📈 매수 사이드카 (급등)</span>
                </div>
              </th>
              <th className="p-3 sm:p-3.5 border-r border-slate-200 text-center bg-rose-50/50 min-w-[130px]">
                <div className="flex items-center justify-center space-x-1 text-rose-800">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <span>📉 매도 사이드카 (급락)</span>
                </div>
              </th>
              <th className="p-3 sm:p-3.5 border-r border-slate-200 text-center bg-amber-50/30 min-w-[140px]">
                <div className="flex items-center justify-center space-x-1 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>⚡ 서킷브레이커 / 기타</span>
                </div>
              </th>
              <th className="p-3 sm:p-3.5 text-center bg-slate-100/70 font-bold text-slate-800 min-w-[110px]">
                시장별 총계
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {rows.map((row) => {
              const isMarketActive = selectedMarket === row.marketKey;

              const isBuySelected = isMarketActive && selectedDirection === '매수';
              const isSellSelected = isMarketActive && selectedDirection === '매도';
              const isOtherSelected = isMarketActive && selectedDirection === '-';

              const buyPct = row.total > 0 ? Math.round((row.buy / row.total) * 100) : 0;
              const sellPct = row.total > 0 ? Math.round((row.sell / row.total) * 100) : 0;
              const otherPct = row.total > 0 ? Math.round((row.other / row.total) * 100) : 0;

              return (
                <tr key={row.marketKey} className="hover:bg-slate-50/60 transition-colors">
                  {/* Market Label */}
                  <td className="p-3 sm:p-3.5 border-r border-slate-200 font-bold">
                    <button
                      onClick={() => handleCellClick(row.marketKey, 'ALL')}
                      className="flex items-center space-x-2 text-left hover:text-indigo-600 transition-colors cursor-pointer group"
                    >
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${row.badgeColor}`}>
                        {row.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  </td>

                  {/* Buy Count Cell */}
                  <td
                    onClick={() => handleCellClick(row.marketKey, '매수')}
                    className={`p-3 sm:p-3.5 border-r border-slate-200 text-center cursor-pointer transition-all ${
                      isBuySelected
                        ? 'bg-emerald-100 border-2 border-emerald-500 font-bold'
                        : 'hover:bg-emerald-50/80'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-base font-extrabold text-emerald-700 font-mono">
                        {row.buy}건
                      </span>
                      {row.total > 0 && (
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${buyPct}%` }}
                          ></div>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 mt-0.5">{buyPct}%</span>
                    </div>
                  </td>

                  {/* Sell Count Cell */}
                  <td
                    onClick={() => handleCellClick(row.marketKey, '매도')}
                    className={`p-3 sm:p-3.5 border-r border-slate-200 text-center cursor-pointer transition-all ${
                      isSellSelected
                        ? 'bg-rose-100 border-2 border-rose-500 font-bold'
                        : 'hover:bg-rose-50/80'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-base font-extrabold text-rose-700 font-mono">
                        {row.sell}건
                      </span>
                      {row.total > 0 && (
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-rose-500 h-full"
                            style={{ width: `${sellPct}%` }}
                          ></div>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 mt-0.5">{sellPct}%</span>
                    </div>
                  </td>

                  {/* Circuit Breaker / Other Count Cell */}
                  <td
                    onClick={() => handleCellClick(row.marketKey, '-')}
                    className={`p-3 sm:p-3.5 border-r border-slate-200 text-center cursor-pointer transition-all ${
                      isOtherSelected
                        ? 'bg-amber-100 border-2 border-amber-500 font-bold'
                        : 'hover:bg-amber-50/80'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-base font-extrabold text-amber-800 font-mono">
                        {row.other}건
                      </span>
                      {row.total > 0 && (
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-amber-500 h-full"
                            style={{ width: `${otherPct}%` }}
                          ></div>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 mt-0.5">{otherPct}%</span>
                    </div>
                  </td>

                  {/* Total Row Count Cell */}
                  <td
                    onClick={() => handleCellClick(row.marketKey, 'ALL')}
                    className="p-3 sm:p-3.5 text-center bg-slate-50 font-bold cursor-pointer hover:bg-indigo-50 transition-colors"
                  >
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {row.total}건
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer Summary Row */}
          <tfoot>
            <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900">
              <td className="p-3 sm:p-3.5 border-r border-slate-200">
                <button
                  onClick={() => handleCellClick('ALL', 'ALL')}
                  className="flex items-center space-x-1.5 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <span className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 text-white font-bold">
                    방향별 전체 총계
                  </span>
                </button>
              </td>

              <td
                onClick={() => handleCellClick('ALL', '매수')}
                className="p-3 sm:p-3.5 border-r border-slate-200 text-center bg-emerald-100/50 hover:bg-emerald-100 cursor-pointer transition-colors"
              >
                <div className="flex flex-col items-center">
                  <span className="text-base font-black text-emerald-800 font-mono">
                    {totals.buy}건
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    (전체 {totals.grandTotal > 0 ? Math.round((totals.buy / totals.grandTotal) * 100) : 0}%)
                  </span>
                </div>
              </td>

              <td
                onClick={() => handleCellClick('ALL', '매도')}
                className="p-3 sm:p-3.5 border-r border-slate-200 text-center bg-rose-100/50 hover:bg-rose-100 cursor-pointer transition-colors"
              >
                <div className="flex flex-col items-center">
                  <span className="text-base font-black text-rose-800 font-mono">
                    {totals.sell}건
                  </span>
                  <span className="text-[10px] text-rose-700 font-medium">
                    (전체 {totals.grandTotal > 0 ? Math.round((totals.sell / totals.grandTotal) * 100) : 0}%)
                  </span>
                </div>
              </td>

              <td
                onClick={() => handleCellClick('ALL', '-')}
                className="p-3 sm:p-3.5 border-r border-slate-200 text-center bg-amber-100/50 hover:bg-amber-100 cursor-pointer transition-colors"
              >
                <div className="flex flex-col items-center">
                  <span className="text-base font-black text-amber-900 font-mono">
                    {totals.other}건
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium">
                    (전체 {totals.grandTotal > 0 ? Math.round((totals.other / totals.grandTotal) * 100) : 0}%)
                  </span>
                </div>
              </td>

              <td
                onClick={() => handleCellClick('ALL', 'ALL')}
                className="p-3 sm:p-3.5 text-center bg-indigo-900 text-white font-black text-lg font-mono cursor-pointer hover:bg-indigo-800 transition-colors"
              >
                {totals.grandTotal}건
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
