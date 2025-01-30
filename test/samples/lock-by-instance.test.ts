import {createSynchronizerProvider} from "../utils";

const prefix = "Lock By Instance"
describe(prefix, () => {

    test("without lock", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)

        class Sample {
            count = 0

            async increment() {
                const count = this.count
                await new Promise(resolve => setTimeout(resolve, 10))
                this.count = count + 1
            }

            async incrementWithLock() {
                await sp.forObject(this).synchronized(async () => {
                    await this.increment()
                })
            }
        }

        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 10; i++) {
            tasks.push(t.increment())
        }
        await Promise.all(tasks)
        expect(t.count).toBe(1)
        await checker.dumpLater()
    })

    test("with synchronized method", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)

        class Sample {
            count = 0

            async increment() {
                const count = this.count
                await new Promise(resolve => setTimeout(resolve, 10))
                this.count = count + 1
            }

            async incrementWithLock() {
                await sp.forObject(this).synchronized(async () => {
                    await this.increment()
                })
            }
        }

        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 5; i++) {
            tasks.push(t.incrementWithLock())
        }
        await Promise.all(tasks)
        expect(t.count).toBe(5)
        await checker.dumpLater()
    })

    test("with external synchronizer", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)

        class Sample {
            count = 0

            async increment() {
                const count = this.count
                await new Promise(resolve => setTimeout(resolve, 10))
                this.count = count + 1
            }

            async incrementWithLock() {
                await sp.forObject(this).synchronized(async () => {
                    await this.increment()
                })
            }
        }

        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 5; i++) {
            tasks.push(sp.forObject(t).synchronized(async () => {
                await t.increment()
            }))
        }
        await Promise.all(tasks)
        expect(t.count).toBe(5)
        await checker.dumpLater()
    })

    test.concurrent("with synchronized method and external synchronizer", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)

        class Sample {
            count = 0

            async increment() {
                const count = this.count
                await new Promise(resolve => setTimeout(resolve, 10))
                this.count = count + 1
            }

            async incrementWithLock() {
                await sp.forObject(this).synchronized(async () => {
                    await this.increment()
                })
            }
        }

        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 5; i++) {
            // Synchronizer provider returns same synchronizer for same object
            tasks.push(t.incrementWithLock())
            tasks.push(sp.forObject(t).synchronized(async () => {
                await t.increment()
                await t.incrementWithLock()
            }))
        }
        await Promise.all(tasks)
        expect(t.count).toBe(15)
        await checker.dumpLater()
    })

})

