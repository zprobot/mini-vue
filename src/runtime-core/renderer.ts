import { ShapeFlags } from "../shared/ShapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { Fragment,Text } from "./vnode"

export function render(vnode, container) {
    patch(vnode, container)
}

function patch(vnode, container) {
    // 处理组件
    const { type, shapeFlag } = vnode
    switch (type) {
        case Fragment:
            processFragment(vnode, container)
            break
        case Text:
            processText(vnode, container)
            break
        default:
            if(shapeFlag & ShapeFlags.ELEMENT) {
                processElement(vnode, container)
            } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                processComponent(vnode, container)
            }
            break
    }
}
function processFragment(vnode: any, container: any) {
    // Frament节点只渲染children
    mountChildren(vnode, container)
}
function processText(vnode: any, container: any) {
    const textNode = (vnode.el = document.createTextNode(vnode.children))
    container.append(textNode)
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
    for(const key in props) {
        let val = props[key]
        const isOn = key => /^on[A-Z]/.test(key)
        if(isOn(key)){
            const event = key.slice(2).toLowerCase()
            el.addEventListener(event,val)
        }else {
            el.setAttribute(key,val)
        }
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


