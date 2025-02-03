import {SynchronizerInvalidError} from "./errors";
import {CoreSemaphore} from "./CoreSemaphore";

export class CoreLazyInitializer<T> {

    protected _target: T | undefined

    constructor(
        protected readonly _factory: () => Promise<T>,
        protected _synchronizer = new CoreSemaphore(1),
        protected eager?: boolean
    ) {
        if (eager === true) {
            // Try eager loading. don't are about result nor error
            this.get().catch(e => {
                // ignore error
            })
        }
    }

    async get(): Promise<T> {
        if (this._target !== undefined) {
            return this._target
        }
        await this._synchronizer.synchronized(async () => {
            if (this._target === undefined) {
                this._target = await this._factory()
            }
        })
        // this._target cannot be undefined unless factory returns undefined
        if (this._target === undefined) {
            throw new SynchronizerInvalidError("factory returned undefined")
        }
        return this._target
    }
}
