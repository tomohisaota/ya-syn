import {CoreSemaphore} from "./CoreSemaphore";
import {ReentrantDetectorProvider} from "./ReentrantDetector";
import {SynchronizerEventType} from "./types";
import {SynchronizerReentrantExecutionError, SynchronizerThrottleError} from "./errors";

class SynchronizerCancelError extends Error {
}

export class Semaphore extends CoreSemaphore {

    protected readonly _reentrantDetector = new ReentrantDetectorProvider()
    private _runningWithoutReenter = 0

    constructor(concurrentExecution: number, readonly raiseOnReentrant = false) {
        super(concurrentExecution)
    }

    async synchronized<T>(cb: (isReentrant: boolean) => Promise<T>, params?: {
        onEvent?: (type: SynchronizerEventType) => void
        isCanceled?: () => boolean,
        throttle?: boolean
    }): Promise<T> {
        const r = await this._reentrantDetector.get()
        return new Promise<T>((resolve, reject): void => {
            r.run((isReentrant): void => {
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
                if (params?.throttle && (this._runningWithoutReenter >= this.concurrentExecution)) {
                    params?.onEvent?.("Throttle")
                    reject(new SynchronizerThrottleError())
                    return
                }
                params?.onEvent?.("Acquire")
                this._runningWithoutReenter++
                super.synchronized(() => {
                    if (params?.isCanceled?.()) {
                        // Canceled before execution
                        return Promise.reject(new SynchronizerCancelError())
                    }
                    params?.onEvent?.("Acquired")
                    return cb(false).then()
                }).then((result) => {
                    params?.onEvent?.("Release")
                    params?.onEvent?.("Finish")
                    resolve(result)
                }).catch((e) => {
                    if (e instanceof SynchronizerCancelError) {
                        reject(e)
                    } else {
                        params?.onEvent?.("Release")
                        params?.onEvent?.("Finish")
                        reject(e)
                    }
                }).finally(() => {
                    this._runningWithoutReenter--
                })
            })
        })
    }

}
