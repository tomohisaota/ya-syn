import {CoreLazyInitializer} from "./CoreLazyInitializer";

type Context = ReadonlyArray<number>

interface ContextStorage {
    getStore(): Context | undefined

    run(context: Context, cb: () => void): void
}

export class ReentrantDetector {
    constructor(readonly storage: ContextStorage, readonly id: number) {
    }

    run(cb:  (reentrant: boolean) => void): void {
        const ids = this.storage.getStore() ?? []
        if (ids.includes(this.id)) {
            // Already in synchronized context
            // Just run the callback
            cb(true)
        } else {
            // First call
            // Mark and run the callback
            this.storage.run([...ids, this.id], () => cb(false))
        }
    }
}

export class ReentrantDetectorFactory {
    // Create only 1 AsyncLocalStorage
    readonly storageProvider = new CoreLazyInitializer<ContextStorage>(async () => {
        if (!isNode()) {
            return {
                getStore: () => [],
                run: (context: Context, cb: () => void) => cb()
            }
        }
        return new Promise<ContextStorage>((resolve, reject): void => {
            import("async_hooks").then(module => {
                resolve(new module.AsyncLocalStorage<Context>)
            }).catch(reject)
        })
    })

    // Assign unique id for each marker
    idGenerator = 0

    async create() {
        const id = this.idGenerator++
        return new ReentrantDetector(await this.storageProvider.get(), id)
    }
}

const reentrantDetectorFactory = new ReentrantDetectorFactory()

export class ReentrantDetectorProvider extends CoreLazyInitializer<ReentrantDetector> {
    constructor() {
        super(async () => {
            return reentrantDetectorFactory.create()
        })
    }
}

function isNode(): boolean {
    return typeof process !== "undefined" && process.versions != null && process.versions.node != null;
}