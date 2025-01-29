import {SynchronizerProvider} from "./SynchronizerProvider";
import {Synchronizer} from "./Synchronizer";
import {CachedProviderParams} from "./types";

type Cache<T> = {
    cachedAt: number,
    obj: T
}

export class CachedProvider<T> {
    protected _cache?: Cache<T> = undefined

    protected readonly _factory: () => Promise<T>
    protected readonly _synchronizer: Synchronizer
    protected readonly _cacheTimestamp?: (obj: T) => Date
    protected readonly _defaultTtl: number

    constructor(params: CachedProviderParams<T> & {
        readonly synchronizerProvider: SynchronizerProvider
    }) {
        this._factory = params.factory
        this._synchronizer = params.synchronizerProvider.forObject(this, 1)
        this._cacheTimestamp = params.cacheTimestamp
        this._defaultTtl = params.defaultTTL ?? 0
    }

    async get(ttl?: number) {
        ttl = ttl ?? this._defaultTtl
        const requestedAt = new Date().getTime()
        // Check without lock
        if (this._cache) {
            if (requestedAt - this._cache.cachedAt <= ttl) {
                return this._cache.obj
            }
        }
        return this._synchronizer.synchronized({
            executionId: `ttl:${ttl} requestedAt:${requestedAt} cachedAt:${this._cache?.cachedAt}`,
            cb: async () => {
                // Check with lock
                if (this._cache) {
                    if (requestedAt - this._cache.cachedAt <= ttl) {
                        return this._cache.obj
                    }
                }
                let cachedAt = new Date().getTime()
                const obj = await this._factory()
                if (this._cacheTimestamp) {
                    cachedAt = this._cacheTimestamp(obj).getTime()
                }
                this._cache = {
                    cachedAt,
                    obj,
                }
                return obj
            }
        })
    }


    /*
    Utility method
    Capture variables in function chain
     */
    static capture<V, T>(params: V, cb: (params: V) => T) {
        return cb(params)
    }
}