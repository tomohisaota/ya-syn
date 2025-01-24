import {WeakCacheProvider} from "./WeakCacheProvider";
import {Synchronizer} from "./Synchronizer";
import {CachedProviderParams, SynchronizerProviderParams} from "./types";
import {CachedProvider} from "./CachedProvider";


export class SynchronizerProvider {
    protected id = 0
    protected weakCacheProvider = new WeakCacheProvider<Synchronizer>()
    protected keyToSynchronizer = new Map<string, Synchronizer>()

    constructor(readonly params?: SynchronizerProviderParams) {
    }

    /*
    Assign next id to caller, increment id by 1
     */
    nextId(): number {
        return this.id++
    }

    forKey(key: string, maxConcurrentExecution?: number): Synchronizer {
        let s = this.keyToSynchronizer.get(key)
        if (s) {
            return s
        }
        s = this.createSynchronizer({
            synchronizerId: `id:${this.nextId()} key:${key}`,
            maxConcurrentExecution,
        })
        this.keyToSynchronizer.set(key, s)
        return s
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

    createSynchronizer(params?: {
        synchronizerId?: string
        maxConcurrentExecution?: number,
    }): Synchronizer {
        return new Synchronizer({
            ...this.params,
            ...params,
        })
    }
}