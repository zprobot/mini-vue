import { effect } from "../reactivity/effect"
import { ShapeFlags } from "../shared/ShapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp"
import { Fragment,Text } from "./vnode"


export function createRenderer(options) {
    const {
        createElement,
        patchProp,
        insert,
        remove,
        setTextElement
    } = options

    function render(vnode, container,parentComponent) {
        patch(null,vnode, container,parentComponent)
    }
    // n1 old vnode
    // n2 new vnode
    function patch(n1, n2, container,parentComponent) {
        // 处理组件
        const { type, shapeFlag } = n2
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container,parentComponent)
                break
            case Text:
                processText(n1, n2, container)
                break
            default:
                if(shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container,parentComponent)
                } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container,parentComponent)
                }
                break
        }
    }
    function processFragment(n1:any, n2: any, container: any,parentComponent) {
        // Frament节点只渲染children
        mountChildren(n2.children, container,parentComponent)
    }
    function processText(n1:any,n2: any, container: any) {
        const textNode = (n2.el = document.createTextNode(n2.children))
        container.append(textNode)
    }
    function processElement(n1:any ,n2: any, container: any,parentComponent) {
        if(!n1) {
            mountElement(n2, container,parentComponent)
        } else {
            // 更新
            patchElement(n1,n2,container,parentComponent)
        }
    }
    function patchElement(n1,n2,container,parentComponent) {
        // props
        const oldProps = n1.props || {}
        const newProps = n2.props || {}
        const el = n2.el = n1.el
        patchProps(el,oldProps,newProps)
        // children
        patchChildren(n1,n2,el,parentComponent)
    }
    function patchProps(el,oldProps,newProps) {
        if(oldProps !== newProps) {
            for (const key in newProps) {
                const preProp = oldProps[key]
                const nextProp = newProps[key]
                if(preProp !== nextProp) {
                    patchProp(el,key,preProp,nextProp)
                }
            }
            // 删除
            for(const key in oldProps) {
                if(!(key in newProps)) {
                    patchProp(el,key,oldProps[key],null)
                }
            }
            
        }
    }
    function patchChildren(n1,n2,container,parentComponent) {
        const preShapeFlag = n1.shapeFlag
        const shapeFlag = n2.shapeFlag
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 新的为文本，老的为数组
            if(preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 清理老的，设置新的
                unmountChildren(n1.children)
                setTextElement(container,n2.children)
            } else {
                if(n1.children !== n2.children) {
                    setTextElement(container,n2.children)
                }
            }
        } else {
            if(preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                setTextElement(container,'')
                mountChildren(n2.children,container,parentComponent)
            }
        }
    }
    function unmountChildren(children) {
        for(const child in children){
            remove(child)
        }
    }
    function mountElement(vnode: any, container: any,parentComponent) {
        const {type, props, children, shapeFlag} = vnode
        const el = (vnode.el = createElement(type))
        // children
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children,el,parentComponent)
        }
        for(const key in props) {
            let val = props[key]
            patchProp(el,key,null,val)
        }
        insert(el, container)
    }
    function mountChildren(children,container,parentComponent) {
        children.forEach(v=>patch(null,v,container,parentComponent))
    }
    function processComponent(n1,n2: any, container: any,parentComponent:any) {
        mountComponent(n2, container,parentComponent)
    }
    function mountComponent(initialVnode: any,container: any,parentComponent:any) {
        const instance = createComponentInstance(initialVnode,parentComponent)
        setupComponent(instance)
        setupRenderEffect(instance, initialVnode, container)
    }



    function setupRenderEffect(instance: any, initialVnode: any, container:any) {
        effect(()=>{
            if(!instance.isMounted) {
                const { proxy } = instance
                const subTree = instance.subTree = instance.render.call(proxy)
                // vnode -> patch
                // vnode -> element -> mountElement
                // 递归挂载子树
                patch(null,subTree,container,instance)
                // 所有组件都挂载
                initialVnode.el = subTree.el
                instance.isMounted = true
            } else {
                const { proxy } = instance
                const subTree = instance.render.call(proxy)
                const preSubTree = instance.subTree
                instance.subTree = subTree
                patch(preSubTree,subTree,container,instance)
            }
        })
    }

    return {
        createApp: createAppAPI(render)
    }
}

