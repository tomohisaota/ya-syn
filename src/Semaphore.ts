import {CoreSemaphore} from "./CoreSemaphore";
import {LazyReentrantCallback} from "./ReentrantDetector";
import {SynchronizerEventType} from "./types";
import {SynchronizerReentrantExecutionError} from "./errors";

class SynchronizerCancelError extends Error {
}

export class Semaphore extends CoreSemaphore {

    protected readonly _reentrantCallback = new LazyReentrantCallback()

    constructor(concurrentExecution: number, readonly raiseOnReentrant = false) {
        super(concurrentExecution)
    }

    async synchronized(cb: (isReentrant: boolean) => Promise<void>, params?: {
        onEvent?: (type: SynchronizerEventType) => void
        isCanceled?: () => boolean
    }): Promise<void> {
        params?.onEvent?.("Acquire")
        const r = await this._reentrantCallback.get()
        return new Promise((resolve, reject) => {
            r((isReentrant) => {
                if (isReentrant) {
                    if (this.raiseOnReentrant) {
                        throw new SynchronizerReentrantExecutionError()
                    }
                    params?.onEvent?.("Enter")
                    cb(true).then(resolve).catch(reject).finally(() => {
                        params?.onEvent?.("Exit")
                        params?.onEvent?.("Finish")
                    })
                    return
                }
                super.synchronized(() => {
                    if (params?.isCanceled?.()) {
                        // Canceled before execution
                        return Promise.reject(new SynchronizerCancelError())
                    }
                    params?.onEvent?.("Acquired")
                    return cb(false)
                }).then(() => {
                    params?.onEvent?.("Release")
                    params?.onEvent?.("Finish")
                    resolve()
                }).catch((e) => {
                    if (e instanceof SynchronizerCancelError) {
                        resolve(Promise.resolve())
                    } else {
                        params?.onEvent?.("Release")
                        params?.onEvent?.("Finish")
                        reject(e)
                    }
                })
            })
        })
    }

}
