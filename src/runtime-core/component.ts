import { PublicInstanceProxyHandlers } from "./componentPublicInstance"

export function createComponentInstance(vnode: any) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {}
    }
    return component
}
export function setupComponent(instance) {
    // initprops
    // initSlots
    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
    const Component = instance.type
    // ctx
    instance.proxy = new Proxy({_:instance},PublicInstanceProxyHandlers)
    const {setup} = Component
    if(setup){
        const setupResult = setup()
        handleSetupResult(instance, setupResult)
    }
}
function handleSetupResult(instance:any, setupResult: any) {
    // function 
    // obj
    if(typeof setupResult === 'object') {
        instance.setupState = setupResult
    }
    finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
    const Component = instance.type
    if(Component.render) {
        instance.render = Component.render
    }
}

