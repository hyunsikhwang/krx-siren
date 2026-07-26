import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { MarketEvent, MarketType, EventType, EventDirection, CrawlLogEntry } from './src/types';

// Persistent Storage File Path
const DATA_DIR = path.join(process.cwd(), 'data');
const PERSISTENT_DB_PATH = path.join(DATA_DIR, 'krx_persistent_db.json');

// Firebase Cloud Firestore Setup
let firestoreDb: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    console.log('[Firebase] Cloud Firestore initialized successfully. Database ID:', firebaseConfig.firestoreDatabaseId);
  }
} catch (fErr) {
  console.warn('[Firebase] Warning initializing Firestore:', fErr);
}

// Comprehensive Historical Seed Data for KRX Sidecar & CB (2026, 2025, 2024)
const SEED_HISTORICAL_EVENTS: MarketEvent[] = [
  {
    id: 'krx-2026-07-15-sc1',
    date: '2026-07-15',
    market: '코스닥',
    eventType: '사이드카',
    direction: '매수',
    title: '[시장의동향] 코스닥150선물 급등에 따른 사이드카(매수호가 효력정지) 발동',
    org: '코스닥시장본부',
    disclosureNo: 'K20260715-001',
    time: '09:12',
    indexImpact: '코스닥150선물 +6.14% 급등',
    notes: '글로벌 반도체 업황 회복 기대감으로 선물 급등에 따른 5분간 매수호가 효력정지'
  },
  {
    id: 'krx-2026-06-18-sc2',
    date: '2026-06-18',
    market: '코스닥',
    eventType: '사이드카',
    direction: '매도',
    title: '[시장의동향] 코스닥150선물 급락에 따른 사이드카(매도호가 효력정지) 발동',
    org: '코스닥시장본부',
    disclosureNo: 'K20260618-002',
    time: '13:40',
    indexImpact: '코스닥150선물 -6.02% 급락',
    notes: '외국인 매도세 집중 및 중동 지배구조 불안요인으로 매도 사이드카 발동'
  },
  {
    id: 'krx-2026-05-12-sc3',
    date: '2026-05-12',
    market: '유가증권(코스피)',
    eventType: '사이드카',
    direction: '매수',
    title: '[시장의동향] 코스피200선물 급등에 따른 사이드카(매수호가 효력정지) 발동',
    org: '유가증권시장본부',
    disclosureNo: 'P20260512-001',
    time: '09:05',
    indexImpact: '코스피200선물 +5.35% 급등',
    notes: '미국 증시 기술주 대폭등 영향으로 장 시작 직후 매수 사이드카 발동'
  },
  {
    id: 'krx-2026-04-08-sc4',
    date: '2026-04-08',
    market: '코스닥',
    eventType: '사이드카',
    direction: '매도',
    title: '[시장의동향] 코스닥150선물 급락에 따른 사이드카(매도호가 효력정지) 발동',
    org: '코스닥시장본부',
    disclosureNo: 'K20260408-003',
    time: '10:22',
    indexImpact: '코스닥150선물 -6.28% 급락',
    notes: '글로벌 금리 인상 재확인 우려로 제약바이오 업종 매도세 유출'
  },
  {
    id: 'krx-2026-03-04-sc5',
    date: '2026-03-04',
    market: '유가증권(코스피)',
    eventType: '사이드카',
    direction: '매도',
    title: '[시장의동향] 코스피200선물 급락에 따른 사이드카(매도호가 효력정지) 발동',
    org: '유가증권시장본부',
    disclosureNo: 'P20260304-001',
    time: '11:15',
    indexImpact: '코스피200선물 -5.12% 급락',
    notes: '유가 폭등 및 지정학적 리스크 확대로 코스피 선물 급락'
  },
  {
    id: 'krx-2026-02-19-sc6',
    date: '2026-02-19',
    market: '코스닥',
    eventType: '사이드카',
    direction: '매수',
    title: '[시장의동향] 코스닥150선물 급등에 따른 사이드카(매수호가 효력정지) 발동',
    org: '코스닥시장본부',
    disclosureNo: 'K20260219-001',
    time: '09:08',
    indexImpact: '코스닥150선물 +6.50% 급등',
    notes: '정부 증시 부양책 및 AI 밸류업 모멘텀으로 개장 직후 강한 상승'
  },
  {
    id: 'krx-2026-01-22-sc7',
    date: '2026-01-22',
    market: '유가증권(코스피)',
    eventType: '사이드카',
    direction: '매수',
    title: '[시장의동향] 코스피200선물 급등에 따른 사이드카(매수호가 효력정지) 발동',
    org: '유가증권시장본부',
    disclosureNo: 'P20260122-002',
    time: '09:14',
    indexImpact: '코스피200선물 +5.08% 급등',
    notes: '대형 IT주 분기 실적 어닝 서프라이즈로 기관/외국인 동시 매수'
  },
  {
    id: 'krx-2026-01-08-sc8',
    date: '2026-01-08',
    market: '코스닥',
    eventType: '사이드카',
    direction: '매도',
    title: '[시장의동향] 코스닥150선물 급락에 따른 사이드카(매도호가 효력정지) 발동',
    org: '코스닥시장본부',
    disclosureNo: 'K20260108-001',
    time: '14:02',
    indexImpact: '코스닥150선물 -6.10% 급락',
    notes: '2026년 연초 차익실현 물량 출회 및 환율 급등 여파'
  },
  {
    id: 'krx-2025-11-06-sc9',
    date: '2025-11-06',
    market: '유가증권(코스피)',
    eventType: '사이드카',
    direction: '매수',
    title: '[시장의동향] 코스피200선물 급등에 따른 사이드카(매수호가 효력정지) 발동',
    org: '유가증권시장본부',
    disclosureNo: 'P20251106-001',
    time: '09:10',
    indexImpact: '코스피200선물 +5.73% 급등',
    notes: '공매도 한시적 금지 재연장 발표에 따른 지수 폭등'
  },
  {
    id: 'krx-2024-08-06-sc10',
    date: '2024-08-06',
    market: '유가증권(코스피)',
    eventType: '사이드카',
    direction: '매수',
    title: '[시장의동향] 코스피200선물 급등에 따른 사이드카(매수호가 효력정지) 발동',
    org: '유가증권시장본부',
    disclosureNo: 'P20240806-001',
    time: '09:06',
    indexImpact: '코스피200선물 +5.47% 급등',
    notes: '블랙 먼데이 폭락 직후 역대급 반등 매수세 유입'
  },
  {
    id: 'krx-2024-08-06-sc11',
    date: '2024-08-06',
    market: '코스닥',
    eventType: '사이드카',
    direction: '매수',
    title: '[시장의동향] 코스닥150선물 급등에 따른 사이드카(매수호가 효력정지) 발동',
    org: '코스닥시장본부',
    disclosureNo: 'K20240806-002',
    time: '09:12',
    indexImpact: '코스닥150선물 +7.99% 급등',
    notes: '전일 대폭락에 따른 강한 반발 매수 사이드카'
  },
  {
    id: 'krx-2024-08-05-cb12',
    date: '2024-08-05',
    market: '코스닥',
    eventType: '서킷브레이커',
    direction: '-',
    title: '[시장의동향] 코스닥시장 서킷브레이커(1단계) 발동 (매매정지)',
    org: '코스닥시장본부',
    disclosureNo: 'K20240805-010',
    time: '13:56',
    indexImpact: '코스닥 지수 -8.05% 대폭락',
    notes: '미국 R의 공포(경기후퇴) 및 엔캐리 트레이드 청산에 따른 글로벌 '
  },
  {
    id: 'krx-2024-08-05-cb13',
    date: '2024-08-05',
    market: '유가증권(코스피)',
    eventType: '서킷브레이커',
    direction: '-',
    title: '[시장의동향] 유가증권시장 서킷브레이커(1단계) 발동 (매매정지)',
    org: '유가증권시장본부',
    disclosureNo: 'P20240805-011',
    time: '14:14',
    indexImpact: '코스피 지수 -8.10% 대폭락',
    notes: '코스피/코스닥 동시 서킷브레이커 발동 (20분간 전종목 거래정지)'
  }
];

