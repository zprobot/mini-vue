import { createVNodeCall, NodeTypes } from "../ast";

export function transformElement(node,context) {
    if(node.type === NodeTypes.ELEMENT) {
        return () => {
            // tag
            const vnodeTag = `'${node.tag}'`
            // props
            const vnodeProps = node.props
            // children
            const children = node.children
            let vnodeChildren = children[0]
            node.codegenNode = createVNodeCall(context,vnodeTag,vnodeProps,vnodeChildren)
        }
    }
}