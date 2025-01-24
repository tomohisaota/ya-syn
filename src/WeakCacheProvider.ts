export class WeakCacheProvider<T> {

    protected readonly weakMap = new WeakMap();

    get<K extends WeakKey>(key: K, factory: () => T): T {
        let obj = this.weakMap.get(key);
        if (obj) {
            return obj
        }
        obj = factory()
        this.weakMap.set(key, obj)
        return obj
    }
}