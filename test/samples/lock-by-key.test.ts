import {createSynchronizerProvider} from "../utils";

const prefix = "Lock By Key"
describe(prefix, () => {
    const {checker, sp} = createSynchronizerProvider(__filename)

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

        async function access(url: string) {
            const u = new URL(url)
            return sp.forKey(u.host, 1).synchronized({
                executionId: url,
                cb: async () => {
                    return sp.forKey("request", 3).synchronized({
                        executionId: url,
                        cb: async () => {
                            await new Promise((resolve): void => {
                                setTimeout(resolve, 50)
                            })
                        }
                    })
                }
            })
        }

        await Promise.all(urls.map(url => access(url)))
        await checker.dumpLater()
        checker.clear()
    })

})


/*


> ya-syn@1.1.1 test
> jest --verbose test/samples/lock-by-key.test.ts

  console.log
    ┌─────────┬───────────────────────┬─────────────────────────┬──────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId            │ synchronizerId          │ executionId              │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼───────────────────────┼─────────────────────────┼──────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/1' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/1' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/2' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/1' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 4       │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/1' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 5       │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/1' │ 'Acquire'  │ 3                      │ 1             │ 0                    │
    │ 6       │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/1' │ 'Acquired' │ 3                      │ 1             │ 1                    │
    │ 7       │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/1' │ 'Acquire'  │ 3                      │ 2             │ 1                    │
    │ 8       │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/1' │ 'Acquired' │ 3                      │ 2             │ 2                    │
    │ 9       │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/3' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 10      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/2' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 11      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/1' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 12      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/1' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 13      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/1' │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 14      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/1' │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 15      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/3' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 16      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/2' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 17      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/3' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 18      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/1' │ 'Release'  │ 3                      │ 2             │ 2                    │
    │ 19      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/1' │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 20      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/1' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 21      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/1' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 22      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/2' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 23      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/2' │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 24      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/2' │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 25      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/1' │ 'Release'  │ 3                      │ 2             │ 2                    │
    │ 26      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/1' │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 27      │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/1' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 28      │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/1' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 29      │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/2' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 30      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/2' │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 31      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/2' │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 32      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/1' │ 'Release'  │ 3                      │ 2             │ 2                    │
    │ 33      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/1' │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 34      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/1' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 35      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/1' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 36      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/2' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 37      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/2' │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 38      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/2' │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 39      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/2' │ 'Release'  │ 3                      │ 2             │ 2                    │
    │ 40      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/2' │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 41      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/2' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 42      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/2' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 43      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/3' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 44      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/3' │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 45      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/3' │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 46      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/2' │ 'Release'  │ 3                      │ 2             │ 2                    │
    │ 47      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/2' │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 48      │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/2' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 49      │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/2' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 50      │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/3' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 51      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/3' │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 52      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/3' │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 53      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/2' │ 'Release'  │ 3                      │ 2             │ 2                    │
    │ 54      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/2' │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 55      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/2' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 56      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/2' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 57      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/3' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 58      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/3' │ 'Acquire'  │ 3                      │ 3             │ 2                    │
    │ 59      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/3' │ 'Acquired' │ 3                      │ 3             │ 3                    │
    │ 60      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/3' │ 'Release'  │ 3                      │ 2             │ 2                    │
    │ 61      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example2.com/3' │ 'Finish'   │ 3                      │ 2             │ 2                    │
    │ 62      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/3' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 63      │ 'lock-by-key.test.ts' │ 'id:1 key:example2.com' │ 'https://example2.com/3' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 64      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/3' │ 'Release'  │ 3                      │ 1             │ 1                    │
    │ 65      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example1.com/3' │ 'Finish'   │ 3                      │ 1             │ 1                    │
    │ 66      │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/3' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 67      │ 'lock-by-key.test.ts' │ 'id:0 key:example1.com' │ 'https://example1.com/3' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    │ 68      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/3' │ 'Release'  │ 3                      │ 0             │ 0                    │
    │ 69      │ 'lock-by-key.test.ts' │ 'id:3 key:request'      │ 'https://example3.com/3' │ 'Finish'   │ 3                      │ 0             │ 0                    │
    │ 70      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/3' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 71      │ 'lock-by-key.test.ts' │ 'id:2 key:example3.com' │ 'https://example3.com/3' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴───────────────────────┴─────────────────────────┴──────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌──────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                          │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │ 21   │ 22   │ 23   │ 24   │ 25   │ 26   │ 27   │ 28   │ 29   │ 30   │ 31   │ 32   │ 33   │ 34   │ 35   │ 36   │ 37   │ 38   │ 39   │ 40   │ 41   │ 42   │ 43   │ 44   │ 45   │ 46   │ 47   │ 48   │ 49   │ 50   │ 51   │ 52   │ 53   │ 54   │ 55   │ 56   │ 57   │ 58   │ 59   │ 60   │ 61   │ 62   │ 63   │ 64   │ 65   │ 66   │ 67   │ 68   │ 69   │ 70   │ 71   │
    ├──────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ lock-by-key.test.ts/id:0 key:example1.com/https://example1.com/1 │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:0 key:example1.com/https://example1.com/2 │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:1 key:example2.com/https://example2.com/1 │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:3 key:request/https://example2.com/1      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:3 key:request/https://example1.com/1      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:0 key:example1.com/https://example1.com/3 │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │
    │ lock-by-key.test.ts/id:1 key:example2.com/https://example2.com/2 │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:2 key:example3.com/https://example3.com/1 │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:3 key:request/https://example3.com/1      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:1 key:example2.com/https://example2.com/3 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:2 key:example3.com/https://example3.com/2 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:2 key:example3.com/https://example3.com/3 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │
    │ lock-by-key.test.ts/id:3 key:request/https://example2.com/2      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:3 key:request/https://example1.com/2      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:3 key:request/https://example3.com/2      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:3 key:request/https://example2.com/3      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:3 key:request/https://example1.com/3      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │
    │ lock-by-key.test.ts/id:3 key:request/https://example3.com/3      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │
    └──────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

 */