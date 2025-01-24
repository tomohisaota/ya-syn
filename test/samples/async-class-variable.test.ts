import {LazyInitializer} from "../../src";

describe("Async Class Variable", () => {

    class Sample {
        // lazy class variable can be created when the class is loaded
        static readonly i = new LazyInitializer(async () => {
            await new Promise(resolve => setTimeout(resolve, 1000))
            return {}
        })

        async get() {
            // lazy class variable get initialized when it is accessed for the first time
            return await Sample.i.get()
        }
    }

    test.concurrent("test", async () => {
        const i = new Sample()
        // initializer called only once
        expect(await Promise.all([
            i.get(),
            i.get(),
        ])).toEqual([{}, {}])
    })

})