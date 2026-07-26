export type MarketType = '유가증권(코스피)' | '코스닥' | '기타';
export type EventType = '사이드카' | '서킷브레이커';
export type EventDirection = '매수' | '매도' | '-';

export interface MarketEvent {
  id: string;
  date: string; // YYYY-MM-DD
  market: MarketType;
  eventType: EventType;
  direction: EventDirection;
  title: string;
  org: string; // 발행/제출기관
  disclosureNo: string;
  time?: string; // e.g., "09:06"
  indexImpact?: string; // e.g., "코스닥150선물 +6.12%"
  notes?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface EventSummaryStats {
  totalEvents: number;
  sidecarTotal: number;
  circuitBreakerTotal: number;
  kospiTotal: number;
  kosdaqTotal: number;
  buySidecarCount: number;
  sellSidecarCount: number;
  latestEvent?: MarketEvent;
}

export interface CrawlLogEntry {
  id: string;
  timestamp: string; // e.g. "09:21:04"
  page?: number;
  status: 'SUCCESS' | 'RATE_LIMITED' | 'BLOCKED_403' | 'TIMEOUT' | 'ERROR' | 'INFO';
  statusCode?: number;
  message: string;
  delayMs?: number;
  rowsParsed?: number;
  matchesFound?: number;
  url?: string;
}

export interface CrawlResponse {
  success: boolean;
  count: number;
  data: MarketEvent[];
  totalPages?: number;
  source: 'kind-live' | 'kind-cache' | 'kind-cache-fallback' | 'seed' | string;
  error?: string;
  wafBlocked?: boolean;
  message?: string;
  fetchedAt: string;
  logs?: CrawlLogEntry[];
}
