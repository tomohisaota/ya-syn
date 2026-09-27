// 動画の動きのもとになる記録（trace.json）を、ライブラリを実際に動かして取る。
//   npm run trace   → ルートで build してから、このファイルを動かす
// 三つの場面それぞれで「素朴に書いた実装」と「ya-syn」を同じ呼び出し方で動かし、
// いつ呼ばれ・いつ factory / fetch / task が走り・いつ返ったかを ms で残す。
// reel.html はこの記録を読んで描くだけで、動きを作らない。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CoreSemaphore, LazyInitializer, SynchronizerProvider } from '../dist/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 記録の時刻は 1ms 単位に丸める。
const clock = () => { const t0 = performance.now(); return () => Math.round(performance.now() - t0); };
// セマフォの中で起きたこと（sem）は、起きた順に積む。同じ ms のものも、この順が本当の順。
//   Acquire / Acquired / Release … ya-syn が onEvent で知らせる区切り
//   call / return / work / worked … 呼び出しと重い処理（connect / fetch / task）の始まりと終わり
const semLog = (now) => { const sem = []; return { sem, ev: (type, who, extra) => sem.push({ t: now(), type, who, ...extra }) }; };

// ---- 01 LazyInitializer：5 人がほぼ同時に get() する。connect() は 400ms かかる ----
const CALLERS = [0, 40, 80, 120, 160];
const CONNECT_MS = 400;

async function lazy(kind) {
  const now = clock();
  const runs = [], calls = [];
  let n = 0;
  const connect = async () => {
    const run = { id: n++, start: now() };
    runs.push(run);
    ev('work', null, { id: run.id });
    await sleep(CONNECT_MS);
    run.end = now();
    ev('worked', null, { id: run.id });
    return { id: run.id };
  };
  let get, current;
  const { sem, ev } = semLog(now);
  if (kind === 'naive') {
    // よくある書き方：まだ無ければ作る
    let db;
    get = async () => { if (!db) db = await connect(); return db; };
  } else {
    const db = new LazyInitializer(() => connect());
    // LazyInitializer の中の Semaphore(1) は onEvent の口を持つが、LazyInitializer はそこへ何も渡さない。
    // 記録のためだけに、その口へ ev をつなぐ（動きは変えない）。
    const inner = db.semaphore, orig = inner.synchronized.bind(inner);
    inner.synchronized = (cb, params) => {
      const who = current;
      return orig(cb, { ...params, onEvent: (type) => { if (type !== 'Finish') ev(type, who); params?.onEvent?.(type); } });
    };
    get = () => db.get();
  }
  await Promise.all(CALLERS.map(async (at, i) => {
    await sleep(at);
    const c = { caller: i, call: now() };
    calls.push(c);
    ev('call', i);
    current = i;
    const v = await get();
    c.done = now();
    c.value = v.id;
    ev('return', i, { value: v.id });
  }));
  calls.sort((a, b) => a.caller - b.caller);
  return kind === 'naive' ? { runs, calls } : { runs, calls, sem };
}

// LazyInitializer の factory が自分を待つ（循環依存）と、例外で知らせる。
async function lazyCycle() {
  const a = new LazyInitializer(async () => { await b.get(); return 'a'; });
  const b = new LazyInitializer(async () => { await a.get(); return 'b'; });
  try { await a.get(); return { error: null }; } catch (e) { return { error: e.constructor.name, code: e.code }; }
}

// ---- 02 CachedProvider：TTL 1000ms、fetch は 250ms。起動直後と、期限切れ直後に呼び出しが集まる ----
const TTL = 1000;
const FETCH_MS = 250;
const REQUESTS = [0, 30, 60, 450, 800, 1250, 1270, 1290, 1310, 1330, 1700, 2050];
const CACHE_SPAN = 2400;

