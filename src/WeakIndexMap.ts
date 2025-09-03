export class WeakIndexMap<Params, T extends object> {

    protected readonly _indexMap = new Map<string, WeakRef<T>>();

    protected readonly toKey: (params: Params) => string
    protected readonly toIndex: (params: Params) => T

    constructor(params: {
                    readonly toKey: (params: Params) => string,
                    readonly toIndex: (params: Params) => T
                    readonly gcInterval?: number,
                }
    ) {
        this.toKey = params.toKey
        this.toIndex = params.toIndex
        if (params.gcInterval !== undefined) {
            setInterval(this.gc.bind(this), params.gcInterval).unref()
        }
    }

    // for gc testing
    protected isGarbageCollected(target?: T): boolean {
        return target === undefined
    }

    get(params: Params): T {
        const key = this.toKey(params)
        let index = this._indexMap.get(key)?.deref()
        if (index) {
            return index
        }
        index = this.toIndex(params)
        this._indexMap.set(key, new WeakRef(index))
        return index
    }

    get size() {
        return this._indexMap.size
    }

    gc() {
        const keys = this._indexMap.keys()
        for (const key of keys) {
            const wRef = this._indexMap.get(key)
            if (wRef === undefined) {
                continue
            }
            if (this.isGarbageCollected(wRef.deref())) {
                this._indexMap.delete(key)
            }
        }
    }
}