/*

> ya-syn@1.1.1 test
> jest --verbose test/samples/lock-by-instance.test.ts

  console.log
    ┌─────────┐
    │ (index) │
    ├─────────┤
    └─────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌─────────┐
    │ (index) │
    ├─────────┤
    └─────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬────────────────────────────┬───────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId                 │ synchronizerId    │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼────────────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'fd8961e1-2762-4664-9b2e-6f30c5a41ef8' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'fd8961e1-2762-4664-9b2e-6f30c5a41ef8' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'cf3a36fb-246e-4eeb-8c12-2c7be491cd6a' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'eefde18a-3120-4fc7-91bb-5f81736b56e7' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '27696af1-8359-4cc3-98fc-0857364adfea' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 5       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '1e70777f-2eb0-45a5-9d3b-95ab2b33e66f' │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 6       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2214281f-069b-46d3-a4e9-387da5866d4c' │ 'Acquire'  │ 1                      │ 6             │ 1                    │
    │ 7       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '438596dd-e81e-4fce-bc27-652e1c95233f' │ 'Acquire'  │ 1                      │ 7             │ 1                    │
    │ 8       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'ce48df10-9c4c-4f0b-93c0-451a6e171a5e' │ 'Acquire'  │ 1                      │ 8             │ 1                    │
    │ 9       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '594b5fce-3504-4415-b980-d4efc6c5ae7a' │ 'Acquire'  │ 1                      │ 9             │ 1                    │
    │ 10      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'a3cf3533-c759-44e0-acaa-877fb0142089' │ 'Acquire'  │ 1                      │ 10            │ 1                    │
    │ 11      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'fd8961e1-2762-4664-9b2e-6f30c5a41ef8' │ 'Release'  │ 1                      │ 9             │ 0                    │
    │ 12      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'fd8961e1-2762-4664-9b2e-6f30c5a41ef8' │ 'Finish'   │ 1                      │ 9             │ 0                    │
    │ 13      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'cf3a36fb-246e-4eeb-8c12-2c7be491cd6a' │ 'Acquired' │ 1                      │ 9             │ 1                    │
    │ 14      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '71ad3583-864d-4b53-b4b0-bd1d9ddc0423' │ 'Enter'    │ 1                      │ 9             │ 1                    │
    │ 15      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '71ad3583-864d-4b53-b4b0-bd1d9ddc0423' │ 'Exit'     │ 1                      │ 9             │ 1                    │
    │ 16      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '71ad3583-864d-4b53-b4b0-bd1d9ddc0423' │ 'Finish'   │ 1                      │ 9             │ 1                    │
    │ 17      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'cf3a36fb-246e-4eeb-8c12-2c7be491cd6a' │ 'Release'  │ 1                      │ 8             │ 0                    │
    │ 18      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'cf3a36fb-246e-4eeb-8c12-2c7be491cd6a' │ 'Finish'   │ 1                      │ 8             │ 0                    │
    │ 19      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'eefde18a-3120-4fc7-91bb-5f81736b56e7' │ 'Acquired' │ 1                      │ 8             │ 1                    │
    │ 20      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'eefde18a-3120-4fc7-91bb-5f81736b56e7' │ 'Release'  │ 1                      │ 7             │ 0                    │
    │ 21      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'eefde18a-3120-4fc7-91bb-5f81736b56e7' │ 'Finish'   │ 1                      │ 7             │ 0                    │
    │ 22      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '27696af1-8359-4cc3-98fc-0857364adfea' │ 'Acquired' │ 1                      │ 7             │ 1                    │
    │ 23      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '3a62d292-e433-4e06-8c07-fc994a9794fd' │ 'Enter'    │ 1                      │ 7             │ 1                    │
    │ 24      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '3a62d292-e433-4e06-8c07-fc994a9794fd' │ 'Exit'     │ 1                      │ 7             │ 1                    │
    │ 25      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '3a62d292-e433-4e06-8c07-fc994a9794fd' │ 'Finish'   │ 1                      │ 7             │ 1                    │
    │ 26      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '27696af1-8359-4cc3-98fc-0857364adfea' │ 'Release'  │ 1                      │ 6             │ 0                    │
    │ 27      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '27696af1-8359-4cc3-98fc-0857364adfea' │ 'Finish'   │ 1                      │ 6             │ 0                    │
    │ 28      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '1e70777f-2eb0-45a5-9d3b-95ab2b33e66f' │ 'Acquired' │ 1                      │ 6             │ 1                    │
    │ 29      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '1e70777f-2eb0-45a5-9d3b-95ab2b33e66f' │ 'Release'  │ 1                      │ 5             │ 0                    │
    │ 30      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '1e70777f-2eb0-45a5-9d3b-95ab2b33e66f' │ 'Finish'   │ 1                      │ 5             │ 0                    │
    │ 31      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2214281f-069b-46d3-a4e9-387da5866d4c' │ 'Acquired' │ 1                      │ 5             │ 1                    │
    │ 32      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'b660c654-d085-4886-8369-344ad5461a12' │ 'Enter'    │ 1                      │ 5             │ 1                    │
    │ 33      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'b660c654-d085-4886-8369-344ad5461a12' │ 'Exit'     │ 1                      │ 5             │ 1                    │
    │ 34      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'b660c654-d085-4886-8369-344ad5461a12' │ 'Finish'   │ 1                      │ 5             │ 1                    │
    │ 35      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2214281f-069b-46d3-a4e9-387da5866d4c' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 36      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2214281f-069b-46d3-a4e9-387da5866d4c' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 37      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '438596dd-e81e-4fce-bc27-652e1c95233f' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 38      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '438596dd-e81e-4fce-bc27-652e1c95233f' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 39      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '438596dd-e81e-4fce-bc27-652e1c95233f' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 40      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'ce48df10-9c4c-4f0b-93c0-451a6e171a5e' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 41      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '569b00bd-c1c5-409f-bc49-06e95065a599' │ 'Enter'    │ 1                      │ 3             │ 1                    │
    │ 42      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '569b00bd-c1c5-409f-bc49-06e95065a599' │ 'Exit'     │ 1                      │ 3             │ 1                    │
    │ 43      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '569b00bd-c1c5-409f-bc49-06e95065a599' │ 'Finish'   │ 1                      │ 3             │ 1                    │
    │ 44      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'ce48df10-9c4c-4f0b-93c0-451a6e171a5e' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 45      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'ce48df10-9c4c-4f0b-93c0-451a6e171a5e' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 46      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '594b5fce-3504-4415-b980-d4efc6c5ae7a' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 47      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '594b5fce-3504-4415-b980-d4efc6c5ae7a' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 48      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '594b5fce-3504-4415-b980-d4efc6c5ae7a' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 49      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'a3cf3533-c759-44e0-acaa-877fb0142089' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 50      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'bb9ace26-ed1c-4bd4-ac5b-04109fe715d3' │ 'Enter'    │ 1                      │ 1             │ 1                    │
    │ 51      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'bb9ace26-ed1c-4bd4-ac5b-04109fe715d3' │ 'Exit'     │ 1                      │ 1             │ 1                    │
    │ 52      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'bb9ace26-ed1c-4bd4-ac5b-04109fe715d3' │ 'Finish'   │ 1                      │ 1             │ 1                    │
    │ 53      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'a3cf3533-c759-44e0-acaa-877fb0142089' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 54      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'a3cf3533-c759-44e0-acaa-877fb0142089' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴────────────────────────────┴───────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌───────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                       │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │ 21   │ 22   │ 23   │ 24   │ 25   │ 26   │ 27   │ 28   │ 29   │ 30   │ 31   │ 32   │ 33   │ 34   │ 35   │ 36   │ 37   │ 38   │ 39   │ 40   │ 41   │ 42   │ 43   │ 44   │ 45   │ 46   │ 47   │ 48   │ 49   │ 50   │ 51   │ 52   │ 53   │ 54   │
    ├───────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ lock-by-instance.test.ts/id:0 obj:Sample/fd8961e1-2762-4664-9b2e-6f30c5a41ef8 │ 'AC' │ 'AD' │      │      │      │      │      │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/cf3a36fb-246e-4eeb-8c12-2c7be491cd6a │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/eefde18a-3120-4fc7-91bb-5f81736b56e7 │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/27696af1-8359-4cc3-98fc-0857364adfea │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/1e70777f-2eb0-45a5-9d3b-95ab2b33e66f │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/2214281f-069b-46d3-a4e9-387da5866d4c │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/438596dd-e81e-4fce-bc27-652e1c95233f │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/ce48df10-9c4c-4f0b-93c0-451a6e171a5e │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/594b5fce-3504-4415-b980-d4efc6c5ae7a │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/a3cf3533-c759-44e0-acaa-877fb0142089 │      │      │      │      │      │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │      │      │      │ 'RE' │ 'FI' │
    │ lock-by-instance.test.ts/id:0 obj:Sample/71ad3583-864d-4b53-b4b0-bd1d9ddc0423 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'EN' │ 'EX' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/3a62d292-e433-4e06-8c07-fc994a9794fd │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'EN' │ 'EX' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/b660c654-d085-4886-8369-344ad5461a12 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'EN' │ 'EX' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/569b00bd-c1c5-409f-bc49-06e95065a599 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'EN' │ 'EX' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/bb9ace26-ed1c-4bd4-ac5b-04109fe715d3 │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │      │ 'EN' │ 'EX' │ 'FI' │      │      │
    └───────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬────────────────────────────┬───────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId                 │ synchronizerId    │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼────────────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2a17a2f1-88fc-4ee7-8050-5231b7286706' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2a17a2f1-88fc-4ee7-8050-5231b7286706' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '7fe09ef9-018f-455b-8f94-fec077358d8a' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'daa4632f-dbac-410e-bb8f-4f9e21717035' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '18b9f615-495e-4419-800e-73947c6c8550' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 5       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'c8680a2c-e2e9-4517-a89d-9306b6f643e7' │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 6       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2a17a2f1-88fc-4ee7-8050-5231b7286706' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 7       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2a17a2f1-88fc-4ee7-8050-5231b7286706' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 8       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '7fe09ef9-018f-455b-8f94-fec077358d8a' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 9       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '7fe09ef9-018f-455b-8f94-fec077358d8a' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 10      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '7fe09ef9-018f-455b-8f94-fec077358d8a' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 11      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'daa4632f-dbac-410e-bb8f-4f9e21717035' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 12      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'daa4632f-dbac-410e-bb8f-4f9e21717035' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 13      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'daa4632f-dbac-410e-bb8f-4f9e21717035' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 14      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '18b9f615-495e-4419-800e-73947c6c8550' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 15      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '18b9f615-495e-4419-800e-73947c6c8550' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 16      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '18b9f615-495e-4419-800e-73947c6c8550' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 17      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'c8680a2c-e2e9-4517-a89d-9306b6f643e7' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 18      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'c8680a2c-e2e9-4517-a89d-9306b6f643e7' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 19      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'c8680a2c-e2e9-4517-a89d-9306b6f643e7' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴────────────────────────────┴───────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌───────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                       │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │
    ├───────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ lock-by-instance.test.ts/id:0 obj:Sample/2a17a2f1-88fc-4ee7-8050-5231b7286706 │ 'AC' │ 'AD' │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/7fe09ef9-018f-455b-8f94-fec077358d8a │      │      │ 'AC' │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/daa4632f-dbac-410e-bb8f-4f9e21717035 │      │      │      │ 'AC' │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/18b9f615-495e-4419-800e-73947c6c8550 │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/c8680a2c-e2e9-4517-a89d-9306b6f643e7 │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │
    └───────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

  console.log
    ┌─────────┬────────────────────────────┬───────────────────┬────────────────────────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ providerId                 │ synchronizerId    │ executionId                            │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼────────────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'b173617d-28d0-409c-a9f4-dccd80d3de1d' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'b173617d-28d0-409c-a9f4-dccd80d3de1d' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 2       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '712e702a-b4b4-4f10-8d42-677304fc4290' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 3       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2d1676f2-f388-4772-aefa-bcc4c4eb457c' │ 'Acquire'  │ 1                      │ 3             │ 1                    │
    │ 4       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '3a73617f-3b1a-41b4-be46-4007b68c90dd' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 5       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '93bb88d1-b18c-4f1e-9bbb-da01f0a704dc' │ 'Acquire'  │ 1                      │ 5             │ 1                    │
    │ 6       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'b173617d-28d0-409c-a9f4-dccd80d3de1d' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 7       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ 'b173617d-28d0-409c-a9f4-dccd80d3de1d' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 8       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '712e702a-b4b4-4f10-8d42-677304fc4290' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 9       │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '712e702a-b4b4-4f10-8d42-677304fc4290' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 10      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '712e702a-b4b4-4f10-8d42-677304fc4290' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 11      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2d1676f2-f388-4772-aefa-bcc4c4eb457c' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 12      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2d1676f2-f388-4772-aefa-bcc4c4eb457c' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 13      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '2d1676f2-f388-4772-aefa-bcc4c4eb457c' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 14      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '3a73617f-3b1a-41b4-be46-4007b68c90dd' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 15      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '3a73617f-3b1a-41b4-be46-4007b68c90dd' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 16      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '3a73617f-3b1a-41b4-be46-4007b68c90dd' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 17      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '93bb88d1-b18c-4f1e-9bbb-da01f0a704dc' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 18      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '93bb88d1-b18c-4f1e-9bbb-da01f0a704dc' │ 'Release'  │ 1                      │ 0             │ 0                    │
    │ 19      │ 'lock-by-instance.test.ts' │ 'id:0 obj:Sample' │ '93bb88d1-b18c-4f1e-9bbb-da01f0a704dc' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴────────────────────────────┴───────────────────┴────────────────────────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:43:17)

  console.log
    ┌───────────────────────────────────────────────────────────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
    │ (index)                                                                       │ 0    │ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │
    ├───────────────────────────────────────────────────────────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
    │ lock-by-instance.test.ts/id:0 obj:Sample/b173617d-28d0-409c-a9f4-dccd80d3de1d │ 'AC' │ 'AD' │      │      │      │      │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/712e702a-b4b4-4f10-8d42-677304fc4290 │      │      │ 'AC' │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/2d1676f2-f388-4772-aefa-bcc4c4eb457c │      │      │      │ 'AC' │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/3a73617f-3b1a-41b4-be46-4007b68c90dd │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │      │      │      │
    │ lock-by-instance.test.ts/id:0 obj:Sample/93bb88d1-b18c-4f1e-9bbb-da01f0a704dc │      │      │      │      │      │ 'AC' │      │      │      │      │      │      │      │      │      │      │      │ 'AD' │ 'RE' │ 'FI' │
    └───────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

      at StateTransitionChecker.dump (test/StateTransitionChecker.ts:52:17)

 */