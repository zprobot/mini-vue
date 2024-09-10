export function transform(root,options:any){
    const context = createTransformContext(root,options)
    // 深度优先遍历
    traverseNode(root,context)
}

function traverseNode(node: any,context: any) {
    // 使用插件式向函数外部暴露节点，让外部决定节点处理逻辑
    const nodeTransforms = context.nodeTransforms
    for(let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i]
        transform(node)
    }
    // 深度递归每个节点
    traverseChildren(node,context)
}
function traverseChildren(node,context) {
    const children = node.children
    if(children) {
        for(let i = 0; i < children.length; i++) {
            traverseNode(children[i],context)
        }
    }
}
function createTransformContext(root: any, options: any) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || []
    }
    return context
}