async function cache(kind) {
  const now = clock();
  const fetches = [], reqs = [];
  let n = 0;
  const { sem, ev } = semLog(now);
  const fetchRates = async () => {
    const f = { id: n++, start: now() };
    fetches.push(f);
    ev('work', null, { id: f.id });
    await sleep(FETCH_MS);
    f.end = now();
    ev('worked', null, { id: f.id });
    return { id: f.id };
  };
  let get, current;
  if (kind === 'naive') {
    // よくある書き方：期限内なら返し、切れていたら取りに行く
    let c;
    get = async () => {
      if (c && Date.now() - c.at <= TTL) return c.value;
      const at = Date.now();
      const value = await fetchRates();
      c = { value, at };
      return value;
    };
  } else {
    // SynchronizerProvider の onEvent は、ライブラリ自身が数えた stats もいっしょに渡してくる。そのまま残す。
    const owner = new Map();
    const sp = new SynchronizerProvider({
      onEvent: ({ type, context, stats }) => {
        if (!owner.has(context.executionId)) owner.set(context.executionId, current);
        if (type !== 'Finish') ev(type, owner.get(context.executionId), { stats: { tasks: stats.numberOfTasks, running: stats.numberOfRunningTasks } });
      },
    });
    const rates = sp.createCachedProvider({ factory: () => fetchRates(), defaultTTL: TTL });
    get = () => rates.get();
  }
  await Promise.all(REQUESTS.map(async (at, i) => {
    await sleep(at);
    const r = { req: i, call: now() };
    reqs.push(r);
    ev('call', i);
    current = i;
    const before = n;
    const v = await get();
    r.done = now();
    r.value = v.id;
    r.fetched = n > before && fetches.some((f) => f.id === v.id && f.start >= r.call);
    ev('return', i, { value: v.id });
  }));
  reqs.sort((a, b) => a.req - b.req);
  return kind === 'naive' ? { fetches, reqs } : { fetches, reqs, sem };
}

// ---- 03 TaskExecutor：10 件の仕事（長さはばらばら）。7 件目は失敗する。どちらも並列 3 ----
const DURS = [180, 120, 260, 140, 200, 160, 220, 110, 240, 150];
const FAIL = 6;
const PARALLEL = 3;
// ya-syn は実行を 3 本に絞り、generator からは 1 本先に読んでおく（保持 4）
const IN_FLIGHT = 4, IN_EXECUTION = PARALLEL;

async function tasks(kind) {
  const now = clock();
  const rows = DURS.map((ms, i) => ({ task: i, ms }));
  const { sem, ev } = semLog(now);
  const run = async (i) => {
    rows[i].start = now();
    ev('work', i);
    await sleep(DURS[i]);
    rows[i].end = now();
    if (i === FAIL) { rows[i].failed = true; ev('worked', i, { failed: true }); throw new Error(`task ${i} failed`); }
    ev('worked', i);
  };
  const result = {};
  if (kind === 'naive') {
    // よくある書き方：並列 3 に絞るため、3 本ずつ区切って Promise.all で待つ。
    // 失敗の扱いは ya-syn（onTaskError）と揃える：1 本ずつ受けて報告し、ループは止めない。
    const errors = [];
    result.batches = [];
    for (let i = 0; i < rows.length; i += PARALLEL) {
      const chunk = rows.slice(i, i + PARALLEL);
      const b = { from: i, start: now() };
      for (const r of chunk) r.pulled = b.start;
      await Promise.all(chunk.map((r) => run(r.task).catch((e) => errors.push({ at: now(), message: e.message }))));
      b.end = now();
      result.batches.push(b);
    }
    result.resolved = now();
    result.errors = errors;
  } else {
    const sp = new SynchronizerProvider();
    const errors = [];
    // TaskExecutor の中の CoreSemaphore（inFlight と inExecution）には onEvent が無い。
    // 記録のあいだだけ synchronized を包んで、Acquire / Acquired / Release を残す（動きは変えない）。
    // inFlight は generator から取り出した直後に、inExecution は inFlight の中から、同期的に呼ばれる。
    const proto = CoreSemaphore.prototype, orig = proto.synchronized;
    let pulled = null, inside = null;
    proto.synchronized = function (cb) {
      const name = this.concurrentExecution === IN_FLIGHT ? 'inFlight' : this.concurrentExecution === IN_EXECUTION ? 'inExecution' : null;
      if (!name) return orig.call(this, cb);
      const who = name === 'inFlight' ? pulled : inside;
      ev('Acquire', who, { sem: name });
      return orig.call(this, () => {
        ev('Acquired', who, { sem: name });
        const prev = inside;
        inside = who;
        try { return cb().finally(() => ev('Release', who, { sem: name })); } finally { inside = prev; }
      });
    };
    try {
      await sp.executeTasks({
        maxTasksInFlight: IN_FLIGHT,
        maxTasksInExecution: IN_EXECUTION,
        taskSource: (async function* () {
          for (const r of rows) { r.pulled = now(); ev('call', r.task); pulled = r.task; yield { task: r.task }; }
        })(),
        taskExecutor: ({ task }) => run(task),
        onTaskError: (e) => errors.push({ at: now(), message: e.message }),
      });
    } finally { proto.synchronized = orig; }
    result.resolved = now();
    result.errors = errors;
    result.sem = sem;
  }
  return { rows, ...result };
}

