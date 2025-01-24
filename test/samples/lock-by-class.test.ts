import {sleep} from "../utils";
import {SynchronizerEvent, SynchronizerProvider} from "../../src";

const prefix = "Lock By Class"
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
            return sp.forObject(Sample).synchronized(async () => {
                const count = this.count
                await new Promise(resolve => setTimeout(resolve, 10))
                this.count = count + 1
            })
        }
    }

    test("Lock By Class", async () => {
        const t = new Sample()
        const tasks: Promise<void>[] = []
        for (let i = 0; i < 100; i++) {
            tasks.push(t.increment())
        }
        await Promise.all(tasks)
        expect(t.count).toBe(100)
    })

})


/*

> ya-syn@1.0.0 test
> jest --verbose test/samples/lock-by-class.test.ts

  console.log
    ┌─────────┬─────────────────────┬────────────┬────────────────────────┬───────────────┬──────────────────────┐
    │ (index) │ synchronizerId      │ type       │ maxConcurrentExecution │ numberOfTasks │ numberOfRunningTasks │
    ├─────────┼─────────────────────┼────────────┼────────────────────────┼───────────────┼──────────────────────┤
    │ 0       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 1             │ 0                    │
    │ 1       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 2             │ 0                    │
    │ 2       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 3             │ 0                    │
    │ 3       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 4             │ 0                    │
    │ 4       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 5             │ 0                    │
    │ 5       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 6             │ 0                    │
    │ 6       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 7             │ 0                    │
    │ 7       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 8             │ 0                    │
    │ 8       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 9             │ 0                    │
    │ 9       │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 10            │ 0                    │
    │ 10      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 11            │ 0                    │
    │ 11      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 12            │ 0                    │
    │ 12      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 13            │ 0                    │
    │ 13      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 14            │ 0                    │
    │ 14      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 15            │ 0                    │
    │ 15      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 16            │ 0                    │
    │ 16      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 17            │ 0                    │
    │ 17      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 18            │ 0                    │
    │ 18      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 19            │ 0                    │
    │ 19      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 20            │ 0                    │
    │ 20      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 21            │ 0                    │
    │ 21      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 22            │ 0                    │
    │ 22      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 23            │ 0                    │
    │ 23      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 24            │ 0                    │
    │ 24      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 25            │ 0                    │
    │ 25      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 26            │ 0                    │
    │ 26      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 27            │ 0                    │
    │ 27      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 28            │ 0                    │
    │ 28      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 29            │ 0                    │
    │ 29      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 30            │ 0                    │
    │ 30      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 31            │ 0                    │
    │ 31      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 32            │ 0                    │
    │ 32      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 33            │ 0                    │
    │ 33      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 34            │ 0                    │
    │ 34      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 35            │ 0                    │
    │ 35      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 36            │ 0                    │
    │ 36      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 37            │ 0                    │
    │ 37      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 38            │ 0                    │
    │ 38      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 39            │ 0                    │
    │ 39      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 40            │ 0                    │
    │ 40      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 41            │ 0                    │
    │ 41      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 42            │ 0                    │
    │ 42      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 43            │ 0                    │
    │ 43      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 44            │ 0                    │
    │ 44      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 45            │ 0                    │
    │ 45      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 46            │ 0                    │
    │ 46      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 47            │ 0                    │
    │ 47      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 48            │ 0                    │
    │ 48      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 49            │ 0                    │
    │ 49      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 50            │ 0                    │
    │ 50      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 51            │ 0                    │
    │ 51      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 52            │ 0                    │
    │ 52      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 53            │ 0                    │
    │ 53      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 54            │ 0                    │
    │ 54      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 55            │ 0                    │
    │ 55      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 56            │ 0                    │
    │ 56      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 57            │ 0                    │
    │ 57      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 58            │ 0                    │
    │ 58      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 59            │ 0                    │
    │ 59      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 60            │ 0                    │
    │ 60      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 61            │ 0                    │
    │ 61      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 62            │ 0                    │
    │ 62      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 63            │ 0                    │
    │ 63      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 64            │ 0                    │
    │ 64      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 65            │ 0                    │
    │ 65      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 66            │ 0                    │
    │ 66      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 67            │ 0                    │
    │ 67      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 68            │ 0                    │
    │ 68      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 69            │ 0                    │
    │ 69      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 70            │ 0                    │
    │ 70      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 71            │ 0                    │
    │ 71      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 72            │ 0                    │
    │ 72      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 73            │ 0                    │
    │ 73      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 74            │ 0                    │
    │ 74      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 75            │ 0                    │
    │ 75      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 76            │ 0                    │
    │ 76      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 77            │ 0                    │
    │ 77      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 78            │ 0                    │
    │ 78      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 79            │ 0                    │
    │ 79      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 80            │ 0                    │
    │ 80      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 81            │ 0                    │
    │ 81      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 82            │ 0                    │
    │ 82      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 83            │ 0                    │
    │ 83      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 84            │ 0                    │
    │ 84      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 85            │ 0                    │
    │ 85      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 86            │ 0                    │
    │ 86      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 87            │ 0                    │
    │ 87      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 88            │ 0                    │
    │ 88      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 89            │ 0                    │
    │ 89      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 90            │ 0                    │
    │ 90      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 91            │ 0                    │
    │ 91      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 92            │ 0                    │
    │ 92      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 93            │ 0                    │
    │ 93      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 94            │ 0                    │
    │ 94      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 95            │ 0                    │
    │ 95      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 96            │ 0                    │
    │ 96      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 97            │ 0                    │
    │ 97      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 98            │ 0                    │
    │ 98      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 99            │ 0                    │
    │ 99      │ 'id:0 obj:Function' │ 'Acquire'  │ 1                      │ 100           │ 0                    │
    │ 100     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 100           │ 1                    │
    │ 101     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 100           │ 0                    │
    │ 102     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 99            │ 0                    │
    │ 103     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 99            │ 1                    │
    │ 104     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 99            │ 0                    │
    │ 105     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 98            │ 0                    │
    │ 106     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 98            │ 1                    │
    │ 107     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 98            │ 0                    │
    │ 108     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 97            │ 0                    │
    │ 109     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 97            │ 1                    │
    │ 110     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 97            │ 0                    │
    │ 111     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 96            │ 0                    │
    │ 112     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 96            │ 1                    │
    │ 113     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 96            │ 0                    │
    │ 114     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 95            │ 0                    │
    │ 115     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 95            │ 1                    │
    │ 116     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 95            │ 0                    │
    │ 117     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 94            │ 0                    │
    │ 118     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 94            │ 1                    │
    │ 119     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 94            │ 0                    │
    │ 120     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 93            │ 0                    │
    │ 121     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 93            │ 1                    │
    │ 122     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 93            │ 0                    │
    │ 123     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 92            │ 0                    │
    │ 124     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 92            │ 1                    │
    │ 125     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 92            │ 0                    │
    │ 126     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 91            │ 0                    │
    │ 127     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 91            │ 1                    │
    │ 128     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 91            │ 0                    │
    │ 129     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 90            │ 0                    │
    │ 130     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 90            │ 1                    │
    │ 131     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 90            │ 0                    │
    │ 132     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 89            │ 0                    │
    │ 133     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 89            │ 1                    │
    │ 134     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 89            │ 0                    │
    │ 135     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 88            │ 0                    │
    │ 136     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 88            │ 1                    │
    │ 137     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 88            │ 0                    │
    │ 138     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 87            │ 0                    │
    │ 139     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 87            │ 1                    │
    │ 140     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 87            │ 0                    │
    │ 141     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 86            │ 0                    │
    │ 142     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 86            │ 1                    │
    │ 143     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 86            │ 0                    │
    │ 144     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 85            │ 0                    │
    │ 145     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 85            │ 1                    │
    │ 146     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 85            │ 0                    │
    │ 147     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 84            │ 0                    │
    │ 148     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 84            │ 1                    │
    │ 149     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 84            │ 0                    │
    │ 150     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 83            │ 0                    │
    │ 151     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 83            │ 1                    │
    │ 152     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 83            │ 0                    │
    │ 153     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 82            │ 0                    │
    │ 154     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 82            │ 1                    │
    │ 155     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 82            │ 0                    │
    │ 156     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 81            │ 0                    │
    │ 157     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 81            │ 1                    │
    │ 158     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 81            │ 0                    │
    │ 159     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 80            │ 0                    │
    │ 160     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 80            │ 1                    │
    │ 161     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 80            │ 0                    │
    │ 162     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 79            │ 0                    │
    │ 163     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 79            │ 1                    │
    │ 164     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 79            │ 0                    │
    │ 165     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 78            │ 0                    │
    │ 166     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 78            │ 1                    │
    │ 167     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 78            │ 0                    │
    │ 168     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 77            │ 0                    │
    │ 169     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 77            │ 1                    │
    │ 170     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 77            │ 0                    │
    │ 171     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 76            │ 0                    │
    │ 172     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 76            │ 1                    │
    │ 173     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 76            │ 0                    │
    │ 174     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 75            │ 0                    │
    │ 175     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 75            │ 1                    │
    │ 176     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 75            │ 0                    │
    │ 177     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 74            │ 0                    │
    │ 178     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 74            │ 1                    │
    │ 179     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 74            │ 0                    │
    │ 180     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 73            │ 0                    │
    │ 181     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 73            │ 1                    │
    │ 182     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 73            │ 0                    │
    │ 183     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 72            │ 0                    │
    │ 184     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 72            │ 1                    │
    │ 185     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 72            │ 0                    │
    │ 186     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 71            │ 0                    │
    │ 187     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 71            │ 1                    │
    │ 188     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 71            │ 0                    │
    │ 189     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 70            │ 0                    │
    │ 190     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 70            │ 1                    │
    │ 191     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 70            │ 0                    │
    │ 192     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 69            │ 0                    │
    │ 193     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 69            │ 1                    │
    │ 194     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 69            │ 0                    │
    │ 195     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 68            │ 0                    │
    │ 196     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 68            │ 1                    │
    │ 197     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 68            │ 0                    │
    │ 198     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 67            │ 0                    │
    │ 199     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 67            │ 1                    │
    │ 200     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 67            │ 0                    │
    │ 201     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 66            │ 0                    │
    │ 202     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 66            │ 1                    │
    │ 203     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 66            │ 0                    │
    │ 204     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 65            │ 0                    │
    │ 205     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 65            │ 1                    │
    │ 206     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 65            │ 0                    │
    │ 207     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 64            │ 0                    │
    │ 208     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 64            │ 1                    │
    │ 209     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 64            │ 0                    │
    │ 210     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 63            │ 0                    │
    │ 211     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 63            │ 1                    │
    │ 212     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 63            │ 0                    │
    │ 213     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 62            │ 0                    │
    │ 214     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 62            │ 1                    │
    │ 215     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 62            │ 0                    │
    │ 216     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 61            │ 0                    │
    │ 217     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 61            │ 1                    │
    │ 218     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 61            │ 0                    │
    │ 219     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 60            │ 0                    │
    │ 220     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 60            │ 1                    │
    │ 221     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 60            │ 0                    │
    │ 222     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 59            │ 0                    │
    │ 223     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 59            │ 1                    │
    │ 224     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 59            │ 0                    │
    │ 225     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 58            │ 0                    │
    │ 226     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 58            │ 1                    │
    │ 227     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 58            │ 0                    │
    │ 228     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 57            │ 0                    │
    │ 229     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 57            │ 1                    │
    │ 230     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 57            │ 0                    │
    │ 231     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 56            │ 0                    │
    │ 232     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 56            │ 1                    │
    │ 233     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 56            │ 0                    │
    │ 234     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 55            │ 0                    │
    │ 235     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 55            │ 1                    │
    │ 236     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 55            │ 0                    │
    │ 237     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 54            │ 0                    │
    │ 238     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 54            │ 1                    │
    │ 239     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 54            │ 0                    │
    │ 240     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 53            │ 0                    │
    │ 241     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 53            │ 1                    │
    │ 242     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 53            │ 0                    │
    │ 243     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 52            │ 0                    │
    │ 244     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 52            │ 1                    │
    │ 245     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 52            │ 0                    │
    │ 246     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 51            │ 0                    │
    │ 247     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 51            │ 1                    │
    │ 248     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 51            │ 0                    │
    │ 249     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 50            │ 0                    │
    │ 250     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 50            │ 1                    │
    │ 251     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 50            │ 0                    │
    │ 252     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 49            │ 0                    │
    │ 253     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 49            │ 1                    │
    │ 254     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 49            │ 0                    │
    │ 255     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 48            │ 0                    │
    │ 256     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 48            │ 1                    │
    │ 257     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 48            │ 0                    │
    │ 258     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 47            │ 0                    │
    │ 259     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 47            │ 1                    │
    │ 260     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 47            │ 0                    │
    │ 261     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 46            │ 0                    │
    │ 262     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 46            │ 1                    │
    │ 263     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 46            │ 0                    │
    │ 264     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 45            │ 0                    │
    │ 265     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 45            │ 1                    │
    │ 266     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 45            │ 0                    │
    │ 267     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 44            │ 0                    │
    │ 268     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 44            │ 1                    │
    │ 269     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 44            │ 0                    │
    │ 270     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 43            │ 0                    │
    │ 271     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 43            │ 1                    │
    │ 272     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 43            │ 0                    │
    │ 273     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 42            │ 0                    │
    │ 274     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 42            │ 1                    │
    │ 275     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 42            │ 0                    │
    │ 276     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 41            │ 0                    │
    │ 277     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 41            │ 1                    │
    │ 278     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 41            │ 0                    │
    │ 279     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 40            │ 0                    │
    │ 280     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 40            │ 1                    │
    │ 281     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 40            │ 0                    │
    │ 282     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 39            │ 0                    │
    │ 283     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 39            │ 1                    │
    │ 284     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 39            │ 0                    │
    │ 285     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 38            │ 0                    │
    │ 286     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 38            │ 1                    │
    │ 287     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 38            │ 0                    │
    │ 288     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 37            │ 0                    │
    │ 289     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 37            │ 1                    │
    │ 290     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 37            │ 0                    │
    │ 291     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 36            │ 0                    │
    │ 292     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 36            │ 1                    │
    │ 293     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 36            │ 0                    │
    │ 294     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 35            │ 0                    │
    │ 295     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 35            │ 1                    │
    │ 296     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 35            │ 0                    │
    │ 297     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 34            │ 0                    │
    │ 298     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 34            │ 1                    │
    │ 299     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 34            │ 0                    │
    │ 300     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 33            │ 0                    │
    │ 301     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 33            │ 1                    │
    │ 302     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 33            │ 0                    │
    │ 303     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 32            │ 0                    │
    │ 304     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 32            │ 1                    │
    │ 305     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 32            │ 0                    │
    │ 306     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 31            │ 0                    │
    │ 307     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 31            │ 1                    │
    │ 308     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 31            │ 0                    │
    │ 309     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 30            │ 0                    │
    │ 310     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 30            │ 1                    │
    │ 311     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 30            │ 0                    │
    │ 312     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 29            │ 0                    │
    │ 313     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 29            │ 1                    │
    │ 314     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 29            │ 0                    │
    │ 315     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 28            │ 0                    │
    │ 316     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 28            │ 1                    │
    │ 317     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 28            │ 0                    │
    │ 318     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 27            │ 0                    │
    │ 319     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 27            │ 1                    │
    │ 320     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 27            │ 0                    │
    │ 321     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 26            │ 0                    │
    │ 322     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 26            │ 1                    │
    │ 323     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 26            │ 0                    │
    │ 324     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 25            │ 0                    │
    │ 325     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 25            │ 1                    │
    │ 326     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 25            │ 0                    │
    │ 327     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 24            │ 0                    │
    │ 328     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 24            │ 1                    │
    │ 329     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 24            │ 0                    │
    │ 330     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 23            │ 0                    │
    │ 331     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 23            │ 1                    │
    │ 332     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 23            │ 0                    │
    │ 333     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 22            │ 0                    │
    │ 334     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 22            │ 1                    │
    │ 335     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 22            │ 0                    │
    │ 336     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 21            │ 0                    │
    │ 337     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 21            │ 1                    │
    │ 338     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 21            │ 0                    │
    │ 339     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 20            │ 0                    │
    │ 340     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 20            │ 1                    │
    │ 341     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 20            │ 0                    │
    │ 342     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 19            │ 0                    │
    │ 343     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 19            │ 1                    │
    │ 344     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 19            │ 0                    │
    │ 345     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 18            │ 0                    │
    │ 346     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 18            │ 1                    │
    │ 347     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 18            │ 0                    │
    │ 348     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 17            │ 0                    │
    │ 349     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 17            │ 1                    │
    │ 350     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 17            │ 0                    │
    │ 351     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 16            │ 0                    │
    │ 352     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 16            │ 1                    │
    │ 353     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 16            │ 0                    │
    │ 354     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 15            │ 0                    │
    │ 355     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 15            │ 1                    │
    │ 356     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 15            │ 0                    │
    │ 357     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 14            │ 0                    │
    │ 358     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 14            │ 1                    │
    │ 359     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 14            │ 0                    │
    │ 360     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 13            │ 0                    │
    │ 361     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 13            │ 1                    │
    │ 362     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 13            │ 0                    │
    │ 363     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 12            │ 0                    │
    │ 364     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 12            │ 1                    │
    │ 365     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 12            │ 0                    │
    │ 366     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 11            │ 0                    │
    │ 367     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 11            │ 1                    │
    │ 368     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 11            │ 0                    │
    │ 369     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 10            │ 0                    │
    │ 370     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 10            │ 1                    │
    │ 371     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 10            │ 0                    │
    │ 372     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 9             │ 0                    │
    │ 373     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 9             │ 1                    │
    │ 374     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 9             │ 0                    │
    │ 375     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 8             │ 0                    │
    │ 376     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 8             │ 1                    │
    │ 377     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 8             │ 0                    │
    │ 378     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 7             │ 0                    │
    │ 379     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 7             │ 1                    │
    │ 380     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 7             │ 0                    │
    │ 381     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 6             │ 0                    │
    │ 382     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 6             │ 1                    │
    │ 383     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 6             │ 0                    │
    │ 384     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 5             │ 0                    │
    │ 385     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 5             │ 1                    │
    │ 386     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 5             │ 0                    │
    │ 387     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 4             │ 0                    │
    │ 388     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 4             │ 1                    │
    │ 389     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 4             │ 0                    │
    │ 390     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 3             │ 0                    │
    │ 391     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 3             │ 1                    │
    │ 392     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 3             │ 0                    │
    │ 393     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 2             │ 0                    │
    │ 394     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 2             │ 1                    │
    │ 395     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 2             │ 0                    │
    │ 396     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 1             │ 0                    │
    │ 397     │ 'id:0 obj:Function' │ 'Acquired' │ 1                      │ 1             │ 1                    │
    │ 398     │ 'id:0 obj:Function' │ 'Release'  │ 1                      │ 1             │ 0                    │
    │ 399     │ 'id:0 obj:Function' │ 'Finish'   │ 1                      │ 0             │ 0                    │
    └─────────┴─────────────────────┴────────────┴────────────────────────┴───────────────┴──────────────────────┘

      at Object.<anonymous> (test/samples/lock-by-class.test.ts:16:17)

 */