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


> ya-syn@1.1.1 test
> jest --verbose test/samples/semaphore.test.ts

  console.log
    ┌─────────┬─────────────────────┬──────────────────────────┬──────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId          │ synchronizerId           │ executionId                      │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼─────────────────────┼──────────────────────────┼──────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution1'           │ 'Acquire'  │ 2                      │ 1             │ 0                    │
    │ 1       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution1'           │ 'Acquired' │ 2                      │ 1             │ 1                    │
    │ 2       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution1' │ 'Enter'    │ 2                      │ 1             │ 1                    │
    │ 3       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution2'           │ 'Acquire'  │ 2                      │ 2             │ 1                    │
    │ 4       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution2'           │ 'Acquired' │ 2                      │ 2             │ 2                    │
    │ 5       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution2' │ 'Enter'    │ 2                      │ 2             │ 2                    │
    │ 6       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution1' │ 'Exit'     │ 2                      │ 2             │ 2                    │
    │ 7       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution1' │ 'Finish'   │ 2                      │ 2             │ 2                    │
    │ 8       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution1'           │ 'Release'  │ 2                      │ 1             │ 1                    │
    │ 9       │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution1'           │ 'Finish'   │ 2                      │ 1             │ 1                    │
    │ 10      │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution2' │ 'Exit'     │ 2                      │ 1             │ 1                    │
    │ 11      │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Reentrant-Execution2' │ 'Finish'   │ 2                      │ 1             │ 1                    │
    │ 12      │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution2'           │ 'Release'  │ 2                      │ 0             │ 0                    │
    │ 13      │ 'semaphore.test.ts' │ 'Semaphore-Synchronizer' │ 'Semaphore-Execution2'           │ 'Finish'   │ 2                      │ 0             │ 0                    │
    └─────────┴─────────────────────┴──────────────────────────┴──────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                 │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │
    ├─────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ semaphore.test.ts/Semaphore-Synchronizer/Semaphore-Execution1           │ 'AC' │ 'AD' │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │
    │ semaphore.test.ts/Semaphore-Synchronizer/Semaphore-Reentrant-Execution1 │      │      │ 'EN' │      │      │      │ 'EX' │ 'FI' │      │      │      │      │      │      │
    │ semaphore.test.ts/Semaphore-Synchronizer/Semaphore-Execution2           │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │ 'RE' │ 'FI' │
    │ semaphore.test.ts/Semaphore-Synchronizer/Semaphore-Reentrant-Execution2 │      │      │      │      │      │ 'EN' │      │      │      │      │ 'EX' │ 'FI' │      │      │
    └─────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬─────────────────────┬────────────────────────────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId          │ synchronizerId                         │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼─────────────────────┼────────────────────────────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ '35fcb535-64df-4268-a599-1cefc9ec1cc4' │ 'Acquire'  │ 2                      │ 1             │ 0                    │
    │ 1       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ '35fcb535-64df-4268-a599-1cefc9ec1cc4' │ 'Acquired' │ 2                      │ 1             │ 1                    │
    │ 2       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ 'edad86fe-c1c5-46c1-9750-75869241f279' │ 'Enter'    │ 2                      │ 1             │ 1                    │
    │ 3       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ 'd6fb2577-8aa4-43bc-a544-42339a11d991' │ 'Acquire'  │ 2                      │ 2             │ 1                    │
    │ 4       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ 'd6fb2577-8aa4-43bc-a544-42339a11d991' │ 'Acquired' │ 2                      │ 2             │ 2                    │
    │ 5       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ '260f3bef-b737-48ba-a63e-c6dee12ff7d9' │ 'Enter'    │ 2                      │ 2             │ 2                    │
    │ 6       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ 'edad86fe-c1c5-46c1-9750-75869241f279' │ 'Exit'     │ 2                      │ 2             │ 2                    │
    │ 7       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ 'edad86fe-c1c5-46c1-9750-75869241f279' │ 'Finish'   │ 2                      │ 2             │ 2                    │
    │ 8       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ '35fcb535-64df-4268-a599-1cefc9ec1cc4' │ 'Release'  │ 2                      │ 1             │ 1                    │
    │ 9       │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ '35fcb535-64df-4268-a599-1cefc9ec1cc4' │ 'Finish'   │ 2                      │ 1             │ 1                    │
    │ 10      │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ '260f3bef-b737-48ba-a63e-c6dee12ff7d9' │ 'Exit'     │ 2                      │ 1             │ 1                    │
    │ 11      │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ '260f3bef-b737-48ba-a63e-c6dee12ff7d9' │ 'Finish'   │ 2                      │ 1             │ 1                    │
    │ 12      │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ 'd6fb2577-8aa4-43bc-a544-42339a11d991' │ 'Release'  │ 2                      │ 0             │ 0                    │
    │ 13      │ 'semaphore.test.ts' │ '8264a4c0-c193-4c5e-9cd7-b04345155817' │ 'd6fb2577-8aa4-43bc-a544-42339a11d991' │ 'Finish'   │ 2                      │ 0             │ 0                    │
    └─────────┴─────────────────────┴────────────────────────────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                                     │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │
    ├─────────────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ semaphore.test.ts/8264a4c0-c193-4c5e-9cd7-b04345155817/35fcb535-64df-4268-a599-1cefc9ec1cc4 │ 'AC' │ 'AD' │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │
    │ semaphore.test.ts/8264a4c0-c193-4c5e-9cd7-b04345155817/edad86fe-c1c5-46c1-9750-75869241f279 │      │      │ 'EN' │      │      │      │ 'EX' │ 'FI' │      │      │      │      │      │      │
    │ semaphore.test.ts/8264a4c0-c193-4c5e-9cd7-b04345155817/d6fb2577-8aa4-43bc-a544-42339a11d991 │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │ 'RE' │ 'FI' │
    │ semaphore.test.ts/8264a4c0-c193-4c5e-9cd7-b04345155817/260f3bef-b737-48ba-a63e-c6dee12ff7d9 │      │      │      │      │      │ 'EN' │      │      │      │      │ 'EX' │ 'FI' │      │      │
    └─────────────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

*/


