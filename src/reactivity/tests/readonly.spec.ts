import { isProxy, isReadonly, readonly } from "../reactive"
describe('readonly', () => {
    it('happy path', () => {
        const origin = { foo: 1, bar: { baz: 2 }}
        const wrap = readonly(origin)
        expect(wrap).not.toBe(origin)
        expect(isReadonly(wrap)).toBe(true)
        expect(isReadonly(wrap.bar)).toBe(true)
        expect(isReadonly(origin.bar)).toBe(false)
        expect(wrap.foo).toBe(1)
        expect(isProxy(wrap)).toBe(true)
    })
    it('warn then call set', () => {
        console.warn = jest.fn()
        const user = readonly({
            age: 10
        })
        user.age = 11
        expect(console.warn).toHaveBeenCalled()
    })
})