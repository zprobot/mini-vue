import { hadChange, isObject } from "../shared"
import { isTracking, trackEffects, triggerEffects } from "./effect"
import { reactive } from "./reactive"
class RefImpl {
    private _value: any
    public deps
    public __v_isRef = true
    private _rawValue: any
    constructor(value) {
        this._rawValue = value
        this._value = convert(value)
        this.deps = new Set()
    }
    get value() {
        trackRefValue(this)
        return this._value
    }
    set value(newValue) {
        if(hadChange(this._rawValue, newValue)) {
            this._rawValue = newValue
            this._value = convert(newValue)
            triggerEffects(this.deps)
        }
    }
}
function trackRefValue(ref) {
    if(isTracking()) {
        trackEffects(ref.deps)
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value
}
export function ref(value) {
    return new RefImpl(value)
}
export function isRef(ref) {
    return !!ref.__v_isRef
}
export function unRef(ref) {
    return isRef(ref) ? ref.value: ref
}
export function proxyRefs(ref) {
    return new Proxy(ref, {
        get(target, key){
            return unRef(Reflect.get(target,key))
        },
        set(target,key,newValue){
            if(isRef(target[key]) && !isRef(newValue)) {
                return (target[key].value = newValue)
            }
            return Reflect.set(target,key,newValue)
        }
    })
}