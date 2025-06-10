import {CoreLazyInitializer} from "./CoreLazyInitializer";

type ReentrantDetectorCallback = (reentrant: boolean) => void
type ReentrantDetector = (cb: ReentrantDetectorCallback) => void
type ReentrantDetectorFactory = () => ReentrantDetector
type ReentrantDetectorFactoryLazyFactory = () => Promise<ReentrantDetectorFactory>


const usingAsyncLocalStorage: ReentrantDetectorFactoryLazyFactory = () => {
    return new Promise<ReentrantDetectorFactory>((resolve, reject): void => {
        import("async_hooks").then(module => {
            class ReentrantMarker {
                protected readonly storage = new module.AsyncLocalStorage<boolean>()

                run(cb: ReentrantDetectorCallback): void {
                    const SYNCHRONIZED = true
                    if (this.storage.getStore() === SYNCHRONIZED) {
                        // Already in synchronized context
                        // Just run the callback
                        cb(true)
                    } else {
                        // First call
                        // Mark and run the callback
                        this.storage.run(SYNCHRONIZED, () => cb(false))
                    }
                }

                get function(): ReentrantDetector {
                    return this.run.bind(this)
                }
            }

            resolve(() => new ReentrantMarker().function)
        }).catch(reject)
    })
}

const usingNoCheck: ReentrantDetectorFactoryLazyFactory = async () => {
    return () =>
        (cb: ReentrantDetectorCallback) => cb(false)
}

export class LazyReentrantCallbackFactory extends CoreLazyInitializer<ReentrantDetectorFactory> {
    constructor() {
        super(async () => {
            if (isNode()) {
                return await usingAsyncLocalStorage()
            } else {
                // TODO: find a way to do the same thing on browser
                return await usingNoCheck()
            }
        });
    }
}

const lazyReentrantCallbackFactory = new LazyReentrantCallbackFactory()

export class LazyReentrantCallback extends CoreLazyInitializer<ReentrantDetector> {
    constructor() {
        super(async () => {
            const f = await lazyReentrantCallbackFactory.get()
            return f()
        })
    }
}

function isNode(): boolean {
    return typeof process !== "undefined" && process.versions != null && process.versions.node != null;
}