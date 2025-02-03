import {Semaphore} from "./Semaphore";
import {CoreLazyInitializer} from "./CoreLazyInitializer";

/*
LazyInitializer with reentrant checking.
In general, reentrant into initializer indicates circular dependency
 */
export class LazyInitializer<T> extends CoreLazyInitializer<T> {

    constructor(readonly factory: () => Promise<T>, protected eager?: boolean) {
        super(factory, new Semaphore(1, true), eager) // raise on reentrant
    }
}
