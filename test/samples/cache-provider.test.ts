import {sleep} from "../utils";
import {SynchronizerEvent, SynchronizerProvider} from "../../src";
import {CachedProvider} from "../../src/CachedProvider";

const prefix = "Cache Provider"
describe(prefix, () => {
    let events: SynchronizerEvent[] = []

    const sp = new SynchronizerProvider({
        providerId: `${prefix}-SynchronizerProvider`,
        onEvent: (event) => events.push(event)
    })

    afterEach(async () => {
        // wait until it received all events
        await sleep(500)
        console.table(events.flatMap(i => ({
            // providerId: i.context.providerId,
            synchronizerId: i.context.synchronizerId,
            executionId: i.context.executionId,
            type: i.type,
            maxConcurrentExecution: i.stats.maxConcurrentExecution,
            numberOfTasks: i.stats.numberOfTasks,
            numberOfRunningTasks: i.stats.numberOfRunningTasks,
        })))
        events = []
    })


    test("defaultTTL 500", async () => {
        let counter = 0
        const cache = sp.createCachedProvider({
            factory: async () => {
                await sleep(300)
                return counter++
            },
            defaultTTL: 500
        })
        expect(await Promise.all([
            cache.get(),
            cache.get(100)
        ])).toEqual([0, 0])
        await sleep(500)
        expect(await Promise.all([
            cache.get(),
            cache.get(100)
        ])).toEqual([1, 1])
    })

    test("with capture", async () => {
        let counter = 0
        const cache = CachedProvider.capture({
                // capture variables for factory callback
                // those variables lives across multiple function calls
                variable1: new Set<number>()
            }, ({variable1}) => sp.createCachedProvider({
                factory: async () => {
                    await sleep(300)
                    variable1.add(counter)
                    console.log(`variable1 = ${Array.from(variable1)}`)
                    return counter++
                },
                defaultTTL: 500
            })
        )
        expect(await Promise.all([
            cache.get(),
            cache.get(100)
        ])).toEqual([0, 0])
        await sleep(500)
        expect(await Promise.all([
            cache.get(),
            cache.get(100)
        ])).toEqual([1, 1])
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