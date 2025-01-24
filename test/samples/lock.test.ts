import {sleep} from "../utils";
import {SynchronizerEvent, SynchronizerProvider} from "../../src";

const prefix = "Lock"
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
            providerId: i.context.providerId,
            synchronizerId: i.context.synchronizerId,
            executionId: i.context.executionId,
            type: i.type,
            maxConcurrentExecution: i.stats.maxConcurrentExecution,
            numberOfTasks: i.stats.numberOfTasks,
            numberOfRunningTasks: i.stats.numberOfRunningTasks,
        })))
        events = []
    })

    test("withId", async () => {
        const s = sp.createSynchronizer({
            synchronizerId: `${prefix}-Synchronizer`
        })
        await Promise.all([
            s.synchronized({
                executionId: `${prefix}-Execution1`,
                cb: async () => s.synchronized({
                    executionId: `${prefix}-Reentrant-Execution1`,
                    cb: async () => sleep(10)
                })
            }),
            s.synchronized({
                executionId: `${prefix}-Execution2`,
                cb: async () => s.synchronized({
                    executionId: `${prefix}-Reentrant-Execution2`,
                    cb: async () => sleep(10)
                })
            }),
        ])
    })

    test("withoutId", async () => {
        const s = sp.createSynchronizer()
        await Promise.all([
            s.synchronized({
                cb: async () => s.synchronized({
                    cb: async () => sleep(10)
                })
            }),
            s.synchronized(
                async () => s.synchronized(
                    async () => sleep(10)
                )
            ),
        ])
    })
})

/*

> ya-syn@1.0.0 test
> jest --verbose test/samples/lock.test.ts

  console.log
    ┌─────────┬─────────────────────────────┬─────────────────────┬─────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId                  │ synchronizerId      │ executionId                 │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼─────────────────────────────┼─────────────────────┼─────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Execution1'           │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Execution2'           │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 2       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Execution1'           │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 3       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution1' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution1' │ 'Enter'    │ 1                      │ 3             │ 1                    │
    │ 5       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution1' │ 'Exit'     │ 1                      │ 3             │ 1                    │
    │ 6       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution1' │ 'Finish'   │ 1                      │ 2             │ 1                    │
    │ 7       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Execution1'           │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 8       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Execution1'           │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 9       │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Execution2'           │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 10      │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution2' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 11      │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution2' │ 'Enter'    │ 1                      │ 2             │ 1                    │
    │ 12      │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution2' │ 'Exit'     │ 1                      │ 2             │ 1                    │
    │ 13      │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution2' │ 'Finish'   │ 1                      │ 1             │ 1                    │
    │ 14      │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Execution2'           │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 15      │ 'Lock-SynchronizerProvider' │ 'Lock-Synchronizer' │ 'Lock-Execution2'           │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴─────────────────────────────┴─────────────────────┴─────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/lock.test.ts:14:17)

  console.log
    ┌─────────┬─────────────────────────────┬────────────────┬─────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId                  │ synchronizerId │ executionId │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼─────────────────────────────┼────────────────┼─────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 2       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 3       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Enter'    │ 1                      │ 3             │ 1                    │
    │ 5       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Exit'     │ 1                      │ 3             │ 1                    │
    │ 6       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Finish'   │ 1                      │ 2             │ 1                    │
    │ 7       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 8       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 9       │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 10      │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 11      │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Enter'    │ 1                      │ 2             │ 1                    │
    │ 12      │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Exit'     │ 1                      │ 2             │ 1                    │
    │ 13      │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Finish'   │ 1                      │ 1             │ 1                    │
    │ 14      │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 15      │ 'Lock-SynchronizerProvider' │ undefined      │ undefined   │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴─────────────────────────────┴────────────────┴─────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/lock.test.ts:14:17)
*/