// 数え上げ：ある時刻に「走っている」本数の最大
const peak = (spans) => {
  const ev = spans.flatMap((s) => [[s.start, 1], [s.end, -1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let c = 0, m = 0;
  for (const [, d] of ev) { c += d; m = Math.max(m, c); }
  return m;
};

const out = {
  recordedAt: new Date().toISOString(),
  version: JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')).version,
  node: process.version,
  lazy: { callers: CALLERS, connectMs: CONNECT_MS, naive: await lazy('naive'), yasyn: await lazy('yasyn'), cycle: await lazyCycle() },
  cache: { ttl: TTL, fetchMs: FETCH_MS, span: CACHE_SPAN, requests: REQUESTS, naive: await cache('naive'), yasyn: await cache('yasyn') },
  tasks: { durs: DURS, fail: FAIL, parallel: PARALLEL, inFlight: IN_FLIGHT, inExecution: IN_EXECUTION, naive: await tasks('naive'), yasyn: await tasks('yasyn') },
};
// ya-syn の保持数（generator から取り出して、まだ終わっていない本数）
for (const k of ['naive', 'yasyn']) {
  const t = out.tasks[k];
  t.peakExecution = peak(t.rows);
  t.peakInFlight = peak(t.rows.map((r) => ({ start: r.pulled, end: r.end })));
}
// 検算：記録した区切りから数えた numberOfTasks / numberOfRunningTasks が、ライブラリの stats と同じか
{
  let tasks = 0, running = 0;
  for (const e of out.cache.yasyn.sem) {
    if (e.type === 'Acquire') tasks++;
    if (e.type === 'Acquired') running++;
    if (e.type === 'Release') { tasks--; running--; }
    if (e.stats && (e.stats.tasks !== tasks || e.stats.running !== running)) throw new Error(`stats mismatch at ${JSON.stringify(e)}`);
  }
}
writeFileSync(join(here, 'trace.json'), JSON.stringify(out, null, 1));
const s = (x) => JSON.stringify(x);
console.log('lazy  naive runs', out.lazy.naive.runs.length, 'values', s(out.lazy.naive.calls.map((c) => c.value)));
console.log('lazy  yasyn runs', out.lazy.yasyn.runs.length, 'values', s(out.lazy.yasyn.calls.map((c) => c.value)));
const kinds = (sem) => sem.reduce((m, e) => ((m[e.type] = (m[e.type] ?? 0) + 1), m), {});
console.log('sem   lazy', s(kinds(out.lazy.yasyn.sem)), ' cache', s(kinds(out.cache.yasyn.sem)), ' tasks', s(kinds(out.tasks.yasyn.sem)));
console.log('lazy  cycle', s(out.lazy.cycle));
console.log('cache naive fetches', out.cache.naive.fetches.length, ' yasyn fetches', out.cache.yasyn.fetches.length);
for (const k of ['naive', 'yasyn']) {
  const t = out.tasks[k];
  console.log(`tasks ${k} peakExec ${t.peakExecution} peakInFlight ${t.peakInFlight} resolved ${t.resolved} rejected ${t.rejected} errors ${s(t.errors?.map((e) => e.message))}`);
}
