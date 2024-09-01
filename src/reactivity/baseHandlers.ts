import { extend, isObject } from "../shared"
import { track, trigger } from "./effect"
import { reactive, ReactiveFlags, readonly } from "./reactive"
// 缓存，不需要每次访问都创建
const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        // 用于判断响应式
        if(key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        }
        if(key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        const res = Reflect.get(target, key)
        if(isObject(res) && !isShallow) {
            // 深度响应式
            return isReadonly ? readonly(res) : reactive(res)
        }
        // 搜集依赖
        if(!isReadonly) {
            track(target, key)
        }
        return res
    }
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value)
        // 触发依赖
        trigger(target, key)
        return res
    }
}
export const mutableHandlers = {
    get,
    set,
}
export const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn('readonly do not support set')
        return true
    }
}
export const shallowReadonlyHandlers = extend({},readonlyHandlers,{
    get: shallowReadonlyGet
})