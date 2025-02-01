import {SynchronizerProvider} from "./SynchronizerProvider";
import {SynchronizerTaskExecutorParams} from "./types";
import {Synchronizer} from "./Synchronizer";

/*
Adjust wait time when hitting maxTasksInExecution
(100ms - 1000ms)
 */
class IntervalCalculator {

    count = 1
    interval = 200

    update(elapsed: number) {
        const minInterval = 100
        const maxInterval = 1000

        const total = this.count * this.interval + elapsed
        const u = total / (++this.count)
        this.interval = Math.max(Math.min(u, maxInterval), minInterval)
    }
}

export class TaskExecutor {
    constructor(readonly sp: SynchronizerProvider) {

    }

    async executeTasks<T>(params: SynchronizerTaskExecutorParams<T>) {
        const {
            maxTasksInFlight,
            maxTasksInExecution,
        } = params
        const executorId = params.executorId ?? crypto.randomUUID()
        const {sp} = this
        const inFlightSemaphore = sp.createSynchronizer({
            synchronizerId: `${executorId}-inFlightSemaphore`,
            maxConcurrentExecution: maxTasksInFlight
        })
        // inExecutionSemaphore is optional
        const inExecutionSemaphore = maxTasksInExecution !== undefined ? sp.createSynchronizer({
            synchronizerId: `${executorId}-inExecutionSemaphore`,
            maxConcurrentExecution: maxTasksInExecution
        }) : undefined
        await this.feedTasks({
            ...params,
            inFlightSemaphore,
            inExecutionSemaphore,
        })
    }

    feedTasks<T>(params: {
        inFlightSemaphore: Synchronizer,
        inExecutionSemaphore?: Synchronizer,
    } & SynchronizerTaskExecutorParams<T>): Promise<void> {
        const {maxTasksInFlight, inFlightSemaphore, inExecutionSemaphore, taskSource} = params
        const intervalCalculator = new IntervalCalculator()
        return new Promise<void>((resolve, reject) => {
                // create async function to use await
                // promise from this async function is useless.
                (async () => {
                    try {
                        while (true) {
                            const numberOfTasksToAdd = maxTasksInFlight - inFlightSemaphore.stats.numberOfRunningTasks
                            if (numberOfTasksToAdd === 0) {
                                await new Promise(r => setTimeout(r, intervalCalculator.interval))
                                continue
                            }
                            for (let i = 0; i < numberOfTasksToAdd; i++) {
                                const t = await taskSource.next()
                                if (t.done) {
                                    // wait until all tasks complete
                                    while (inFlightSemaphore.stats.numberOfTasks !== 0) {
                                        await new Promise(r => setTimeout(r, intervalCalculator.interval))
                                    }
                                    resolve()
                                    return
                                }
                                const {executionId, task} = t.value
                                const startAt = new Date()
                                this.executeTaskInSemaphore({
                                    ...params,
                                    executionId: executionId ?? crypto.randomUUID(),
                                    inFlightSemaphore,
                                    inExecutionSemaphore,
                                    task,
                                }).finally(() => {
                                    intervalCalculator.update(new Date().getTime() - startAt.getTime())
                                })
                            }
                            await new Promise(r => setTimeout(r, 0))
                        }
                    } catch (e) {
                        reject(e)
                    }
                })().finally(() => {
                    // nothing to do
                });
            }
        )
    }

    executeTaskInSemaphore<T>(params: {
        executionId: string,
        inFlightSemaphore: Synchronizer,
        inExecutionSemaphore?: Synchronizer,
        task: T,
    } & SynchronizerTaskExecutorParams<T>): Promise<void> {
        const {executionId, inFlightSemaphore, inExecutionSemaphore, task} = params
        return inFlightSemaphore.synchronized({
            executionId,
            cb: (context) => {
                if (inExecutionSemaphore === undefined) {
                    return this.executeTask({...params, executionId, task})
                }
                return inExecutionSemaphore.synchronized({
                    executionId: context.executionId, // Use same executionId
                    cb: () => {
                        return this.executeTask({...params, executionId, task})
                    }
                })
            }
        })
    }

    executeTask<T>({executionId, task, taskExecutor, onTaskError}: {
        executionId: string,
        task: T,
    } & SynchronizerTaskExecutorParams<T>): Promise<void> {
        return taskExecutor({
            executionId,
            task
        }).catch(e => {
            // notify task failure, and keep processing tasks
            // If you need to handle error, please do it in taskExecutor
            onTaskError?.(e)
        })
    }
}
