import { isProxy, isReactive, reactive } from "../reactive"
describe('reactive', () => {
    it('happy path', () => {
        const origin = { foo: 1 }
        const observer = reactive(origin)
        expect(observer).not.toBe(origin)
        expect(observer.foo).toBe(1)
        expect(isReactive(observer)).toBe(true)
        expect(isReactive(origin)).toBe(false)
        expect(isProxy(observer)).toBe(true)
    })
    test('nested reactive', () => {
        const origin = {
            nested: {
                foo: 1
            },
            array: [{bar: 2}]
        }
        const observed = reactive(origin)
        expect(isReactive(observed.nested)).toBe(true)
        expect(isReactive(observed.array)).toBe(true)
        expect(isReactive(observed.array[0])).toBe(true)
    })
})