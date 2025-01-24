import {SynchronizerContext} from "./types";
import {LazyInitializer} from "./LazyInitializer";

type ReentrantDetectorType = "None" | "AsyncLocalStorage"

type ReentrantDetectorCallback = (reentrant: boolean, type: ReentrantDetectorType) => void
type ReentrantDetector = (context: SynchronizerContext, cb: ReentrantDetectorCallback) => void
type ReentrantDetectorFactory = () => ReentrantDetector
type ReentrantDetectorFactoryLazyFactory = () => Promise<ReentrantDetectorFactory>


const usingAsyncLocalStorage: ReentrantDetectorFactoryLazyFactory = () => {
    return new Promise<ReentrantDetectorFactory>((resolve, reject) => {
        import("async_hooks").then(module => {
            class ReentrantMarker {
                protected readonly storage = new module.AsyncLocalStorage<boolean>()

                run(_context: SynchronizerContext, cb: ReentrantDetectorCallback): void {
                    const SYNCHRONIZED = true
                    if (this.storage.getStore() === SYNCHRONIZED) {
                        // Already in synchronized context
                        // Just run the callback
                        cb(true, "AsyncLocalStorage")
                    } else {
                        // First call
                        // Mark and run the callback
                        this.storage.run(SYNCHRONIZED, () => cb(false, "AsyncLocalStorage"))
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
        (_context: SynchronizerContext, cb: ReentrantDetectorCallback) => cb(false, "None")
}

export class LazyReentrantCallbackFactory extends LazyInitializer<ReentrantDetectorFactory> {
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

export class LazyReentrantCallback extends LazyInitializer<ReentrantDetector> {
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