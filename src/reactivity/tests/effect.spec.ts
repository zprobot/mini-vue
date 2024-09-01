import { reactive } from "../reactive";
import { effect, stop } from "../effect";


describe('effect', () => {
    it('happy path', () => {
        const user = reactive({
            age: 10
        })
        let nextAge;
        effect(() => {
            nextAge = user.age + 1
        })
        expect(nextAge).toBe(11)
        user.age++
        expect(nextAge).toBe(12)
    })
    it('return runner',() => {
        // effect(fn) -> func(runner) -> runner -> return 
        let foo = 10
        const runner = effect(() => {
            foo++
            return 'foo'
        })
        expect(foo).toBe(11)
        const res = runner()
        expect(foo).toBe(12)
        expect(res).toBe('foo')
    })
    it('seheduler', () => {
        // 调度函数scheduler
        // effect 第一次执行为fn
        // 当set，update时不会执行fn而是scheduler
        // 如果执行runner时，再次执行fn
        let dummy;
        let run: any;
        const scheduler = jest.fn(()=>{
            run = runner;
        })
        const obj = reactive({ foo: 1 })
        const runner = effect(
            () => {
                dummy = obj.foo
            },
            { scheduler }
        )
        expect(scheduler).not.toHaveBeenCalled() // 一开始不会调用
        expect(dummy).toBe(1)
        obj.foo++
        expect(scheduler).toHaveBeenCalledTimes(1)
        expect(dummy).toBe(1)
        run()
        expect(dummy).toBe(2)
    })
})
it('stop', () => {
    // 调用stop，清除相关依赖，停止响应式更新
    let dummy
    const obj = reactive({props: 1})
    const runner = effect(() => {
        dummy = obj.props
    })
    obj.props = 2
    expect(dummy).toBe(2)
    stop(runner)
    obj.props++
    expect(dummy).toBe(2)
    runner()
    expect(dummy).toBe(3)
})
it('onStop', () => {
    const obj = reactive({
        foo: 1
    })
    const onStop = jest.fn()
    let dummy
    const runner = effect(
        () => {
            dummy = obj.foo
        },
        {
            onStop
        }
    )
    stop(runner)
    expect(onStop).toHaveBeenCalledTimes(1)
})
