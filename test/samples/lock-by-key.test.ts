import {sleep} from "../utils";
import {SynchronizerEvent, SynchronizerProvider} from "../../src";

const prefix = "Lock By Key"
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
            // synchronizerId: i.context.synchronizerId,
            executionId: i.context.executionId,
            type: i.type,
            maxConcurrentExecution: i.stats.maxConcurrentExecution,
            numberOfTasks: i.stats.numberOfTasks,
            numberOfRunningTasks: i.stats.numberOfRunningTasks,
        })))
        events = []
    })


    test("Lock By Class", async () => {
        const urls = [
            "https://example1.com/1",
            "https://example1.com/2",
            "https://example1.com/3",
            "https://example2.com/1",
            "https://example2.com/2",
            "https://example2.com/3",
            "https://example3.com/1",
            "https://example3.com/2",
            "https://example3.com/3",
        ]

        const accessed: {
            url: string,
            elapsed: number
        }[] = []
        const start = new Date().getTime()

        async function access(url: string) {
            const u = new URL(url)
            return sp.forKey(u.host, 1).synchronized({
                executionId: url,
                cb: async () => {
                    return sp.forKey("request", 3).synchronized({
                        executionId: "request",
                        cb: async () => {
                            await new Promise(resolve => setTimeout(resolve, 50))
                            accessed.push({url, elapsed: new Date().getTime() - start})
                        }
                    })
                }
            })
        }

        await Promise.all(urls.map(url => access(url)))
    })

})


/*

> ya-syn@1.0.0 test
> jest --verbose test/samples/lock-by-key.test.ts

  console.log
    ┌─────────┬──────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ executionId              │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'https://example1.com/1' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'https://example1.com/2' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 2       │ 'https://example1.com/3' │ 'Acquire'  │ 1                      │ 3             │ 0                    │
    │ 3       │ 'https://example2.com/1' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 4       │ 'https://example2.com/2' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 5       │ 'https://example2.com/3' │ 'Acquire'  │ 1                      │ 3             │ 0                    │
    │ 6       │ 'https://example3.com/1' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 7       │ 'https://example3.com/2' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 8       │ 'https://example3.com/3' │ 'Acquire'  │ 1                      │ 3             │ 0                    │
    │ 9       │ 'https://example1.com/1' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 10      │ 'request'                │ 'Acquire'  │ 3                      │ 1             │ 0                    │
    │ 11      │ 'https://example2.com/1' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 12      │ 'request'                │ 'Acquire'  │ 3                      │ 2             │ 0                    │
    │ 13      │ 'request'                │ 'Acquired' │ 3                      │ 2             │ 1                    │
    │ 14      │ 'request'                │ 'Acquired' │ 3                      │ 2             │ 2                    │
    │ 15      │ 'https://example3.com/1' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 16      │ 'request'                │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 17      │ 'request'                │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 18      │ 'request'                │ 'Release'  │ 3                      │ 3             │ 2                    │
    │ 19      │ 'request'                │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 20      │ 'https://example2.com/1' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 21      │ 'https://example2.com/1' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 22      │ 'https://example2.com/2' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 23      │ 'request'                │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 24      │ 'request'                │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 25      │ 'request'                │ 'Release'  │ 3                      │ 3             │ 2                    │
    │ 26      │ 'request'                │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 27      │ 'https://example1.com/1' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 28      │ 'https://example1.com/1' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 29      │ 'https://example1.com/2' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 30      │ 'request'                │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 31      │ 'request'                │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 32      │ 'request'                │ 'Release'  │ 3                      │ 3             │ 2                    │
    │ 33      │ 'request'                │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 34      │ 'https://example3.com/1' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 35      │ 'https://example3.com/1' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 36      │ 'https://example3.com/2' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 37      │ 'request'                │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 38      │ 'request'                │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 39      │ 'request'                │ 'Release'  │ 3                      │ 3             │ 2                    │
    │ 40      │ 'request'                │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 41      │ 'https://example2.com/2' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 42      │ 'https://example2.com/2' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 43      │ 'https://example2.com/3' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 44      │ 'request'                │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 45      │ 'request'                │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 46      │ 'request'                │ 'Release'  │ 3                      │ 3             │ 2                    │
    │ 47      │ 'request'                │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 48      │ 'https://example1.com/2' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 49      │ 'https://example1.com/2' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 50      │ 'https://example1.com/3' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 51      │ 'request'                │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 52      │ 'request'                │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 53      │ 'request'                │ 'Release'  │ 3                      │ 3             │ 2                    │
    │ 54      │ 'request'                │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 55      │ 'https://example3.com/2' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 56      │ 'https://example3.com/2' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 57      │ 'https://example3.com/3' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 58      │ 'request'                │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 59      │ 'request'                │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 60      │ 'request'                │ 'Release'  │ 3                      │ 3             │ 2                    │
    │ 61      │ 'request'                │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 62      │ 'https://example2.com/3' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 63      │ 'https://example2.com/3' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 64      │ 'request'                │ 'Release'  │ 3                      │ 2             │ 1                    │
    │ 65      │ 'request'                │ 'Finish'   │ 3                      │ 1             │ 1                    │
    │ 66      │ 'https://example1.com/3' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 67      │ 'https://example1.com/3' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 68      │ 'request'                │ 'Release'  │ 3                      │ 1             │ 0                    │
    │ 69      │ 'request'                │ 'Finish'   │ 3                      │ 0             │ 0                    │
    │ 70      │ 'https://example3.com/3' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 71      │ 'https://example3.com/3' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/lock-by-key.test.ts:16:17)

 */