import {SynchronizerEvent, SynchronizerProvider} from "../../src";
import {sleep} from "../utils";

const prefix = "Lock By Instance"
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
            synchronizerId: i.context.synchronizerId,
            // executionId: i.context.executionId,
            type: i.type,
            maxConcurrentExecution: i.stats.maxConcurrentExecution,
            numberOfTasks: i.stats.numberOfTasks,
            numberOfRunningTasks: i.stats.numberOfRunningTasks,
        })))
        events = []
    })

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

    test("without lock", async () => {

        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 10; i++) {
            tasks.push(t.increment())
        }
        await Promise.all(tasks)
        expect(t.count).toBe(1)
    })

    test("with synchronized method", async () => {

        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 10; i++) {
            tasks.push(t.incrementWithLock())
        }
        await Promise.all(tasks)
        expect(t.count).toBe(10)
    })

    test("with external synchronizer", async () => {
        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 10; i++) {
            tasks.push(sp.forObject(t).synchronized(async () => {
                await t.increment()
            }))
        }
        await Promise.all(tasks)
        expect(t.count).toBe(10)
    })

    test.concurrent("with synchronized method and external synchronizer", async () => {
        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 10; i++) {
            // Synchronizer provider returns same synchronizer for same object
            tasks.push(t.incrementWithLock())
            tasks.push(sp.forObject(t).synchronized(async () => {
                await t.increment()
                await t.incrementWithLock()
            }))
        }
        await Promise.all(tasks)
        expect(t.count).toBe(30)
    })

})