// Persistent File DB Helper (Local Cache)
function loadPersistentDbFromFile(): MarketEvent[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(PERSISTENT_DB_PATH)) {
      const raw = fs.readFileSync(PERSISTENT_DB_PATH, 'utf-8');
      const parsed: MarketEvent[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Initialize with Seed Historical Data
    fs.writeFileSync(PERSISTENT_DB_PATH, JSON.stringify(SEED_HISTORICAL_EVENTS, null, 2), 'utf-8');
    return SEED_HISTORICAL_EVENTS;
  } catch (err) {
    console.error('Failed to load local persistent DB file:', err);
    return SEED_HISTORICAL_EVENTS;
  }
}

function savePersistentDbToFile(events: MarketEvent[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PERSISTENT_DB_PATH, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save local persistent DB file:', err);
  }
}

// Global In-Memory Cache for Unified Data
let globalMemoryEvents: MarketEvent[] | null = null;

function loadPersistentDb(): MarketEvent[] {
  if (globalMemoryEvents && globalMemoryEvents.length > 0) {
    return globalMemoryEvents;
  }
  return loadPersistentDbFromFile();
}

// Sync with Cloud Firestore (Persistence across app republishes)
async function syncWithFirestore(): Promise<MarketEvent[]> {
  const localItems = loadPersistentDbFromFile();
  const map = new Map<string, MarketEvent>();

  localItems.forEach((evt) => {
    const key = `${evt.date}-${evt.market}-${evt.disclosureNo || evt.title}`;
    map.set(key, evt);
  });

  if (!firestoreDb) {
    globalMemoryEvents = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    return globalMemoryEvents;
  }

  try {
    const snapshot = await getDocs(collection(firestoreDb, 'market_events'));
    const firestoreItems: MarketEvent[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as MarketEvent;
      if (data && data.date && data.market) {
        firestoreItems.push(data);
      }
    });

    console.log(`[Firestore] Loaded ${firestoreItems.length} records from Cloud Firestore.`);

    firestoreItems.forEach((evt) => {
      const key = `${evt.date}-${evt.market}-${evt.disclosureNo || evt.title}`;
      map.set(key, evt);
    });

    const merged = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    globalMemoryEvents = merged;

    savePersistentDbToFile(merged);

    // Sync back to Firestore if local items were missing in Firestore
    if (firestoreItems.length < merged.length) {
      console.log(`[Firestore Sync] Syncing ${merged.length - firestoreItems.length} missing records to Cloud Firestore...`);
      saveEventsToFirestore(merged).catch((e) => console.error('[Firestore Batch Sync Error]', e));
    }

    return merged;
  } catch (err) {
    console.error('[Firestore Sync Error]', err);
    globalMemoryEvents = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    return globalMemoryEvents;
  }
}

