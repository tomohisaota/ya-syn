import {
    SynchronizerCallback,
    SynchronizerContext,
    SynchronizerEventType,
    SynchronizerProviderParams,
    SynchronizerStats
} from "./types";
import {LazyReentrantCallback} from "./ReentrantDetector";
import {Semaphore} from "./Semaphore";
import {SynchronizerThrottleError, SynchronizerTimeoutError} from "./errors";

/*

Avoid dead lock
It is possible to enter synchronized block recursively.


 */

class SynchronizerCancelError extends Error {
}

type SynchronizerParams = SynchronizerProviderParams
    & Pick<SynchronizerContext, "synchronizerId">
    & Partial<Pick<SynchronizerStats, "maxConcurrentExecution">>

type SynchronizerSynchronizedParamsFull<T> = {
    executionId?: string
    cb: SynchronizerCallback<T>,
    canceled?: () => boolean
}

export type SynchronizerSynchronizedParams<T> = SynchronizerCallback<T> | SynchronizerSynchronizedParamsFull<T>

export class Synchronizer {

    protected readonly _semaphore
    protected readonly _stats: SynchronizerStats
    protected readonly _reentrantCallback = new LazyReentrantCallback()

    constructor(readonly params: SynchronizerParams
    ) {
        const maxConcurrentExecution = params.maxConcurrentExecution ?? 1
        this._semaphore = new Semaphore(maxConcurrentExecution)
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
        const {cb, executionId, canceled} = toFullParam(params)
        const context: SynchronizerContext = {
            providerId: this.providerId,
            synchronizerId: this.synchronizerId,
            executionId,
        }
        this.emitEvent("Acquire", context)
        return new Promise<T>((resolve, reject) => {
            this._reentrantCallback.get().then((reentrant) => {
                reentrant(context, (isReentrant, _reentrantCallbackType) => {
                    if (isReentrant) {
                        // Already in synchronized context
                        // Just run the callback to avoid deadlock
                        this.emitEvent("Enter", context)
                        cb(context).then(resolve).catch(reject).finally(() => {
                            this.emitEvent("Exit", context)
                            this.emitEvent("Finish", context)
                        })
                    } else {
                        // Not in synchronized context yet
                        // Run async call in synchronized context
                        this._semaphore.synchronized((): Promise<void> => {
                            if (canceled !== undefined && canceled()) {
                                // skip execution, use special Error type to bypass catch handler
                                return Promise.reject(new SynchronizerCancelError())
                            }
                            this.emitEvent("Acquired", context)
                            return cb(context).then(resolve).catch(reject)
                        }).then(() => {
                            this.emitEvent("Release", context)
                            this.emitEvent("Finish", context)
                        }).catch((e) => {
                            if (!(e instanceof SynchronizerCancelError)) {
                                this.emitEvent("Release", context)
                                this.emitEvent("Finish", context)
                            }
                        })
                    }
                })
            }).catch(reject)
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
        const {executionId} = toFullParam(params)
        const {synchronizer} = this._params
        const {stats} = this._params.synchronizer
        if (stats.numberOfRunningTasks >= stats.maxConcurrentExecution) {
            const context = toContext(synchronizer, executionId)
            synchronizer.emitEvent("Throttle", context)
            return Promise.reject(new SynchronizerThrottleError(context))
        } else if (stats.numberOfTasks >= stats.maxConcurrentExecution) {
            // Some tasks are in Acquire to Acquired transition
            return new Promise<T>((resolve, reject) => {
                // process.nextTick may be better, but not sure if it works on browser
                setTimeout(() => {
                    if (stats.numberOfRunningTasks >= stats.maxConcurrentExecution) {
                        const context = toContext(synchronizer, executionId)
                        synchronizer.emitEvent("Throttle", context)
                        return reject(new SynchronizerThrottleError(context))
                    }
                    this._params.synchronizer.synchronized(params).then(resolve).catch(reject)
                }, 0)
            })
        }
        return this._params.synchronizer.synchronized(params)
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
                canceled: () => state === "timeout",
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