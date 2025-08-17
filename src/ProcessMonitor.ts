import {LazyInitializer} from "./LazyInitializer";

/*
Monitor Process on Node env
 */
export class ProcessMonitor {
    protected readonly abortController = new AbortController()

    readonly sleep = new LazyInitializer(async () => {
        if (isNode()) {
            const timers = await import("timers/promises")
            return timers.setTimeout
        }
        // ignore abort signal
        return (delay: number) => {
            return new Promise((resolve) => {
                setTimeout(resolve, delay)
            })
        }
    })

    constructor() {
        if (!isNode()) {
            return
        }
        process.once("SIGINT", () => {
            this.abortController.abort();
        });
        process.once("SIGTERM", () => {
            this.abortController.abort();
        });
    }

    async wait(ms: number) {
        const {signal} = this.abortController
        signal.throwIfAborted()
        const sleep = await this.sleep.get()
        await new Promise<void>((resolve, reject) => {
            const type = "abort"
            const listener = () => {
                // setTimeout was aborted
                signal.removeEventListener(type, listener)
                reject(new DOMException("Aborted during wait", "AbortError"))
            }
            signal.addEventListener(type, listener);
            // Call setTimeout with signal. Callback won't be fired when signalled.
            sleep(ms, {signal}).then(() => resolve()).catch(reject)
        })
    }

    get isTerminating() {
        return this.abortController.signal.aborted
    }

    get isRunning() {
        return !this.isTerminating
    }
}

function isNode(): boolean {
    return typeof process !== "undefined" && process.versions != null && process.versions.node != null;
}