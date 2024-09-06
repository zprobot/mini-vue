import { ShapeFlags } from "../shared/ShapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp"
import { Fragment,Text } from "./vnode"


export function createRenderer(options) {
    const {
        createElement,
        patchProp,
        insert
    } = options

    function render(vnode, container,parentComponent) {
        patch(vnode, container,parentComponent)
    }
    function patch(vnode, container,parentComponent) {
        // 处理组件
        const { type, shapeFlag } = vnode
        switch (type) {
            case Fragment:
                processFragment(vnode, container,parentComponent)
                break
            case Text:
                processText(vnode, container)
                break
            default:
                if(shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(vnode, container,parentComponent)
                } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(vnode, container,parentComponent)
                }
                break
        }
    }
    function processFragment(vnode: any, container: any,parentComponent) {
        // Frament节点只渲染children
        mountChildren(vnode, container,parentComponent)
    }
    function processText(vnode: any, container: any) {
        const textNode = (vnode.el = document.createTextNode(vnode.children))
        container.append(textNode)
    }
    function processElement(vnode: any, container: any,parentComponent) {
        mountElement(vnode, container,parentComponent)
    }
    function mountElement(vnode: any, container: any,parentComponent) {
        const {type, props, children, shapeFlag} = vnode
        const el = (vnode.el = createElement(type))//document.createElement(type))
        // children
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode,el,parentComponent)
        }
        for(const key in props) {
            let val = props[key]
            // const isOn = key => /^on[A-Z]/.test(key)
            // if(isOn(key)){
            //     const event = key.slice(2).toLowerCase()
            //     el.addEventListener(event,val)
            // }else {
            //     el.setAttribute(key,val)
            // }
            patchProp(el,key,val)
        }
        //container.append(el)
        insert(el, container)
    }
    function mountChildren(vnode,container,parentComponent) {
        vnode.children.forEach(v=>patch(v,container,parentComponent))
    }
    function processComponent(vnode: any, container: any,parentComponent:any) {
        mountComponent(vnode, container,parentComponent)
    }
    function mountComponent(initialVnode: any,container: any,parentComponent:any) {
        const instance = createComponentInstance(initialVnode,parentComponent)
        setupComponent(instance)
        setupRenderEffect(instance, initialVnode, container)
    }



    function setupRenderEffect(instance: any, initialVnode: any, container:any) {
        const { proxy } = instance
        const subTree = instance.render.call(proxy)
        // vnode -> patch
        // vnode -> element -> mountElement
        // 递归挂载子树
        patch(subTree,container,instance)
        // 所有组件都挂载
        initialVnode.el = subTree.el
    }

    return {
        createApp: createAppAPI(render)
    }
}

