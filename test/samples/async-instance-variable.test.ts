import {LazyInitializer} from "../../src";

describe("Async Instance Variable", () => {

    class Sample {
        // lazy instance variable can be created when constructing instance
        readonly i = new LazyInitializer(async () => {
            await new Promise(resolve => setTimeout(resolve, 1000))
            return {}
        })

        async get() {
            // lazy instance variable get initialized when it is accessed for the first time
            return await this.i.get()
        }
    }

    test("test", async () => {
        const i = new Sample()
        // initializer called only once
        expect(await Promise.all([
            i.get(),
            i.get(),
        ])).toEqual([{}, {}])
    })

})