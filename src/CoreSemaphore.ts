import {SynchronizerInvalidError} from "./errors";

/*
Simple Semaphore implementation.
No callback, no reentrant check.
 */

export class CoreSemaphore {

    protected _running = 0
    protected readonly _pendingTaskQueue: (() => Promise<void>)[] = []

    constructor(readonly concurrentExecution: number) {
        if (!Number.isInteger(concurrentExecution)) {
            throw new SynchronizerInvalidError(`concurrentExecution should be integer value, concurrentExecution=${concurrentExecution}`)
        }
        if (concurrentExecution < 1) {
            throw new SynchronizerInvalidError(`concurrentExecution should be equal or greater than 1, concurrentExecution=${concurrentExecution}`)
        }
    }

    synchronized(cb: () => Promise<void>): Promise<void> {
        return new Promise<void>((resolve, reject): void => {
            const task = () => {
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

    protected run(cb: () => Promise<void>): void {
        this._running++
        cb().finally(() => {
            this._running--
            const task = this._pendingTaskQueue.shift()
            if (task !== undefined) {
                this.run(task)
            }
        })
    }

}
