import { NodeTypes } from "./ast"
import {CREATE_ELEMENT_VNODE, TO_DISPLAY_STRING } from "./runtimeHelpers"

export function transform(root,options:any={}){
    const context = createTransformContext(root,options)
    // 深度优先遍历
    traverseNode(root,context)
    //
    createRootChildren(root)
    root.helpers = [...context.helpers.keys()]
}
function createRootChildren(root) {
    const child = root.children[0]
    if(child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode
    } else {
        root.codegenNode = root.children[0]
    }
}

function traverseNode(node: any,context: any) {
    // 使用插件式向函数外部暴露节点，让外部决定节点处理逻辑
    const nodeTransforms = context.nodeTransforms
    const exitFns:any = []
    for(let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i]
        const exitFn = transform(node,context)
        if(exitFn) exitFns.push(exitFn)
    }
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            // 处理差值的render函数需要toDisplayString辅助
            context.helper(TO_DISPLAY_STRING)   
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node,context)
            break;
        default:
            break;
    }
    let i = exitFns.length
    while(i--) {
        exitFns[i]()
    }
}
function traverseChildren(node,context) {
    const children = node.children
    for(let i = 0; i < children.length; i++) {
        traverseNode(children[i],context)
    }
}
function createTransformContext(root: any, options: any) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key){
            context.helpers.set(key,1)
        }
    }
    return context
}

