import {createSynchronizerProvider} from "../utils";

const prefix = "Lock By Class"
describe(prefix, () => {

    test("Lock By Class", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)

        class Sample {
            count = 0

            async increment() {
                return sp.forObject(Sample).synchronized(async () => {
                    const count = this.count
                    await new Promise(resolve => setTimeout(resolve, 10))
                    this.count = count + 1
                })
            }
        }

        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 5; i++) {
            tasks.push(t.increment())
        }
        await Promise.all(tasks)
        expect(t.count).toBe(5)
        await checker.dumpLater()
    })

})


/*


> ya-syn@1.1.1 test
> jest --verbose test/samples/lock-by-class.test.ts

  console.log
    ┌─────────┬─────────────────────────┬─────────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId              │ synchronizerId      │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼─────────────────────────┼─────────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '53e1eda6-b292-42d3-aee9-2a20aea8d591' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '53e1eda6-b292-42d3-aee9-2a20aea8d591' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '7b0cd0c2-f26c-4797-825c-911a3698932e' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ 'a8ddbb49-0418-4b8a-be73-8a19953b05aa' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ 'cb0f8003-8718-464c-a484-c01b0a81164d' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 5       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '36d8a7c4-4725-4610-aa79-82882b5f6cb9' │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 6       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '53e1eda6-b292-42d3-aee9-2a20aea8d591' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 7       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '53e1eda6-b292-42d3-aee9-2a20aea8d591' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 8       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '7b0cd0c2-f26c-4797-825c-911a3698932e' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 9       │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '7b0cd0c2-f26c-4797-825c-911a3698932e' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 10      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '7b0cd0c2-f26c-4797-825c-911a3698932e' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 11      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ 'a8ddbb49-0418-4b8a-be73-8a19953b05aa' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 12      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ 'a8ddbb49-0418-4b8a-be73-8a19953b05aa' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 13      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ 'a8ddbb49-0418-4b8a-be73-8a19953b05aa' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 14      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ 'cb0f8003-8718-464c-a484-c01b0a81164d' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 15      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ 'cb0f8003-8718-464c-a484-c01b0a81164d' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 16      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ 'cb0f8003-8718-464c-a484-c01b0a81164d' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 17      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '36d8a7c4-4725-4610-aa79-82882b5f6cb9' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 18      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '36d8a7c4-4725-4610-aa79-82882b5f6cb9' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 19      │ 'lock-by-class.test.ts' │ 'id:0 obj:Function' │ '36d8a7c4-4725-4610-aa79-82882b5f6cb9' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴─────────────────────────┴─────────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌──────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                      │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │
    ├──────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ lock-by-class.test.ts/id:0 obj:Function/53e1eda6-b292-42d3-aee9-2a20aea8d591 │ 'AC' │ 'AD' │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-class.test.ts/id:0 obj:Function/7b0cd0c2-f26c-4797-825c-911a3698932e │      │      │ 'AC' │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │
    │ lock-by-class.test.ts/id:0 obj:Function/a8ddbb49-0418-4b8a-be73-8a19953b05aa │      │      │      │ 'AC' │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │
    │ lock-by-class.test.ts/id:0 obj:Function/cb0f8003-8718-464c-a484-c01b0a81164d │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │
    │ lock-by-class.test.ts/id:0 obj:Function/36d8a7c4-4725-4610-aa79-82882b5f6cb9 │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │
    └──────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

 */