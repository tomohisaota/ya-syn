import {createSynchronizerProvider} from "../utils";
import {mergeAsyncGenerators, TokenBucket, LeakyBucket} from "../../src";

describe("batch-execute", () => {

    test.concurrent("regular case", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        await sp.executeTasks({
            maxTasksInFlight: 3,
            maxTasksInExecution: 2,
            taskSource: async function* () {
                for (let batch = 0; batch < 2; batch++) {
                    for (let loop = 0; loop < 3; loop++) {
                        const executionId = `${batch}:${loop}`
                        console.log(`${executionId}:queue`)
                        yield {
                            executionId,
                            task: {batch, loop}
                        }
                    }
                }
            }(),
            taskExecutor: async ({}) => {
                await new Promise((r):void => {
                    setTimeout(r, 50)
                })
            }
        })
        await checker.dumpLater()
    })

    test.concurrent("regular case with mergeAsyncGenerators", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        await sp.executeTasks({
            maxTasksInFlight: 3,
            maxTasksInExecution: 2,
            taskSource: mergeAsyncGenerators([
                async function* () {
                    for (let batch = 0; batch < 2; batch++) {
                        for (let loop = 0; loop < 3; loop++) {
                            const executionId = `${batch}:${loop}`
                            console.log(`${executionId}:queue`)
                            yield {
                                executionId,
                                task: {batch, loop}
                            }
                        }
                    }
                }(),
            ]),
            taskExecutor: async ({}) => {
                await new Promise((r):void => {
                    setTimeout(r, 50)
                })
            }
        })
        await checker.dumpLater()
    })

    test.concurrent("no maxTasksInExecution", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        await sp.executeTasks({
            maxTasksInFlight: 3,
            taskSource: async function* () {
                for (let batch = 0; batch < 2; batch++) {
                    for (let loop = 0; loop < 3; loop++) {
                        const executionId = `${batch}:${loop}`
                        console.log(`${executionId}:queue`)
                        yield {
                            executionId,
                            task: {batch, loop}
                        }
                    }
                }
            }(),
            taskExecutor: async ({}) => {
                await new Promise(r => setTimeout(r, 50))
            }
        })
        await checker.dumpLater()
    })


    test.concurrent("error in taskSource should throw error to top level", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        const testError = new Error("test")
        let successCount = 0
        let errorCount = 0
        const numOfTasks = 10
        await sp.executeTasks({
            maxTasksInFlight: 3,
            maxTasksInExecution: 2,
            taskSource: async function* () {
                for (let count = 0; count < numOfTasks; count++) {
                    yield {
                        executionId: `c:${count}`,
                        task: count
                    }
                }
            }(),
            taskExecutor: async ({task}) => {
                // half of tasks should fail
                if (task % 2 === 0) {
                    // call onTaskError
                    throw testError
                }
                successCount++
            },
            onTaskError: () => {
                errorCount++
            }
        })
        expect(successCount).toBe(numOfTasks / 2)
        expect(errorCount).toBe(numOfTasks / 2)
        await checker.dumpLater()
    })

    test.concurrent("error in taskExecutor should not throw error to top level", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        const testError = new Error("test")
        await expect(sp.executeTasks({
            maxTasksInFlight: 3,
            maxTasksInExecution: 2,
            taskSource: async function* () {
                throw testError
            }(),
            taskExecutor: async ({}) => {
                console.log(`executed`)
            }
        })).rejects.toThrow(testError)
        await checker.dumpLater()
    })

    test.concurrent("1000 tasks", async () => {
        /*
        1000 times takes about 0.5 sec to execute
        0.5 msec per execution
         */
        const {sp} = createSynchronizerProvider(__filename)
        const numOfTasks = 1000
        let count = 0
        await sp.executeTasks({
            maxTasksInFlight: 3,
            taskSource: async function* () {
                for (let count = 0; count < numOfTasks; count++) {
                    yield {
                        executionId: `c:${count}`,
                        task: count
                    }
                }
            }(),
            taskExecutor: async () => {
                await new Promise(r => setTimeout(r, 1))
                count++
            }
        })
        expect(count).toBe(numOfTasks)
    })

    test.concurrent("no tasks", async () => {
        /*
        1000 times takes about 1.2 sec to execute
        1.2 msec per execution
         */
        const {sp} = createSynchronizerProvider(__filename)
        const numOfTasks = 0
        let count = 0
        await sp.executeTasks({
            maxTasksInFlight: 3,
            maxTasksInExecution: 2,
            taskSource: async function* () {
                for (let count = 0; count < numOfTasks; count++) {
                    yield {
                        executionId: `c:${count}`,
                        task: count
                    }
                }
            }(),
            taskExecutor: async () => {
                count++
                // console.log(`${executionId}:executed`)
            }
        })
        expect(count).toBe(numOfTasks)
    })
})

