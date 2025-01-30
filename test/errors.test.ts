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

> ya-syn@1.1.1 test
> jest --verbose test/errors.test.ts

  console.log
    ┌─────────┬──────────────────┬────────────────────────────────────────┬────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId       │ synchronizerId                         │ executionId    │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────┼────────────────────────────────────────┼────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'errors.test.ts' │ 'c7ad6254-6931-4efe-b838-84c5282aa308' │ 'executionId0' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'errors.test.ts' │ 'c7ad6254-6931-4efe-b838-84c5282aa308' │ 'executionId0' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'errors.test.ts' │ 'c7ad6254-6931-4efe-b838-84c5282aa308' │ 'executionId1' │ 'Throttle' │ 1                      │ 1             │ 1                    │
    │ 3       │ 'errors.test.ts' │ 'c7ad6254-6931-4efe-b838-84c5282aa308' │ 'executionId2' │ 'Throttle' │ 1                      │ 1             │ 1                    │
    │ 4       │ 'errors.test.ts' │ 'c7ad6254-6931-4efe-b838-84c5282aa308' │ 'executionId3' │ 'Throttle' │ 1                      │ 1             │ 1                    │
    │ 5       │ 'errors.test.ts' │ 'c7ad6254-6931-4efe-b838-84c5282aa308' │ 'executionId0' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 6       │ 'errors.test.ts' │ 'c7ad6254-6931-4efe-b838-84c5282aa308' │ 'executionId0' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────┴────────────────────────────────────────┴────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌──────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                          │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │
    ├──────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ errors.test.ts/c7ad6254-6931-4efe-b838-84c5282aa308/executionId0 │ 'AC' │ 'AD' │      │      │      │ 'RE' │ 'FI' │
    │ errors.test.ts/c7ad6254-6931-4efe-b838-84c5282aa308/executionId1 │      │      │ 'TH' │      │      │      │      │
    │ errors.test.ts/c7ad6254-6931-4efe-b838-84c5282aa308/executionId2 │      │      │      │ 'TH' │      │      │      │
    │ errors.test.ts/c7ad6254-6931-4efe-b838-84c5282aa308/executionId3 │      │      │      │      │ 'TH' │      │      │
    └──────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬──────────────────┬────────────────────────────────────────┬────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId       │ synchronizerId                         │ executionId    │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼──────────────────┼────────────────────────────────────────┼────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId0' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId0' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId1' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId2' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId3' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 5       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId1' │ 'Timeout'  │ 1                      │ 3             │ 1                    │
    │ 6       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId2' │ 'Timeout'  │ 1                      │ 2             │ 1                    │
    │ 7       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId3' │ 'Timeout'  │ 1                      │ 1             │ 1                    │
    │ 8       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId0' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 9       │ 'errors.test.ts' │ 'c49192db-cc65-4297-abf9-c636a95d80cf' │ 'executionId0' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴──────────────────┴────────────────────────────────────────┴────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌──────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                          │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │
    ├──────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ errors.test.ts/c49192db-cc65-4297-abf9-c636a95d80cf/executionId0 │ 'AC' │ 'AD' │      │      │      │      │      │      │ 'RE' │ 'FI' │
    │ errors.test.ts/c49192db-cc65-4297-abf9-c636a95d80cf/executionId1 │      │      │ 'AC' │      │      │ 'TI' │      │      │      │      │
    │ errors.test.ts/c49192db-cc65-4297-abf9-c636a95d80cf/executionId2 │      │      │      │ 'AC' │      │      │ 'TI' │      │      │      │
    │ errors.test.ts/c49192db-cc65-4297-abf9-c636a95d80cf/executionId3 │      │      │      │      │ 'AC' │      │      │ 'TI' │      │      │
    └──────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

 */