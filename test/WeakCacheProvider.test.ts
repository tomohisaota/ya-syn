import {TestClass} from "./utils";
import {WeakCacheProvider} from "../src/WeakCacheProvider";


describe("WeakCacheProvider", () => {
    test.concurrent('return same object for class object', async () => {
        const p = new WeakCacheProvider<string>()
        expect(p.get(TestClass, () => "1"))
            .toBe(p.get(TestClass, () => "2"))
    })

    test.concurrent('return same object for same instance', async () => {
        const p = new WeakCacheProvider<string>()
        for (const obj of [
            new TestClass(), {}
        ]) {
            expect(p.get(obj, () => "1"))
                .toBe(p.get(obj, () => "2"))
        }
    });

    test.concurrent('return different object for different instance', async () => {
        const p = new WeakCacheProvider<string>()

        for (const obj of [
            () => new TestClass(),
            () => ({})
        ]) {
            expect(p.get(obj(), () => "1"))
                .not.toBe(p.get(obj(), () => "2"))
        }
    });

})
