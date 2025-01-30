import {createSynchronizerProvider, sleep} from "../utils";

const prefix = "Lock"
describe(prefix, () => {
    const {checker, sp} = createSynchronizerProvider(__filename)

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
        await checker.dumpLater()
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
        await checker.dumpLater()
    })
})

/*

> ya-syn@1.1.1 test
> jest --verbose test/samples/lock.test.ts

  console.log
    ┌─────────┬────────────────┬─────────────────────┬─────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId     │ synchronizerId      │ executionId                 │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼────────────────┼─────────────────────┼─────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Execution1'           │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Execution1'           │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution1' │ 'Enter'    │ 1                      │ 1             │ 1                    │
    │ 3       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Execution2'           │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 4       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution1' │ 'Exit'     │ 1                      │ 2             │ 1                    │
    │ 5       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution1' │ 'Finish'   │ 1                      │ 2             │ 1                    │
    │ 6       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Execution1'           │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 7       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Execution1'           │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 8       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Execution2'           │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 9       │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution2' │ 'Enter'    │ 1                      │ 1             │ 1                    │
    │ 10      │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution2' │ 'Exit'     │ 1                      │ 1             │ 1                    │
    │ 11      │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Reentrant-Execution2' │ 'Finish'   │ 1                      │ 1             │ 1                    │
    │ 12      │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Execution2'           │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 13      │ 'lock.test.ts' │ 'Lock-Synchronizer' │ 'Lock-Execution2'           │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴────────────────┴─────────────────────┴─────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌──────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                  │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │
    ├──────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ lock.test.ts/Lock-Synchronizer/Lock-Execution1           │ 'AC' │ 'AD' │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │
    │ lock.test.ts/Lock-Synchronizer/Lock-Reentrant-Execution1 │      │      │ 'EN' │      │ 'EX' │ 'FI' │      │      │      │      │      │      │      │      │
    │ lock.test.ts/Lock-Synchronizer/Lock-Execution2           │      │      │      │ 'AC' │      │      │      │      │ 'AD' │      │      │      │ 'RE' │ 'FI' │
    │ lock.test.ts/Lock-Synchronizer/Lock-Reentrant-Execution2 │      │      │      │      │      │      │      │      │      │ 'EN' │ 'EX' │ 'FI' │      │      │
    └──────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬────────────────┬────────────────────────────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId     │ synchronizerId                         │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼────────────────┼────────────────────────────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ '88b2b9fc-1184-4fd0-bbd0-5617e4514b15' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ '88b2b9fc-1184-4fd0-bbd0-5617e4514b15' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ '3f073d14-2d29-471a-bd99-2830fe0f6ec5' │ 'Enter'    │ 1                      │ 1             │ 1                    │
    │ 3       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ 'c1f35651-cff4-45e7-bd76-27e65d85afce' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 4       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ '3f073d14-2d29-471a-bd99-2830fe0f6ec5' │ 'Exit'     │ 1                      │ 2             │ 1                    │
    │ 5       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ '3f073d14-2d29-471a-bd99-2830fe0f6ec5' │ 'Finish'   │ 1                      │ 2             │ 1                    │
    │ 6       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ '88b2b9fc-1184-4fd0-bbd0-5617e4514b15' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 7       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ '88b2b9fc-1184-4fd0-bbd0-5617e4514b15' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 8       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ 'c1f35651-cff4-45e7-bd76-27e65d85afce' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 9       │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ 'fee848be-5c59-4205-9072-0424204bdb8a' │ 'Enter'    │ 1                      │ 1             │ 1                    │
    │ 10      │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ 'fee848be-5c59-4205-9072-0424204bdb8a' │ 'Exit'     │ 1                      │ 1             │ 1                    │
    │ 11      │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ 'fee848be-5c59-4205-9072-0424204bdb8a' │ 'Finish'   │ 1                      │ 1             │ 1                    │
    │ 12      │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ 'c1f35651-cff4-45e7-bd76-27e65d85afce' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 13      │ 'lock.test.ts' │ 'd2ce7ad7-dd86-428b-beb5-425ca176464c' │ 'c1f35651-cff4-45e7-bd76-27e65d85afce' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴────────────────┴────────────────────────────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌────────────────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                                │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │
    ├────────────────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ lock.test.ts/d2ce7ad7-dd86-428b-beb5-425ca176464c/88b2b9fc-1184-4fd0-bbd0-5617e4514b15 │ 'AC' │ 'AD' │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │
    │ lock.test.ts/d2ce7ad7-dd86-428b-beb5-425ca176464c/3f073d14-2d29-471a-bd99-2830fe0f6ec5 │      │      │ 'EN' │      │ 'EX' │ 'FI' │      │      │      │      │      │      │      │      │
    │ lock.test.ts/d2ce7ad7-dd86-428b-beb5-425ca176464c/c1f35651-cff4-45e7-bd76-27e65d85afce │      │      │      │ 'AC' │      │      │      │      │ 'AD' │      │      │      │ 'RE' │ 'FI' │
    │ lock.test.ts/d2ce7ad7-dd86-428b-beb5-425ca176464c/fee848be-5c59-4205-9072-0424204bdb8a │      │      │      │      │      │      │      │      │      │ 'EN' │ 'EX' │ 'FI' │      │      │
    └────────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

*/