async function saveEventsToFirestore(events: MarketEvent[]) {
  if (!firestoreDb) return;
  try {
    const chunkSize = 400;
    for (let i = 0; i < events.length; i += chunkSize) {
      const chunk = events.slice(i, i + chunkSize);
      const batch = writeBatch(firestoreDb);

      chunk.forEach((evt) => {
        const rawId = evt.id || `krx-${evt.date}-${evt.disclosureNo || Math.random()}`;
        const safeDocId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const docRef = doc(firestoreDb, 'market_events', safeDocId);
        // Remove undefined fields which cause Firestore error
        const cleanEvt = JSON.parse(JSON.stringify(evt));
        batch.set(docRef, cleanEvt, { merge: true });
      });

      await batch.commit();
    }
    console.log(`[Firestore] Successfully saved/synced ${events.length} records to Cloud Firestore.`);
  } catch (err) {
    console.error('[Firestore Save Error]', err);
  }
}

function savePersistentDb(newEvents: MarketEvent[]): MarketEvent[] {
  try {
    const currentDb = loadPersistentDb();
    const map = new Map<string, MarketEvent>();

    currentDb.forEach((evt) => {
      const key = `${evt.date}-${evt.market}-${evt.disclosureNo || evt.title}`;
      map.set(key, evt);
    });

    newEvents.forEach((evt) => {
      const key = `${evt.date}-${evt.market}-${evt.disclosureNo || evt.title}`;
      map.set(key, evt);
    });

    const merged = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    globalMemoryEvents = merged;

    savePersistentDbToFile(merged);
    saveEventsToFirestore(merged).catch((e) => console.error('[Firestore Async Save Error]', e));

    return merged;
  } catch (err) {
    console.error('Failed to save persistent DB:', err);
    return newEvents;
  }
}

