import {Semaphore} from "./Semaphore";
import {SynchronizerInvalidError} from "./errors";

export class LazyInitializer<T> {

    protected _target: T | undefined
    protected _synchronizer = new Semaphore(1)

    constructor(protected readonly _factory: () => Promise<T>) {
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
