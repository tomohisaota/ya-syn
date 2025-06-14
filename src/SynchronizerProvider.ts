import {WeakCacheProvider} from "./WeakCacheProvider";
import {Synchronizer} from "./Synchronizer";
import {
    CachedProviderParams,
    SynchronizerEventListener,
    SynchronizerParams,
    SynchronizerProviderParams,
    SynchronizerTaskExecutorParams
} from "./types";
import {CachedProvider} from "./CachedProvider";
import {TaskExecutor} from "./TaskExecutor";


export class SynchronizerProvider {
    protected id = 0
    protected weakCacheProvider = new WeakCacheProvider<Synchronizer>()
    protected keyToSynchronizer = new Map<string, WeakRef<Synchronizer>>()
    protected taskExecutor = new TaskExecutor()

    constructor(readonly params?: SynchronizerProviderParams) {
    }

    /*
    Assign next id to caller, increment id by 1
     */
    nextId(): number {
        return this.id++
    }

    forKey(key: string, maxConcurrentExecution?: number): Synchronizer {
        let wRef = this.keyToSynchronizer.get(key)
        if (wRef) {
            const sRef = wRef.deref()
            if (sRef) {
                return sRef
            } else {
                // object has been collected. need to wref with new object
                this.keyToSynchronizer.delete(key)
            }
        }
        const sRef = this.createSynchronizer({
            synchronizerId: `id:${this.nextId()} key:${key}`,
            maxConcurrentExecution,
        })
        this.keyToSynchronizer.set(key, new WeakRef(sRef))
        return sRef
    }

    forObject(obj: object, maxConcurrentExecution?: number) {
        return this.weakCacheProvider.get(obj, () => this.createSynchronizer({
            synchronizerId: `id:${this.nextId()} obj:${obj.constructor.name}`,
            maxConcurrentExecution,
        }))
    }

    createCachedProvider<T>(params: CachedProviderParams<T>): CachedProvider<T> {
        return new CachedProvider({
            ...params,
            synchronizerProvider: this,
        })
    }

    createSynchronizer(params?: Omit<SynchronizerParams, "providerId">): Synchronizer {
        return new Synchronizer({
            ...this.params,
            ...params,
            onEvent: mergeEventListeners([this.params?.onEvent, params?.onEvent])
        })
    }

    async executeTasks<T>(params: SynchronizerTaskExecutorParams<T>) {
        return this.taskExecutor.executeTasks(params)
    }
}

function mergeEventListeners(listeners: (SynchronizerEventListener | undefined)[]): SynchronizerEventListener | undefined {
    const validListeners = listeners.filter((i): i is SynchronizerEventListener => i !== undefined)
    if (validListeners.length === 0) {
        return undefined
    }
    return (event) => {
        validListeners.map(l => l(event))
    }
}