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

    function render(vnode, container) {
        patch(null,vnode, container,null,null)
    }
    // n1 old vnode
    // n2 new vnode
    function patch(n1, n2, container,parentComponent,anchor) {
        // 处理组件
        const { type, shapeFlag } = n2
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container,parentComponent,anchor)
                break
            case Text:
                processText(n1, n2, container)
                break
            default:
                if(shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container,parentComponent,anchor)
                } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container,parentComponent,anchor)
                }
                break
        }
    }
    function processFragment(n1:any, n2: any, container: any,parentComponent,anchor) {
        // Frament节点只渲染children
        mountChildren(n2.children, container,parentComponent,anchor)
    }
    function processText(n1:any,n2: any, container: any) {
        const textNode = (n2.el = document.createTextNode(n2.children))
        container.append(textNode)
    }
    function processElement(n1:any ,n2: any, container: any,parentComponent,anchor) {
        if(!n1) {
            mountElement(n2, container,parentComponent,anchor)
        } else {
            // 更新
            patchElement(n1,n2,container,parentComponent,anchor)
        }
    }
    function patchElement(n1,n2,container,parentComponent,anchor) {
        // props
        const oldProps = n1.props || {}
        const newProps = n2.props || {}
        const el = n2.el = n1.el
        patchProps(el,oldProps,newProps)
        // children
        patchChildren(n1,n2,el,parentComponent,anchor)
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
    function patchChildren(n1,n2,container,parentComponent,anchor) {
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
                mountChildren(n2.children,container,parentComponent,anchor)
            } else{
                // array to array
                patchKeyChildren(n1.children,n2.children,container,parentComponent,anchor)
            }
        }
    }
    function unmountChildren(children) {
        for(const child in children){
            remove(child)
        }
    }
    function patchKeyChildren(c1,c2,container,parentComponent,parentAnchor){
        let i = 0
        let c1Len = c1.length - 1, c2Len = c2.length - 1
        while(i<=c1Len && i<=c2Len) {
            const n1 = c1[i], n2 = c2[i]
            if(isSameNode(n1,n2)) {
                patch(n1,n2,container,parentComponent,parentAnchor)
            } else {
                break
            }
            i++
        }
        while(i<=c1Len && i<=c2Len) {
            const n1 = c1[c1Len], n2 = c2[c2Len]
            if(isSameNode(n1,n2)) {
                patch(n1,n2,container,parentComponent,parentAnchor)
            } else {
                break
            }
            c1Len--
            c2Len--
        }
        // 创建新的
        if(i>c1Len && i<=c2Len) {
            const nextPos = c2Len+1
            const anchor = nextPos < c2.length ? c2[nextPos].el: null
            while(i<=c2Len) {
                patch(null,c2[i],container,parentComponent,anchor)
                i++
            }
        } else if(i>c2Len) {
            while(i<=c1Len) {
                remove(c1[i].el)
                i++
            }
        }else{
            let s1 = i, s2 = i
            const patchSum = c2Len - s2 + 1
            let patchCount = 0
            const indexMap = new Map()
            const newToOldIndexMap = Array(patchSum).fill(0)
            let moved = false
            let maxIndex = 0
            for(let i= s2; i<= c2Len; i++){
                const nextChild = c2[i]
                indexMap.set(nextChild.key,i)
            }
            for (let i=s1;i<=c1Len;i++){
                const preChild = c1[i]
                if(patchCount >= patchSum) {
                    remove(preChild.el)
                    continue
                }
                let newIndex
                if(preChild.key !== null) {
                    newIndex = indexMap.get(preChild.key)
                } else {
                    for(let j = s2;j<=c2Len;j++){
                        if(isSameNode(preChild,c2[j])){
                            newIndex = j
                            break
                        }
                    }
                }
                if(newIndex === undefined) {
                    // 删除老节点
                    remove(preChild.el)
                } else {
                    if(newIndex>=maxIndex) {
                        maxIndex = newIndex
                    } else {
                        moved = true
                    }
                    newToOldIndexMap[newIndex-s2] = i + 1
                    patch(preChild,c2[newIndex],container,parentComponent,null)
                    patchCount++
                }
            }
            const maxLenSubSeq = moved ? getSequence(newToOldIndexMap) : []
            let j = maxLenSubSeq.length - 1
            for(let i=patchSum-1;i>=0;i--){
                const newIndex = i+s2
                const nextChild = c2[newIndex]
                const anchor = newIndex + 1 < c2.length ? c2[newIndex+1].el : null
                if(newToOldIndexMap[i]===0){
                    // 创建新的
                    patch(null,nextChild,container,parentComponent,anchor)
                }
                if(moved) {
                    if(i !== maxLenSubSeq[j]){
                        // 移动
                        insert(nextChild.el,container,anchor)
                    }else {
                        j++
                    }
                }
            }
        }

    }
    function isSameNode(n1,n2) {
        return n1.type === n2.type && n1.key ===  n2.key
    }
    function mountElement(vnode: any, container: any,parentComponent,anchor) {
        const {type, props, children, shapeFlag} = vnode
        const el = (vnode.el = createElement(type))
        // children
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children,el,parentComponent,anchor)
        }
        for(const key in props) {
            let val = props[key]
            patchProp(el,key,null,val)
        }
        insert(el, container)
    }
    function mountChildren(children,container,parentComponent,anchor) {
        children.forEach(v=>patch(null,v,container,parentComponent,anchor))
    }
    function processComponent(n1,n2: any, container: any,parentComponent:any,anchor) {
        mountComponent(n2, container,parentComponent,anchor)
    }
    function mountComponent(initialVnode: any,container: any,parentComponent:any,anchor) {
        const instance = createComponentInstance(initialVnode,parentComponent)
        setupComponent(instance)
        setupRenderEffect(instance, initialVnode, container,anchor)
    }



    function setupRenderEffect(instance: any, initialVnode: any, container:any,anchor) {
        effect(()=>{
            if(!instance.isMounted) {
                const { proxy } = instance
                const subTree = instance.subTree = instance.render.call(proxy)
                // vnode -> patch
                // vnode -> element -> mountElement
                // 递归挂载子树
                patch(null,subTree,container,instance,anchor)
                // 所有组件都挂载
                initialVnode.el = subTree.el
                instance.isMounted = true
            } else {
                const { proxy } = instance
                const subTree = instance.render.call(proxy)
                const preSubTree = instance.subTree
                instance.subTree = subTree
                patch(preSubTree,subTree,container,instance,anchor)
            }
        })
    }

    return {
        createApp: createAppAPI(render)
    }
}

function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = (u + v) >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  }