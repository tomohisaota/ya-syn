import {
    SynchronizerCallback,
    SynchronizerContext,
    SynchronizerEventType,
    SynchronizerProviderParams,
    SynchronizerStats
} from "./types";
import {SynchronizerReentrantExecutionError, SynchronizerThrottleError, SynchronizerTimeoutError} from "./errors";
import {Semaphore} from "./Semaphore";

/*

Avoid dead lock
It is possible to enter synchronized block recursively.


 */

type SynchronizerParams = SynchronizerProviderParams
    & Pick<SynchronizerContext, "synchronizerId">
    & Partial<Pick<SynchronizerStats, "maxConcurrentExecution">> & {
    readonly raiseOnReentrant?: boolean
}

type SynchronizerSynchronizedParamsFull<T> = {
    executionId?: string
    cb: SynchronizerCallback<T>,
    isCanceled?: () => boolean
    throttle?: boolean,
}

export type SynchronizerSynchronizedParams<T> = SynchronizerCallback<T> | SynchronizerSynchronizedParamsFull<T>

export class Synchronizer {

    protected readonly _semaphore
    protected readonly _stats: SynchronizerStats

    constructor(readonly params: SynchronizerParams
    ) {
        const maxConcurrentExecution = params.maxConcurrentExecution ?? 1
        this._semaphore = new Semaphore(maxConcurrentExecution, params.raiseOnReentrant)
        this._stats = {
            maxConcurrentExecution,
            numberOfRunningTasks: 0,
            numberOfTasks: 0,
        }
    }

    get providerId() {
        return this.params.providerId
    }

    get synchronizerId() {
        return this.params.synchronizerId
    }

    get stats(): Readonly<SynchronizerStats> {
        return this._stats
    }

    synchronized<T>(params: SynchronizerSynchronizedParams<T>): Promise<T> {
        const {cb, executionId, isCanceled, throttle} = toFullParam(params)
        const context: SynchronizerContext = {
            providerId: this.providerId,
            synchronizerId: this.synchronizerId,
            executionId,
        }
        return new Promise<T>((resolve, reject) => {
            this._semaphore.synchronized((): Promise<void> => {
                return cb(context).then(resolve).catch(reject)
            }, {
                isCanceled: isCanceled,
                onEvent: (eventType) => {
                    this.emitEvent(eventType, context)
                },
                throttle,
            }).catch(e => {
                if (e instanceof SynchronizerReentrantExecutionError) {
                    // Add context to the error
                    reject(new SynchronizerReentrantExecutionError(context))
                } else if (e instanceof SynchronizerThrottleError) {
                    // Add context to the error
                    reject(new SynchronizerThrottleError(context))
                } else {
                    reject(e)
                }
            })
        })
    }

    emitEvent(type: SynchronizerEventType,
              context: SynchronizerContext
    ) {
        switch (type) {
            case "Acquire":
                this._stats.numberOfTasks++
                break
            case "Acquired":
                this._stats.numberOfRunningTasks++
                break
            case "Release":
                this._stats.numberOfRunningTasks--
                break
            case "Finish":
                this._stats.numberOfTasks--
                break
            case "Timeout":
                this._stats.numberOfTasks--
                break
        }
        this.params.onEvent?.({
            type,
            context,
            stats: {
                ...this.stats
            }
        })
    }

    timeout(timeout: number) {
        return new WithTimeout({
            synchronizer: this,
            timeout
        })
    }

    throttle() {
        return new WithThrottle({
            synchronizer: this,
        })
    }
}

class WithThrottle {
    constructor(protected readonly _params: {
        readonly synchronizer: Synchronizer
    }) {
    }

    get stats(): Readonly<SynchronizerStats> {
        return this._params.synchronizer.stats
    }

    synchronized<T>(params: SynchronizerSynchronizedParams<T>): Promise<T> {
        return this._params.synchronizer.synchronized({
            ...toFullParam(params),
            throttle: true
        })
    }
}


class WithTimeout {
    constructor(protected readonly _params: {
        readonly synchronizer: Synchronizer
        readonly timeout: number,
    }) {
    }

    get stats(): Readonly<SynchronizerStats> {
        return this._params.synchronizer.stats
    }

    synchronized<T>(params: SynchronizerSynchronizedParams<T>): Promise<T> {
        const {synchronizer, timeout} = this._params
        const {cb, executionId} = toFullParam(params)
        let state: "waiting" | "timeout" | "started" = "waiting"
        return Promise.race([
            synchronizer.synchronized({
                executionId,
                isCanceled: () => state === "timeout",
                cb: (context) => {
                    return new Promise<T>((resolve, reject) => {
                        if (state === "waiting") {
                            state = "started"
                            return cb(context).then(resolve).catch(reject)
                        }
                    })
                }
            }),
            new Promise<T>((_resolve, reject) => {
                // If it cannot acquire lock within timeout
                setTimeout(() => {
                    if (state === "waiting") {
                        state = "timeout"
                        reject(new SynchronizerTimeoutError(toContext(synchronizer, executionId)))
                    }
                }, timeout)
            })
        ]).catch((e) => {
            if (e instanceof SynchronizerTimeoutError) {
                synchronizer.emitEvent("Timeout", toContext(synchronizer, executionId))
            }
            throw e
        })
    }
}

function toFullParam<T>(params: SynchronizerSynchronizedParams<T>): SynchronizerSynchronizedParamsFull<T> {
    if (!("cb" in params)) {
        return ({
            cb: params
        })
    }
    return params
}

function toContext(s: Synchronizer, executionId?: string): SynchronizerContext {
    return {
        providerId: s.providerId,
        synchronizerId: s.synchronizerId,
        executionId,
    }
}