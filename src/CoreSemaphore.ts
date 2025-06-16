import {SynchronizerInvalidError} from "./errors";
import {ISemaphore} from "./types";

/*
Simple Semaphore implementation.
No callback, no reentrant check.
 */

export class CoreSemaphore implements ISemaphore {

    protected _running = 0
    protected readonly _pendingTaskQueue: (() => Promise<void>)[] = []
    protected _onCompleteAll: (() => void)[] = []
    protected _onComplete: (() => void)[] = []

    constructor(readonly concurrentExecution: number) {
        if (!Number.isInteger(concurrentExecution)) {
            throw new SynchronizerInvalidError(`concurrentExecution should be integer value, concurrentExecution=${concurrentExecution}`)
        }
        if (concurrentExecution < 1) {
            throw new SynchronizerInvalidError(`concurrentExecution should be equal or greater than 1, concurrentExecution=${concurrentExecution}`)
        }
    }

    synchronized<T>(cb: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject): void => {
            const task = (): Promise<void> => {
                return cb().then(resolve).catch(reject)
            }
            if (this._running < this.concurrentExecution) {
                // Do it now!
                this.run(task)
            } else {
                // wait in the queue
                this._pendingTaskQueue.push(task)
            }
        })

    }

    async waitComplete(): Promise<void> {
        if (this.numberOfTasks === 0) {
            // no task, no wait
            return
        }
        return new Promise<void>((resolve): void => {
            this._onComplete.push(resolve)
        })
    }

    async waitCompleteAll(): Promise<void> {
        if (this.numberOfTasks === 0) {
            // no task, no wait
            return
        }
        return new Promise<void>((resolve): void => {
            this._onCompleteAll.push(resolve)
        })
    }

    protected run(cb: () => Promise<void>): void {
        this._running++
        cb().finally(() => {
            this._running--
            const task = this._pendingTaskQueue.shift()
            // Capture handlers before starting new task
            let handlers: (() => void)[] = []
            if (this._onComplete.length > 0) {
                handlers = handlers.concat(this._onComplete)
                this._onComplete = []
            }
            if ((task === undefined) && (this._running === 0) && (this._onCompleteAll.length > 0)) {
                handlers = handlers.concat(this._onCompleteAll)
                this._onCompleteAll = []
            }
            // Run next task if exists.
            if (task !== undefined) {
                this.run(task)
            }
            // Call handlers after starting new task
            // This sequence make sure that tasks added by handlers will be executed after queued tasks
            for (const i of handlers) {
                i()
            }
        })
    }

    get numberOfRunningTasks() {
        return this._running
    }

    get numberOfTasks() {
        return this._running + this._pendingTaskQueue.length
    }

}
