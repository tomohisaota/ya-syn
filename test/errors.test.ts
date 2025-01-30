import {createSynchronizerProvider, sleep} from "./utils";

const prefix = "errors"
describe(prefix, () => {

    const {checker, sp} = createSynchronizerProvider(__filename)

    test("throttle", async () => {
        const s = sp.createSynchronizer().throttle()
        let i = 0
        await Promise.allSettled([
            s.synchronized({cb: async () => await sleep(1000), executionId: `executionId${i++}`}),
            s.synchronized({cb: async () => await sleep(1000), executionId: `executionId${i++}`}),
            s.synchronized({cb: async () => await sleep(1000), executionId: `executionId${i++}`}),
            s.synchronized({cb: async () => await sleep(1000), executionId: `executionId${i++}`}),
        ])
        await sleep(100)
        expect(s.stats.numberOfTasks).toBe(0)
        expect(s.stats.numberOfRunningTasks).toBe(0)
        await checker.dumpLater()
    })

    test("timeout", async () => {
        const s = sp.createSynchronizer().timeout(100)
        let i = 0
        await Promise.allSettled([
            s.synchronized({cb: async () => await sleep(1000), executionId: `executionId${i++}`}),
            s.synchronized({cb: async () => await sleep(1000), executionId: `executionId${i++}`}),
            s.synchronized({cb: async () => await sleep(1000), executionId: `executionId${i++}`}),
            s.synchronized({cb: async () => await sleep(1000), executionId: `executionId${i++}`}),
        ])
        await sleep(100)
        expect(s.stats.numberOfTasks).toBe(0)
        expect(s.stats.numberOfRunningTasks).toBe(0)
        await checker.dumpLater()
    })
})


/*

> ya-syn@1.0.0 test
> jest --verbose test/samples/cache-provider.test.ts

  console.log
    ┌─────────┬───────────────────────────┬────────────────────────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ synchronizerId            │ executionId                                                │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼───────────────────────────┼────────────────────────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738026371380 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738026371381 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 2       │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738026371380 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 3       │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738026371380 cachedAt:undefined'     │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 4       │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738026371380 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 5       │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738026371381 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 6       │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738026371381 cachedAt:undefined'     │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 7       │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738026371381 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 8       │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738026372188 cachedAt:1738026371381' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 9       │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738026372188 cachedAt:1738026371381' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 10      │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738026372188 cachedAt:1738026371381' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 11      │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738026372188 cachedAt:1738026371381' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 12      │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738026372188 cachedAt:1738026371381' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 13      │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738026372188 cachedAt:1738026371381' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 14      │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738026372188 cachedAt:1738026371381' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 15      │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738026372188 cachedAt:1738026371381' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴───────────────────────────┴────────────────────────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/cache-provider.test.ts:16:17)

 */