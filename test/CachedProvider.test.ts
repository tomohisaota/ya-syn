import {createSynchronizerProvider, sleep} from "./utils";
import {CachedProvider} from "../src";


describe("CachedProvider", () => {

    test('with timeout', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        let count = 0
        const cache = sp.createCachedProvider({
            factory: async () => count++
        })
        expect(await cache.get(100)).toBe(0)
        await sleep(10) // still in cache
        expect(await cache.get(100)).toBe(0)
        await sleep(100) // wait until cache expires
        expect(await cache.get(100)).toBe(1)
        expect(count).toBe(2)
        await checker.dumpLater()
    });

    test('without timeout', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        let count = 0
        const cache = sp.createCachedProvider({
            factory: async () => {
                await sleep(300)
                return count++
            }
        })
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([0, 0, 0, 0, 0])
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([1, 1, 1, 1, 1])
        await checker.dumpLater()
    });

    test.concurrent('override default ttl', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        let count = 0
        const cache = sp.createCachedProvider({
            factory: async () => {
                await sleep(300)
                return count++
            },
            defaultTTL: 500
        })
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([0, 0, 0, 0, 0])
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([0, 0, 0, 0, 0])
        // after TTL, new value
        await sleep(500)
        expect(await Promise.all([
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
            cache.get(),
        ])).toEqual([1, 1, 1, 1, 1])
        await checker.dumpLater()
    });

    test.concurrent('with capture', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        let count = 0
        const cache = CachedProvider.capture({
            variable1: new Set<number>()
        }, ({variable1}) => sp
            .createCachedProvider({
                factory: async () => {
                    const i = count++
                    variable1.add(i)
                    expect(variable1.size).toBe(count)
                    return i
                }
            }))
        expect(await cache.get(100)).toBe(0)
        await sleep(10) // still in cache
        expect(await cache.get(100)).toBe(0)
        await sleep(100) // wait until cache expires
        expect(await cache.get(100)).toBe(1)
        expect(count).toBe(2)
        await checker.dumpLater()
    });

    test.concurrent('with capture', async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        let count = 0
        const cache = CachedProvider.capture({
            variable1: new Set<number>()
        }, ({variable1}) => sp
            .createCachedProvider({
                factory: async () => {
                    variable1.add(count++)
                    return new Map<string, string>()
                }
            }))
        console.log(await cache.get())
        await checker.dumpLater()
    });
})

/*

> ya-syn@1.1.1 test
> jest --verbose test/CachedProvider.test.ts

  console.log
    Map(0) {}

      at test/CachedProvider.test.ts:119:17

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬────────────────────────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                                                │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686604 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686604 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686604 cachedAt:undefined'     │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686604 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 4       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686716 cachedAt:1738241686604' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 5       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686716 cachedAt:1738241686604' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    └─────────┴──────────────────────────┴───────────────────────────┴────────────────────────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                                                 │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │
    ├─────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:100 requestedAt:1738241686604 cachedAt:undefined     │ 'AC' │ 'AD' │ 'RE' │ 'FI' │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:100 requestedAt:1738241686716 cachedAt:1738241686604 │      │      │      │      │ 'AC' │ 'AD' │
    └─────────────────────────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬──────────────────────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                                              │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼──────────────────────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 5       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 6       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 7       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 8       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 9       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 10      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 11      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 12      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 13      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 14      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 15      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 16      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 17      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 18      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 19      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686724 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 20      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 21      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 22      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquire'  │ 1                      │ 3             │ 0                    │
    │ 23      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquire'  │ 1                      │ 4             │ 0                    │
    │ 24      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquire'  │ 1                      │ 5             │ 0                    │
    │ 25      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquired' │ 1                      │ 5             │ 1                    │
    │ 26      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 27      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 28      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 29      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 30      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 31      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 32      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 33      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 34      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 35      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 36      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 37      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241687024 cachedAt:1738241686724' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    └─────────┴──────────────────────────┴───────────────────────────┴──────────────────────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                                               │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │ 21   │ 22   │ 23   │ 24   │ 25   │ 26   │ 27   │ 28   │ 29   │ 30   │ 31   │ 32   │ 33   │ 34   │ 35   │ 36   │ 37   │
    ├───────────────────────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:0 requestedAt:1738241686724 cachedAt:undefined     │ 'AC' │ 'AD' │ 'AC' │ 'AC' │ 'AC' │ 'AC' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:0 requestedAt:1738241687024 cachedAt:1738241686724 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AC' │ 'AC' │ 'AC' │ 'AC' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │
    └───────────────────────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬──────────────────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                                          │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼──────────────────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686590 cachedAt:undefined' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686590 cachedAt:undefined' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686590 cachedAt:undefined' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:0 requestedAt:1738241686590 cachedAt:undefined' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────────────┴───────────────────────────┴──────────────────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌───────────────────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                                           │ 0    │ 1    │ 2    │ 3    │
    ├───────────────────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:0 requestedAt:1738241686590 cachedAt:undefined │ 'AC' │ 'AD' │ 'RE' │ 'FI' │
    └───────────────────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬────────────────────────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                                                │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686589 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686589 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 5       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 6       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686589 cachedAt:undefined'     │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 7       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686589 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 8       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 9       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 10      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 11      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 12      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 13      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 14      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 15      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 16      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 17      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 18      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 19      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241686590 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 20      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 21      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 22      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 23      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 24      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 25      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 26      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 27      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 28      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 29      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 30      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 31      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 32      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 33      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 34      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 35      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 36      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 37      │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:500 requestedAt:1738241687394 cachedAt:1738241686591' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    └─────────┴──────────────────────────┴───────────────────────────┴────────────────────────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                                                 │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │ 21   │ 22   │ 23   │ 24   │ 25   │ 26   │ 27   │ 28   │ 29   │ 30   │ 31   │ 32   │ 33   │ 34   │ 35   │ 36   │ 37   │
    ├─────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:500 requestedAt:1738241686589 cachedAt:undefined     │ 'AC' │ 'AD' │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:500 requestedAt:1738241686590 cachedAt:undefined     │      │      │ 'AC' │ 'AC' │ 'AC' │ 'AC' │      │      │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:500 requestedAt:1738241687394 cachedAt:1738241686591 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │ 'AC' │ 'AC' │ 'AC' │ 'AC' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │ 'RE' │ 'FI' │ 'AD' │
    └─────────────────────────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬──────────────────────────┬───────────────────────────┬────────────────────────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId               │ synchronizerId            │ executionId                                                │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686590 cachedAt:undefined'     │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686590 cachedAt:undefined'     │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 3       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686590 cachedAt:undefined'     │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 4       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686709 cachedAt:1738241686591' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 5       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686709 cachedAt:1738241686591' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 6       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686709 cachedAt:1738241686591' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 7       │ 'CachedProvider.test.ts' │ 'id:0 obj:CachedProvider' │ 'ttl:100 requestedAt:1738241686709 cachedAt:1738241686591' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────────────┴───────────────────────────┴────────────────────────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                                                 │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │
    ├─────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:100 requestedAt:1738241686590 cachedAt:undefined     │ 'AC' │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │
    │ CachedProvider.test.ts/id:0 obj:CachedProvider/ttl:100 requestedAt:1738241686709 cachedAt:1738241686591 │      │      │      │      │ 'AC' │ 'AD' │ 'RE' │ 'FI' │
    └─────────────────────────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

 */