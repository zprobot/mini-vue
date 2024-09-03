import { ShapeFlags } from "../shared/ShapeFlags"
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
    patch(vnode, container)
}

function patch(vnode, container) {
    // 处理组件
    const { shapeFlag } = vnode
    if(shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
    } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
    }
}
function processElement(vnode: any, container: any) {
    mountElement(vnode, container)
}
function mountElement(vnode: any, container: any) {
    const {type, props, children, shapeFlag} = vnode
    const el = (vnode.el = document.createElement(type))
    // children
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(vnode,el)
    }
    for(const key of props) {
        el.setAttribute(key,props[key])
    }
    container.append(el)
}
function mountChildren(vnode,container) {
    vnode.children.forEach(v=>patch(v,container))
}
function processComponent(vnode: any, container: any) {
    mountComponent(vnode, container)
}
function mountComponent(initialVnode: any,container: any) {
    const instance = createComponentInstance(initialVnode)
    setupComponent(instance)
    setupRenderEffect(instance, initialVnode, container)
}



function setupRenderEffect(instance: any, initialVnode: any, container:any) {
    const { proxy } = instance
    const subTree = instance.render.call(proxy)
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree,container)
    // 所有组件都挂载
    initialVnode.el = subTree.el
}


