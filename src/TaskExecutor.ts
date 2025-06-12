import {SynchronizerTaskExecutorParams} from "./types";
import {CoreSemaphore} from "./CoreSemaphore";


export class TaskExecutor {

    async executeTasks<T>(params: SynchronizerTaskExecutorParams<T>): Promise<void> {
        const {
            maxTasksInFlight,
            maxTasksInExecution,
        } = params
        const inFlightSemaphore = new CoreSemaphore(maxTasksInFlight)
        // inExecutionSemaphore is optional
        const inExecutionSemaphore = maxTasksInExecution !== undefined ? new CoreSemaphore(maxTasksInExecution) : undefined
        return this.feedTasks({
            ...params,
            inFlightSemaphore,
            inExecutionSemaphore,
        })
    }

    async feedTasks<T>(params: {
        inFlightSemaphore: CoreSemaphore,
        inExecutionSemaphore?: CoreSemaphore,
    } & SynchronizerTaskExecutorParams<T>): Promise<void> {
        const {maxTasksInFlight, inFlightSemaphore, inExecutionSemaphore, taskSource} = params
        return new Promise<void>((resolve, reject): void => {
                // create async function to use await
                // promise from this async function is useless.
                (async () => {
                    try {
                        while (true) {
                            const numberOfTasksToAdd = maxTasksInFlight - inFlightSemaphore.numberOfTasks
                            for (let i = 0; i < numberOfTasksToAdd; i++) {
                                const t = await taskSource.next()
                                if (t.done) {
                                    resolve()
                                    return
                                }
                                const {task} = t.value
                                this.executeTaskInSemaphore({
                                    ...params,
                                    inFlightSemaphore,
                                    inExecutionSemaphore,
                                    task,
                                })
                            }
                            await inFlightSemaphore.waitComplete()
                        }
                    } catch (e) {
                        reject(e)
                    }
                })().finally(() => {
                    // nothing to do
                });
            }
        ).finally(() => {
            // Wait until all tasks completes
            // Note that inExecutionSemaphore is inside inFlightSemaphore block.
            return inFlightSemaphore.waitCompleteAll()
        })
    }

    executeTaskInSemaphore<T>(params: {
        inFlightSemaphore: CoreSemaphore,
        inExecutionSemaphore?: CoreSemaphore,
        task: T,
    } & SynchronizerTaskExecutorParams<T>): void {
        const {inFlightSemaphore, inExecutionSemaphore, task} = params
        inFlightSemaphore.synchronized(() => {
            if (inExecutionSemaphore === undefined) {
                return this.executeTask({...params, task})
            }
            return inExecutionSemaphore.synchronized(() => {
                return this.executeTask({...params, task})
            })
        }).finally(() => {
            // Do nothing
        })
    }

    async executeTask<T>({task, taskExecutor, onTaskError}: {
        task: T,
    } & SynchronizerTaskExecutorParams<T>): Promise<void> {
        return taskExecutor({
            task
        }).catch(e => {
            // notify task failure, and keep processing tasks
            // If you need to handle error, please do it in taskExecutor
            onTaskError?.(e)
        })
    }
}
