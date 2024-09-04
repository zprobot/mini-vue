export const extend = Object.assign
export const isObject = (val) => {
    return val !== null && typeof val === 'object'
}
export const hadChange = (oldVal, newVal) => {
    return !Object.is(oldVal, newVal)
}
export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val,key)
// add-foo -> addFoo
export const camelize = str => str.replace(/-(\w)/g,(_,c:string)=>c ? c.toUpperCase(): '')
// addFoo -> AddFoo
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1)
// add -> onAdd 
export const toHandlerKey = str => str ? 'on' + capitalize(str) : ''