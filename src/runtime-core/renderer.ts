import { createComponentInstance } from "./component"

export function render(vnode, container) {
    patch(vnode, container)
}

function patch(vnode, container) {
    // 处理组件
    processComponent(vnode, container)
}

function processComponent(vnode: any, container: any) {
    mountComponent(vnode)
    
}
function mountComponent(vnode: any) {
    const instance = createComponentInstance(vnode)
    setupCom
}



