import {createSynchronizerProvider} from "../utils";
import {mergeAsyncGenerators} from "../../src";

describe("batch-execute", () => {

    test.concurrent("regular case", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        await sp.executeTasks({
            executorId: "",
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
            taskExecutor: async ({executionId}) => {
                await new Promise(r => setTimeout(r, 50))
                console.log(`${executionId}:executed`)
            }
        })
        await checker.dumpLater()
    })

    test.concurrent("regular case with mergeAsyncGenerators", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        await sp.executeTasks({
            executorId: "",
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
            taskExecutor: async ({executionId}) => {
                await new Promise(r => setTimeout(r, 50))
                console.log(`${executionId}:executed`)
            }
        })
        await checker.dumpLater()
    })

    test.concurrent("no maxTasksInExecution", async () => {
        const {checker, sp} = createSynchronizerProvider(__filename)
        await sp.executeTasks({
            executorId: "",
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
            taskExecutor: async ({executionId}) => {
                await new Promise(r => setTimeout(r, 50))
                console.log(`${executionId}:executed`)
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
            executorId: "",
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
            executorId: "",
            maxTasksInFlight: 3,
            maxTasksInExecution: 2,
            taskSource: async function* () {
                throw testError
            }(),
            taskExecutor: async ({executionId}) => {
                console.log(`${executionId}:executed`)
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