import { NodeTypes } from "../ast";

export function transformExpression(node) {
    // 处理插值类型的插件
    if (node.type === NodeTypes.INTERPOLATION) {
        processExpression(node.content)
    }
}
function processExpression(node){
        node.content = `_ctx.${node.content}`
}