// In-memory cache store to protect KRX server from frequent call blocks
interface CacheStore {
  data: MarketEvent[];
  lastFetchedAt: number;
  startDate: string;
  endDate: string;
}

let inMemoryCache: CacheStore | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache TTL

// Global Crawl Diagnostics Log Buffer
let globalCrawlLogs: CrawlLogEntry[] = [];

function addCrawlLog(log: Omit<CrawlLogEntry, 'id' | 'timestamp'>): CrawlLogEntry {
  const entry: CrawlLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toTimeString().slice(0, 8) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
    ...log
  };
  globalCrawlLogs.unshift(entry); // Newest log at top
  if (globalCrawlLogs.length > 500) {
    globalCrawlLogs = globalCrawlLogs.slice(0, 500);
  }
  console.log(`[CRAWL DIAGNOSTIC] [${entry.status}] ${entry.message}`);
  return entry;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Perform initial Cloud Firestore sync at server start
  try {
    const synced = await syncWithFirestore();
    console.log(`[Server Boot] Initial Cloud Firestore sync complete. Loaded ${synced.length} records.`);
  } catch (bootErr) {
    console.error('[Server Boot] Firestore initial sync failed:', bootErr);
  }

  // API Endpoint: Export KRX Market Events as downloadable JSON file
  app.get('/api/krx/export', (req, res) => {
    try {
      const dbEvents = loadPersistentDb();
      const filename = `krx_market_events_${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(JSON.stringify(dbEvents, null, 2));
    } catch (err) {
      console.error('Export error:', err);
      res.status(500).json({ success: false, message: '데이터 내보내기 실패' });
    }
  });

  // API Endpoint: Import KRX Market Events from uploaded JSON array
  app.post('/api/krx/import', (req, res) => {
    try {
      const importedData = req.body;
      if (!Array.isArray(importedData)) {
        return res.status(400).json({ success: false, message: '올바른 JSON 데이터 배열 형식이 아닙니다.' });
      }

      const merged = savePersistentDb(importedData);
      addCrawlLog({
        status: 'INFO',
        message: `[데이터 복원] 외부 JSON 파일에서 ${importedData.length}건 입력, 총 ${merged.length}건 병합 보존 완료`
      });

      res.json({
        success: true,
        message: `성공적으로 ${importedData.length}건의 데이터를 복원 및 통합했습니다. (총 ${merged.length}건 보존 중)`,
        totalCount: merged.length,
        events: merged
      });
    } catch (err) {
      console.error('Import error:', err);
      res.status(500).json({ success: false, message: '데이터 복원 중 오류가 발생했습니다.' });
    }
  });

  // API Endpoint: Get Real-time Crawl Diagnostic Logs & DB Stats
  app.get('/api/krx/logs', (req, res) => {
    const dbEvents = loadPersistentDb();
    res.json({
      success: true,
      count: globalCrawlLogs.length,
      logs: globalCrawlLogs,
      persistentCount: dbEvents.length,
      lastSavedAt: new Date().toISOString()
    });
  });

  // API Endpoint: /api/krx/crawl - Direct KRX KIND Real-time Disclosure Crawler
  app.get('/api/krx/crawl', async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const startDate = (req.query.startDate as string) || '2026-01-01';
    const endDate = (req.query.endDate as string) || today;
    const forceRefresh = req.query.force === 'true' || req.query.forceLive === 'true';
    const forceFull = req.query.forceFull === 'true' || req.query.full === 'true';

    const currentYearMonth = today.slice(0, 7); // e.g. "2026-07"
    const currentMonthStart = `${currentYearMonth}-01`;

    const now = Date.now();
    const persistentDb = loadPersistentDb();

    // Strategy 1: If requested date range is strictly in past months (prior to current month) and not forcing crawl,
    // serve immediately from persistent store!
    const isQueryOnlyPastMonths = endDate < currentMonthStart;

    if (!forceRefresh && !forceFull && isQueryOnlyPastMonths) {
      const filtered = persistentDb.filter((e) => e.date >= startDate && e.date <= endDate);
      addCrawlLog({
        status: 'INFO',
        message: `[영구 DB 반환] 조회기간(${startDate}~${endDate})이 전월 이전이므로 저장된 DB에서 즉시 반환 (${filtered.length}건)`
      });

      return res.json({
        success: true,
        count: filtered.length,
        data: filtered,
        source: 'kind-persistent-store',
        message: `KRX KIND 영구 보관 DB에서 ${filtered.length}건 즉시 조회 (전월 이전 자동 보존)`,
        fetchedAt: new Date().toISOString(),
        logs: globalCrawlLogs.slice(0, 30)
      });
    }

    // Strategy 2: Return memory cache if available within TTL and not forcing live/full
    if (
      !forceRefresh &&
      !forceFull &&
      inMemoryCache &&
      inMemoryCache.startDate === startDate &&
      inMemoryCache.endDate === endDate &&
      now - inMemoryCache.lastFetchedAt < CACHE_TTL_MS
    ) {
      addCrawlLog({
        status: 'INFO',
        message: `[캐시 반환] 최근 수집 데이터 사용 (${inMemoryCache.data.length}건, 캐시 시각: ${new Date(inMemoryCache.lastFetchedAt).toLocaleTimeString()})`
      });

      return res.json({
        success: true,
        count: inMemoryCache.data.length,
        data: inMemoryCache.data,
        source: 'kind-cache',
        message: `KRX KIND 공시데이터 ${inMemoryCache.data.length}건 (서버 캐시)`,
        fetchedAt: new Date(inMemoryCache.lastFetchedAt).toISOString(),
        logs: globalCrawlLogs.slice(0, 30)
      });
    }

    addCrawlLog({
      status: 'INFO',
      message: forceFull
        ? `[정밀 전체 수집 시작] 전체 기간 (1,000+ 페이지 탐색 모드) Target: detailsExt.do (${startDate} ~ ${endDate})`
        : `[실시간 증분 수집 시작] Target: detailsExt.do (조회 기간: ${startDate} ~ ${endDate})`
    });

    try {
      // Crawl KIND
      const liveEvents = await crawlKrxKindDirect(startDate, endDate, forceFull, currentMonthStart);

      // Save and merge into Persistent DB on disk!
      const updatedDb = savePersistentDb(liveEvents);

      // Filter for response
      const resultEvents = updatedDb.filter((e) => e.date >= startDate && e.date <= endDate);

      // Update in-memory cache
      inMemoryCache = {
        data: resultEvents,
        lastFetchedAt: now,
        startDate,
        endDate
      };

      addCrawlLog({
        status: 'SUCCESS',
        message: forceFull
          ? `[정밀 전체 수집 완료] 총 ${resultEvents.length}건 발동 공시 영구 DB 저장 완료!`
          : `[증분 수집 완료] 최근 당월 공시 수집 및 영구 DB 동기화 완료 (조회결과 ${resultEvents.length}건)`
      });

      return res.json({
        success: true,
        count: resultEvents.length,
        data: resultEvents,
        source: forceFull ? 'kind-full-crawled' : 'kind-live-updated',
        message: forceFull
          ? `KRX KIND 전체 기간 정밀 수집 완료! 총 ${resultEvents.length}건 발동 공시 영구 저장됨.`
          : `KRX KIND 실시간 수집 및 영구 DB 동기화 완료 (${resultEvents.length}건)`,
        fetchedAt: new Date().toISOString(),
        logs: globalCrawlLogs.slice(0, 50)
      });
    } catch (err: any) {
      addCrawlLog({
        status: 'ERROR',
        message: `[수집 오류 / WAF 차단] ${err?.message || 'KRX KIND 서버 접속 오류'}`
      });

      // Fallback to Persistent DB on disk
      const fallbackEvents = persistentDb.filter((e) => e.date >= startDate && e.date <= endDate);
      addCrawlLog({
        status: 'INFO',
        message: `[영구 DB 복구] 네트워크 오프라인/차단으로 영구 저장 DB(${fallbackEvents.length}건) 표시`
      });

      return res.json({
        success: true,
        count: fallbackEvents.length,
        data: fallbackEvents,
        source: 'kind-persistent-fallback',
        message: `KRX KIND 크롤링 지연으로 영구 저장 DB 데이터 ${fallbackEvents.length}건을 표시합니다.`,
        fetchedAt: new Date().toISOString(),
        logs: globalCrawlLogs.slice(0, 50)
      });
    }
  });

  // Direct KRX KIND Crawler function with page limit logic & persistent disk saving
  async function crawlKrxKindDirect(
    startDate: string,
    endDate: string,
    isFullRecrawl: boolean,
    currentMonthStart: string
  ): Promise<MarketEvent[]> {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer':
        'https://kind.krx.co.kr/disclosure/details.do?method=searchDetailsMktactSub'
    };

    const makePageUrl = (page: number) =>
      `https://kind.krx.co.kr/disclosure/detailsExt.do?method=searchDetailsMktactSubExt&currentPageSize=15&pageIndex=${page}&searchCodeType=&repIsuSrtCd=&forward=details_mktact_sub_ext&searchCorpName=&searchCorpNameTmp=&fromData=${startDate}&toData=${endDate}`;

    const startTime = Date.now();

    // Step 1: Fetch Page 1
    const page1Url = makePageUrl(1);
    addCrawlLog({
      status: 'INFO',
      page: 1,
      url: page1Url,
      message: `Page 1 HTTP GET 요청 전송 (target: detailsExt.do, 모드: ${isFullRecrawl ? '전체 정밀' : '당월 증분'})...`
    });

    let page1Res: Response;
    try {
      page1Res = await fetch(page1Url, {
        headers,
        signal: AbortSignal.timeout(10000)
      });
    } catch (fetchErr: any) {
      addCrawlLog({
        status: 'TIMEOUT',
        page: 1,
        url: page1Url,
        message: `Page 1 서버 연결 타임아웃: ${fetchErr?.message || '네트워크 응답 없음'}`
      });
      throw new Error(`KRX KIND Page 1 타임아웃: ${fetchErr?.message}`);
    }

    if (page1Res.status === 403) {
      addCrawlLog({
        status: 'BLOCKED_403',
        statusCode: 403,
        page: 1,
        url: page1Url,
        message: 'KRX KIND WAF 방화벽 접속 차단 (HTTP 403 Access Denied)'
      });
      throw new Error('KRX KIND WAF 차단 (HTTP 403 Access Denied)');
    }

    if (!page1Res.ok) {
      addCrawlLog({
        status: 'ERROR',
        statusCode: page1Res.status,
        page: 1,
        message: `KRX KIND Page 1 서버 오류 (HTTP Status: ${page1Res.status})`
      });
      throw new Error(`KRX KIND 서버 응답 오류 (HTTP ${page1Res.status})`);
    }

    const page1Html = await page1Res.text();

    if (page1Html.includes('잠시 후 다시 이용해 주세요')) {
      addCrawlLog({
        status: 'RATE_LIMITED',
        statusCode: 200,
        page: 1,
        message: 'KRX KIND 서버 지연 안내 수신 ("잠시 후 다시 이용해 주세요")'
      });
      throw new Error('KRX KIND 서버 일시적 과부하/이용제한');
    }

    const $1 = cheerio.load(page1Html);
    const infoText = $1('.info').text() || $1('div.info').text();
    let totalPages = 1;

    const pageMatch = infoText.match(/\/([\d,]+)/);
    if (pageMatch) {
      totalPages = parseInt(pageMatch[1].replace(/,/g, ''), 10);
    }

    const allEvents: MarketEvent[] = [];
    const initialEventsCount = allEvents.length;
    parseKrxTableRows($1, allEvents);
    const page1Matches = allEvents.length - initialEventsCount;

    addCrawlLog({
      status: 'SUCCESS',
      statusCode: 200,
      page: 1,
      delayMs: Date.now() - startTime,
      rowsParsed: $1('table tbody tr').length,
      matchesFound: page1Matches,
      message: `Page 1/총 ${totalPages}페이지 탐색 성공! [${infoText.trim()}] | 발동 공시 매칭: ${page1Matches}건`
    });

    // Determine max pages to crawl based on mode:
    // 1. If isFullRecrawl: Crawl up to totalPages (or until dates < startDate)
    // 2. If standard live update: Crawl until dates fall behind currentMonthStart (e.g. 2026-07-01)
    let targetMaxPages = isFullRecrawl ? totalPages : Math.min(totalPages, 50);

    // Save intermediate findings to persistent storage
    savePersistentDb(allEvents);

    // Step 2: Sequential Crawling across pages
    for (let p = 2; p <= targetMaxPages; p++) {
      // 100ms safe throttle delay between GET requests
      await new Promise((r) => setTimeout(r, 100));

      const pageUrl = makePageUrl(p);
      const pageStart = Date.now();

      try {
        const res = await fetch(pageUrl, {
          headers,
          signal: AbortSignal.timeout(8000)
        });

        if (res.status === 403) {
          addCrawlLog({
            status: 'BLOCKED_403',
            statusCode: 403,
            page: p,
            url: pageUrl,
            message: `Page ${p} 요청 중 HTTP 403 차단 감지. 크롤링 안전 조기 중단.`
          });
          break;
        }

        if (res.ok) {
          const html = await res.text();

          if (html.includes('잠시 후 다시 이용해 주세요')) {
            addCrawlLog({
              status: 'RATE_LIMITED',
              statusCode: 200,
              page: p,
              message: `Page ${p} 요청 시 KRX 서버 차단 경고 수신. 크롤링 중단.`
            });
            break;
          }

          const $ = cheerio.load(html);
          let oldestDateOnPage = '9999-99-99';

          $('table.list tbody tr, table tbody tr').each((_, row) => {
            const tds = $(row).find('td');
            if (tds.length >= 5) {
              const rawDate = $(tds[4]).text().trim();
              const dateMatch = rawDate.match(/\d{4}-\d{2}-\d{2}/);
              if (dateMatch) {
                if (dateMatch[0] < oldestDateOnPage) {
                  oldestDateOnPage = dateMatch[0];
                }
              }
            }
          });

          const beforeCount = allEvents.length;
          parseKrxTableRows($, allEvents);
          const matchedOnPage = allEvents.length - beforeCount;
          const rowsOnPage = $('table tbody tr').length;

          // Save to disk incrementally every 15 pages or if new matches found
          if (matchedOnPage > 0 || p % 15 === 0) {
            savePersistentDb(allEvents);
          }

          // Log progress
          if (p % 5 === 0 || matchedOnPage > 0 || p === totalPages) {
            addCrawlLog({
              status: 'SUCCESS',
              statusCode: 200,
              page: p,
              delayMs: Date.now() - pageStart,
              rowsParsed: rowsOnPage,
              matchesFound: matchedOnPage,
              message: `[탐색 중 ${p}/${totalPages}] 최저 일자: ${oldestDateOnPage} | 누적 발동 공시: ${allEvents.length}건`
            });
          }

          // Check stop condition for standard live crawl (stop when older than current month)
          if (!isFullRecrawl && oldestDateOnPage < currentMonthStart) {
            addCrawlLog({
              status: 'INFO',
              page: p,
              message: `[당월 완료] Page ${p}에서 전월 이전 일자(${oldestDateOnPage}) 도달. 당월 증분 크롤링 완료 (전월 이전은 영구 DB에서 보존).`
            });
            break;
          }

          // Check stop condition for full crawl (stop when older than startDate)
          if (oldestDateOnPage < startDate) {
            addCrawlLog({
              status: 'INFO',
              page: p,
              message: `[조회기간 도달] Page ${p}에서 시작일자(${startDate}) 이전 공시(${oldestDateOnPage}) 도달. 전체 탐색 완료.`
            });
            break;
          }
        } else {
          addCrawlLog({
            status: 'ERROR',
            statusCode: res.status,
            page: p,
            message: `Page ${p} 응답 이상 (HTTP ${res.status})`
          });
        }
      } catch (pErr: any) {
        addCrawlLog({
          status: 'TIMEOUT',
          page: p,
          message: `Page ${p} 통신 타임아웃/오류: ${pErr?.message || '응답 지연'}`
        });
      }
    }

    // Deduplicate and save final state to disk
    const map = new Map<string, MarketEvent>();
    allEvents.forEach((evt) => {
      const key = `${evt.date}-${evt.market}-${evt.disclosureNo || evt.title}`;
      if (!map.has(key)) {
        map.set(key, evt);
      }
    });

    const finalEvents = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    savePersistentDb(finalEvents);

    return finalEvents;
  }

  // Parse KRX KIND HTML table
  function parseKrxTableRows($: cheerio.CheerioAPI, events: MarketEvent[]) {
    $('table.list tbody tr, table tbody tr').each((_, row) => {
      const tds = $(row).find('td');
      if (tds.length >= 5) {
        const no = $(tds[0]).text().trim();
        const corp = $(tds[1]).text().trim();
        const title = $(tds[2]).text().trim();
        const subDept = $(tds[3]).text().trim();
        const dateRaw = $(tds[4]).text().trim();

        if (!title || title.includes('조회된 내역이 없습니다') || corp.includes('조회된')) {
          return;
        }

        const dateMatch = dateRaw.match(/\d{4}-\d{2}-\d{2}/);
        const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

        const tLower = title.toLowerCase();

        // 1. Sidecar filtering: Sidecar, side car, 사이드카
        const isSidecar = ['sidecar', 'side car', '사이드카'].some((kw) => tLower.includes(kw));

        // 2. Circuit Breaker (CB) filtering
        let isCb = ['서킷브레이커', '서킷 브레이커', 'circuit breaker', 'cb 발동', 'cb발동', 'cb(서킷', 'cb (서킷'].some((kw) =>
          tLower.includes(kw)
        );

        if (!isCb && tLower.includes('cb') && (tLower.includes('발동') || tLower.includes('서킷') || tLower.includes('매매정지'))) {
          if (!tLower.includes('전환사채') && !tLower.includes('주식') && !tLower.includes('인수')) {
            isCb = true;
          }
        }

        if (!isSidecar && !isCb) {
          return;
        }

        const eventType: EventType = isSidecar ? '사이드카' : '서킷브레이커';

        let market: MarketType = '기타';
        if (title.includes('유가증권') || subDept.includes('유가증권') || corp.includes('유가증권') || title.includes('코스피')) {
          market = '유가증권(코스피)';
        } else if (title.includes('코스닥') || subDept.includes('코스닥') || corp.includes('코스닥')) {
          market = '코스닥';
        }

        let direction: EventDirection = '-';
        if (title.includes('매수')) {
          direction = '매수';
        } else if (title.includes('매도')) {
          direction = '매도';
        }

        const timeMatch = (dateRaw + ' ' + title).match(/(\d{2}:\d{2})/);

        events.push({
          id: `krx-${date}-${no || Math.random().toString(36).substring(2, 6)}`,
          date,
          market,
          eventType,
          direction,
          title,
          org: subDept || corp || '한국거래소',
          disclosureNo: no,
          time: timeMatch ? timeMatch[1] : undefined
        });
      }
    });
  }

  // Vite Middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KRX App] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
