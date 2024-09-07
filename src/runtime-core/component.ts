import { proxyRefs } from "../reactivity"
import { shallowReadonly } from "../reactivity/reactive"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"
let currentInstance = null
export function createComponentInstance(vnode: any,parent:any) {
    console.log(vnode.type,parent)
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: null,
        emit: () => {}
    }
    component.emit = emit.bind(null,component) as any
    return component
}
export function setupComponent(instance) {
    initProps(instance,instance.vnode.props)
    initSlots(instance,instance.vnode.children)
    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
    const Component = instance.type
    // ctx
    instance.proxy = new Proxy({_:instance},PublicInstanceProxyHandlers)
    const {setup} = Component
    if(setup){
        setComponentInstance(instance)
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit })
        setComponentInstance(null)
        handleSetupResult(instance, setupResult)
    }
}
function handleSetupResult(instance:any, setupResult: any) {
    // function 
    // obj
    if(typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult)
    }
    finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
    const Component = instance.type
    if(Component.render) {
        instance.render = Component.render
    }
}

export function getCurrentInstance() {
    //返回当前组件的实例对象 只在setup中可用
    return currentInstance
}

export function setComponentInstance(instance) {
    currentInstance = instance
}