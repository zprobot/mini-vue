import { camelize, toHandlerKey } from "../shared"

export function emit (instance, event, ...args) {
    console.log('emit',event)
    const { props } = instance
    // add -> onAdd
    // add-foo -> onAddFoo
    const handlerName = toHandlerKey(camelize(event))
    const handler = props[handlerName]
    handler && handler(...args)
}