import { extend } from "../shared"

export class ReactiveEffect {
    private _fn: any
    deps = []
    active = true
    onStop?: () => void
    constructor(fn, public scheduler?) {
        this._fn = fn
    }
    run() {
        if(!this.active) {
            return this._fn()
        }
        shouldTrack = true
        activeEffect = this
        const res = this._fn()
        shouldTrack = false
        return res
    }
    stop() {
        if(this.active) {
            cleanupEffect(this)
            if(this.onStop) {
                this.onStop()
            }
            this.active = false
        }
    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((deps: any)=>{
        deps.delete(effect)
    })
    effect.deps.length = 0
}

const targetMap = new Map()
export function track(target, key) {
    if(!isTracking()) return
    let depsMap = targetMap.get(target)
    if(!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let deps = depsMap.get(key)
    if(!deps) {
        deps = new Set()
        depsMap.set(key, deps)
    }
    trackEffects(deps)
}
export function isTracking() {
    return shouldTrack && activeEffect !== undefined
}
export function trackEffects(deps) {
    if(deps.has(activeEffect)) return
    deps.add(activeEffect)
    activeEffect.deps.push(deps) // 反向收集依赖
}

export function trigger(target, key) {
    const depsMap = targetMap.get(target)
    const deps = depsMap.get(key)
    triggerEffects(deps)
}
export function triggerEffects(deps) {
    for (const effect of deps) {
        if(effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run()
        }
    }
}

let activeEffect
let shouldTrack
export function effect(fn, options:any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)
    // extend options
    extend(options)
    _effect.onStop = options.onStop
    _effect.run()
    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}

export function stop(runner) {
    runner.effect.stop()
}