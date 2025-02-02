/*
IteratorResult does not have reference to generator itself.
Even if you put reference in data, data is not available on end of iterator

 */
type YieldResultWithId<T> = {
    id: string,
    value: T
}

type ReturnResultWithId<T> = {
    id: string,
    error?: unknown
}

type ResultWithId<T> = YieldResultWithId<T> | ReturnResultWithId<T>
type AsyncGeneratorWithId<T> = AsyncGenerator<YieldResultWithId<T>, ReturnResultWithId<T>>

/*
merge multiple async generators into one.
YieldResult from each iterator should be T
ReturnResult from each iterator should be void since there is only one chance to return value
 */
export async function* mergeAsyncGenerators<T>(generators: AsyncGenerator<T, void>[]): AsyncGenerator<T, void> {
    // Assign Unique Id to each generator
    const generatorsById: {
        [id: string]: AsyncGeneratorWithId<T>
    } = {}
    for (const g of generators) {
        const id = crypto.randomUUID()
        generatorsById[id] = async function* () {
            try {
                for await (const value of g) {
                    yield {id, value};
                }
                // yield last value with id to signal iterator end
                return {id, error: undefined};
            } catch (e) {
                return {id, error: e};
            }
        }()
    }
    // Create promises from each iterator
    const nextById: {
        [id: string]: Promise<IteratorResult<ResultWithId<T>>>
    } = {}
    for (const [id, ite] of Object.entries(generatorsById)) {
        nextById[id] = ite.next()
    }

    // Keep reading value from each iterator using Promise.race
    while (Object.keys(nextById).length > 0) {
        const next = await Promise.race(Object.values(nextById))
        if (next.done === true) {
            // End of the iterator. Delete from waiting list
            const {id, error} = next.value
            delete nextById[id]
            if (error) {
                // propagate error to caller
                throw error
            }
        } else {
            const {id, value} = next.value as YieldResultWithId<T>
            // value from one of the iterators.
            yield value
            // Keep reading the iterator
            nextById[id] = generatorsById[id].next()
        }
    }
}