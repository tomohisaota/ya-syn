import {createSynchronizerProvider, sleep} from "../utils";

const prefix = "Semaphore"
describe(prefix, () => {
    const {checker, sp} = createSynchronizerProvider(__filename)


    test("withId", async () => {
        const s = sp.createSynchronizer({
            synchronizerId: `${prefix}-Synchronizer`,
            maxConcurrentExecution: 2,
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
        await checker.dumpLater()
    })

    test("withoutId", async () => {
        const s = sp.createSynchronizer({
            maxConcurrentExecution: 2,
        })
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
        await checker.dumpLater()
    })
})

/*

> ya-syn@1.0.0 test
> jest --verbose test/samples/semaphore.test.ts

  console.log
    ┌─────────┬──────────────────────────────────┬──────────────────────────┬──────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId                       │ synchronizerId           │ executionId                      │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────────────┼──────────────────────────┼──────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution1'           │ 'Acquire'  │ 2                      │ 1             │ 0                    │
    │ 1       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution2'           │ 'Acquire'  │ 2                      │ 2             │ 0                    │
    │ 2       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution1'           │ 'Acquired' │ 2                      │ 2             │ 1                    │
    │ 3       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution1' │ 'Acquire'  │ 2                      │ 3             │ 1                    │
    │ 4       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution1' │ 'Enter'    │ 2                      │ 3             │ 1                    │
    │ 5       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution2'           │ 'Acquired' │ 2                      │ 3             │ 2                    │
    │ 6       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution2' │ 'Acquire'  │ 2                      │ 4             │ 2                    │
    │ 7       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution2' │ 'Enter'    │ 2                      │ 4             │ 2                    │
    │ 8       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution1' │ 'Exit'     │ 2                      │ 4             │ 2                    │
    │ 9       │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution1' │ 'Finish'   │ 2                      │ 3             │ 2                    │
    │ 10      │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution1'           │ 'Release'  │ 2                      │ 3             │ 1                    │
    │ 11      │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution1'           │ 'Finish'   │ 2                      │ 2             │ 1                    │
    │ 12      │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution2' │ 'Exit'     │ 2                      │ 2             │ 1                    │
    │ 13      │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution2' │ 'Finish'   │ 2                      │ 1             │ 1                    │
    │ 14      │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution2'           │ 'Release'  │ 2                      │ 1             │ 0                    │
    │ 15      │ 'Semaphore-SynchronizerProvider' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution2'           │ 'Finish'   │ 2                      │ 0             │ 0                    │
    └─────────┴──────────────────────────────────┴──────────────────────────┴──────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/semaphore.test.ts:14:17)

  console.log
    ┌─────────┬──────────────────────────────────┬────────────────┬─────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId                       │ synchronizerId │ executionId │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────────────────────┼────────────────┼─────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquire'  │ 2                      │ 1             │ 0                    │
    │ 1       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquire'  │ 2                      │ 2             │ 0                    │
    │ 2       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquired' │ 2                      │ 2             │ 1                    │
    │ 3       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquire'  │ 2                      │ 3             │ 1                    │
    │ 4       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Enter'    │ 2                      │ 3             │ 1                    │
    │ 5       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquired' │ 2                      │ 3             │ 2                    │
    │ 6       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Acquire'  │ 2                      │ 4             │ 2                    │
    │ 7       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Enter'    │ 2                      │ 4             │ 2                    │
    │ 8       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Exit'     │ 2                      │ 4             │ 2                    │
    │ 9       │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Finish'   │ 2                      │ 3             │ 2                    │
    │ 10      │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Release'  │ 2                      │ 3             │ 1                    │
    │ 11      │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Finish'   │ 2                      │ 2             │ 1                    │
    │ 12      │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Exit'     │ 2                      │ 2             │ 1                    │
    │ 13      │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Finish'   │ 2                      │ 1             │ 1                    │
    │ 14      │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Release'  │ 2                      │ 1             │ 0                    │
    │ 15      │ 'Semaphore-SynchronizerProvider' │ undefined      │ undefined   │ 'Finish'   │ 2                      │ 0             │ 0                    │
    └─────────┴──────────────────────────────────┴────────────────┴─────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/semaphore.test.ts:14:17)
*/


