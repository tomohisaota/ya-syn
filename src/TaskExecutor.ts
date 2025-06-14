import {ISemaphore, SynchronizerTaskExecutorParams} from "./types";
import {CoreSemaphore} from "./CoreSemaphore";


export class TaskExecutor {

    async executeTasks<T>(params: SynchronizerTaskExecutorParams<T>): Promise<void> {
        const {
            maxTasksInFlight,
            maxTasksInExecution,
        } = params
        const inFlightSemaphore = new CoreSemaphore(maxTasksInFlight)
        const inExecutionSemaphore = new CoreSemaphore(maxTasksInExecution ?? Number.MAX_VALUE)
        return this.feedTasks({
            ...params,
            inFlightSemaphore,
            inExecutionSemaphore,
        })
    }

    async feedTasks<T>(params: {
        inFlightSemaphore: ISemaphore,
        inExecutionSemaphore: ISemaphore,
    } & SynchronizerTaskExecutorParams<T>): Promise<void> {
        const {maxTasksInFlight, inFlightSemaphore, inExecutionSemaphore, taskSource} = params
        return new Promise<void>((resolve, reject): void => {
                // create async function to use await
                // promise from this async function is useless.
                (async () => {
                    try {
                        while (true) {
                            while(maxTasksInFlight - inFlightSemaphore.numberOfTasks) {
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
        inFlightSemaphore: ISemaphore,
        inExecutionSemaphore: ISemaphore,
        task: T,
    } & SynchronizerTaskExecutorParams<T>): void {
        const {inFlightSemaphore, inExecutionSemaphore, task} = params
        inFlightSemaphore.synchronized(() =>
            inExecutionSemaphore.synchronized(() =>
                this.executeTask({...params, task})
            )
        ).finally(() => {
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