/*

> ya-syn@1.0.0 test
> jest --verbose test/samples/lock-by-instance.test.ts

  console.log
    ┌─────────┬───────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ synchronizerId    │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼───────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 2       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 3             │ 0                    │
    │ 3       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 4             │ 0                    │
    │ 4       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 5             │ 0                    │
    │ 5       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 6             │ 0                    │
    │ 6       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 7             │ 0                    │
    │ 7       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 8             │ 0                    │
    │ 8       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 9             │ 0                    │
    │ 9       │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 10            │ 0                    │
    │ 10      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 11            │ 0                    │
    │ 11      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 12            │ 0                    │
    │ 12      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 13            │ 0                    │
    │ 13      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 14            │ 0                    │
    │ 14      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 15            │ 0                    │
    │ 15      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 16            │ 0                    │
    │ 16      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 17            │ 0                    │
    │ 17      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 18            │ 0                    │
    │ 18      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 19            │ 0                    │
    │ 19      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 20            │ 0                    │
    │ 20      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 20            │ 1                    │
    │ 21      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 20            │ 0                    │
    │ 22      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 19            │ 0                    │
    │ 23      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 19            │ 1                    │
    │ 24      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 20            │ 1                    │
    │ 25      │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 20            │ 1                    │
    │ 26      │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 20            │ 1                    │
    │ 27      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 19            │ 1                    │
    │ 28      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 19            │ 0                    │
    │ 29      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 18            │ 0                    │
    │ 30      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 18            │ 1                    │
    │ 31      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 18            │ 0                    │
    │ 32      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 17            │ 0                    │
    │ 33      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 17            │ 1                    │
    │ 34      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 18            │ 1                    │
    │ 35      │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 18            │ 1                    │
    │ 36      │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 18            │ 1                    │
    │ 37      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 17            │ 1                    │
    │ 38      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 17            │ 0                    │
    │ 39      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 16            │ 0                    │
    │ 40      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 16            │ 1                    │
    │ 41      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 16            │ 0                    │
    │ 42      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 15            │ 0                    │
    │ 43      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 15            │ 1                    │
    │ 44      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 16            │ 1                    │
    │ 45      │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 16            │ 1                    │
    │ 46      │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 16            │ 1                    │
    │ 47      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 15            │ 1                    │
    │ 48      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 15            │ 0                    │
    │ 49      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 14            │ 0                    │
    │ 50      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 14            │ 1                    │
    │ 51      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 14            │ 0                    │
    │ 52      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 13            │ 0                    │
    │ 53      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 13            │ 1                    │
    │ 54      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 14            │ 1                    │
    │ 55      │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 14            │ 1                    │
    │ 56      │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 14            │ 1                    │
    │ 57      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 13            │ 1                    │
    │ 58      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 13            │ 0                    │
    │ 59      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 12            │ 0                    │
    │ 60      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 12            │ 1                    │
    │ 61      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 12            │ 0                    │
    │ 62      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 11            │ 0                    │
    │ 63      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 11            │ 1                    │
    │ 64      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 12            │ 1                    │
    │ 65      │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 12            │ 1                    │
    │ 66      │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 12            │ 1                    │
    │ 67      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 11            │ 1                    │
    │ 68      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 11            │ 0                    │
    │ 69      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 10            │ 0                    │
    │ 70      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 10            │ 1                    │
    │ 71      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 10            │ 0                    │
    │ 72      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 9             │ 0                    │
    │ 73      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 9             │ 1                    │
    │ 74      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 10            │ 1                    │
    │ 75      │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 10            │ 1                    │
    │ 76      │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 10            │ 1                    │
    │ 77      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 9             │ 1                    │
    │ 78      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 9             │ 0                    │
    │ 79      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 8             │ 0                    │
    │ 80      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 8             │ 1                    │
    │ 81      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 8             │ 0                    │
    │ 82      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 7             │ 0                    │
    │ 83      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 7             │ 1                    │
    │ 84      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 8             │ 1                    │
    │ 85      │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 8             │ 1                    │
    │ 86      │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 8             │ 1                    │
    │ 87      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 7             │ 1                    │
    │ 88      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 7             │ 0                    │
    │ 89      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 6             │ 0                    │
    │ 90      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 6             │ 1                    │
    │ 91      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 6             │ 0                    │
    │ 92      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 5             │ 0                    │
    │ 93      │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 5             │ 1                    │
    │ 94      │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 6             │ 1                    │
    │ 95      │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 6             │ 1                    │
    │ 96      │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 6             │ 1                    │
    │ 97      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 5             │ 1                    │
    │ 98      │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 5             │ 0                    │
    │ 99      │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 100     │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 101     │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 102     │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 103     │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 104     │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 4             │ 1                    │
    │ 105     │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 4             │ 1                    │
    │ 106     │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 4             │ 1                    │
    │ 107     │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 3             │ 1                    │
    │ 108     │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 109     │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 110     │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 111     │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 112     │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 113     │ 'id:0 obj:Sample' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 114     │ 'id:0 obj:Sample' │ 'Acquire'  │ 1                      │ 2             │ 1                    │
    │ 115     │ 'id:0 obj:Sample' │ 'Enter'    │ 1                      │ 2             │ 1                    │
    │ 116     │ 'id:0 obj:Sample' │ 'Exit'     │ 1                      │ 2             │ 1                    │
    │ 117     │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 1             │ 1                    │
    │ 118     │ 'id:0 obj:Sample' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 119     │ 'id:0 obj:Sample' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴───────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/lock-by-instance.test.ts:16:17)

  console.log
    ┌─────────┬───────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ synchronizerId    │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼───────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 2       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 3             │ 0                    │
    │ 3       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 4             │ 0                    │
    │ 4       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 5             │ 0                    │
    │ 5       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 6             │ 0                    │
    │ 6       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 7             │ 0                    │
    │ 7       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 8             │ 0                    │
    │ 8       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 9             │ 0                    │
    │ 9       │ 'id:1 obj:Sample' │ 'Acquire'  │ 1                      │ 10            │ 0                    │
    │ 10      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 10            │ 1                    │
    │ 11      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 10            │ 0                    │
    │ 12      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 9             │ 0                    │
    │ 13      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 9             │ 1                    │
    │ 14      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 9             │ 0                    │
    │ 15      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 8             │ 0                    │
    │ 16      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 8             │ 1                    │
    │ 17      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 8             │ 0                    │
    │ 18      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 7             │ 0                    │
    │ 19      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 7             │ 1                    │
    │ 20      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 7             │ 0                    │
    │ 21      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 6             │ 0                    │
    │ 22      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 6             │ 1                    │
    │ 23      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 6             │ 0                    │
    │ 24      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 5             │ 0                    │
    │ 25      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 5             │ 1                    │
    │ 26      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 5             │ 0                    │
    │ 27      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 28      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 29      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 30      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 31      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 32      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 33      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 34      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 35      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 36      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 37      │ 'id:1 obj:Sample' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 38      │ 'id:1 obj:Sample' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 39      │ 'id:1 obj:Sample' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴───────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/lock-by-instance.test.ts:16:17)

  console.log
    ┌─────────┬───────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ synchronizerId    │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼───────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 2       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 3             │ 0                    │
    │ 3       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 4             │ 0                    │
    │ 4       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 5             │ 0                    │
    │ 5       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 6             │ 0                    │
    │ 6       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 7             │ 0                    │
    │ 7       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 8             │ 0                    │
    │ 8       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 9             │ 0                    │
    │ 9       │ 'id:2 obj:Sample' │ 'Acquire'  │ 1                      │ 10            │ 0                    │
    │ 10      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 10            │ 1                    │
    │ 11      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 10            │ 0                    │
    │ 12      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 9             │ 0                    │
    │ 13      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 9             │ 1                    │
    │ 14      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 9             │ 0                    │
    │ 15      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 8             │ 0                    │
    │ 16      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 8             │ 1                    │
    │ 17      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 8             │ 0                    │
    │ 18      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 7             │ 0                    │
    │ 19      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 7             │ 1                    │
    │ 20      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 7             │ 0                    │
    │ 21      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 6             │ 0                    │
    │ 22      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 6             │ 1                    │
    │ 23      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 6             │ 0                    │
    │ 24      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 5             │ 0                    │
    │ 25      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 5             │ 1                    │
    │ 26      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 5             │ 0                    │
    │ 27      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 28      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 29      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 30      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 31      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 32      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 33      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 34      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 35      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 36      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 37      │ 'id:2 obj:Sample' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 38      │ 'id:2 obj:Sample' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 39      │ 'id:2 obj:Sample' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴───────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/lock-by-instance.test.ts:16:17)

 */