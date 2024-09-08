import { isObject } from "../shared"
import { ShapeFlags } from "../shared/ShapeFlags"
export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export function createVNode(type, props?, children?) {

    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null
    }
    if(typeof children === 'string') {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    }else if(Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }
    // 组件类型 children为object 
    if(vnode.shapeFlag === ShapeFlags.STATEFUL_COMPONENT && isObject(vnode.children)) {
        vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
    }
    return vnode
}

function getShapeFlag(type) {
    return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}
export function createTextVnode(text){
    return createVNode(Text,{},text)
}