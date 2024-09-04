import { isObject } from "../shared"
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}

export function reactive(obj) {
    return createActiveObject(obj, mutableHandlers)
}

export function readonly(obj) {
    return createActiveObject(obj, readonlyHandlers)
}
export function shallowReadonly(obj) {
    return createActiveObject(obj, shallowReadonlyHandlers)
}
export function isReactive(value) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(value) {
    return !!value[ReactiveFlags.IS_READONLY]
}
export function isProxy(value) {
    return isReactive(value) || isReadonly(value)
}
function createActiveObject(raw: any, baseHandlers) {
    if(!isObject(raw)){
        console.warn(`target ${raw} must be an object`)
        return raw
    }
    return new Proxy(raw, baseHandlers)
}