describe("batch-execute with bucket", () => {

    test.concurrent("with TokenBucket - rate limiting", async () => {
        const {sp} = createSynchronizerProvider(__filename)
        const bucket = new TokenBucket({
            capacity: 5,
            refillRate: 5,
            refillInterval: 500,  // 5 tokens per 500ms = 10/sec
            initialTokens: 5
        })

        const numOfTasks = 10
        let count = 0
        const start = Date.now()

        await sp.executeTasks({
            maxTasksInFlight: 10,
            bucket,
            taskSource: async function* () {
                for (let i = 0; i < numOfTasks; i++) {
                    yield {task: i}
                }
            }(),
            taskExecutor: async () => {
                count++
            }
        })

        const elapsed = Date.now() - start
        expect(count).toBe(numOfTasks)
        // First 5 tasks use initial tokens, then wait 500ms for refill
        expect(elapsed).toBeGreaterThanOrEqual(400)
        expect(elapsed).toBeLessThan(800)
    })

    test.concurrent("with LeakyBucket - steady rate", async () => {
        const {sp} = createSynchronizerProvider(__filename)
        const bucket = new LeakyBucket({
            leakRate: 10,
            leakInterval: 1000  // 10 per second = 100ms interval
        })

        const numOfTasks = 5
        const timestamps: number[] = []
        const start = Date.now()

        await sp.executeTasks({
            maxTasksInFlight: 10,
            bucket,
            taskSource: async function* () {
                for (let i = 0; i < numOfTasks; i++) {
                    yield {task: i}
                }
            }(),
            taskExecutor: async () => {
                timestamps.push(Date.now() - start)
            }
        })

        expect(timestamps.length).toBe(numOfTasks)
        // LeakyBucket enforces steady rate: ~0, ~100, ~200, ~300, ~400
        expect(timestamps[0]).toBeLessThan(50)
        for (let i = 1; i < timestamps.length; i++) {
            const interval = timestamps[i] - timestamps[i - 1]
            expect(interval).toBeGreaterThanOrEqual(80)
        }
    })

    test.concurrent("bucket with maxTasksInExecution", async () => {
        const {sp} = createSynchronizerProvider(__filename)
        const bucket = new TokenBucket({
            capacity: 10,
            refillRate: 10,
            refillInterval: 100,
            initialTokens: 10
        })

        const numOfTasks = 6
        let maxConcurrent = 0
        let currentConcurrent = 0

        await sp.executeTasks({
            maxTasksInFlight: 10,
            maxTasksInExecution: 2,  // Only 2 can execute at once
            bucket,
            taskSource: async function* () {
                for (let i = 0; i < numOfTasks; i++) {
                    yield {task: i}
                }
            }(),
            taskExecutor: async () => {
                currentConcurrent++
                maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
                await new Promise(r => setTimeout(r, 50))
                currentConcurrent--
            }
        })

        // maxTasksInExecution should limit concurrent execution to 2
        expect(maxConcurrent).toBe(2)
    })
})