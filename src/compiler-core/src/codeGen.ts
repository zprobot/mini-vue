import { NodeTypes } from "./ast"
import { helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers"

export function generate(ast) {
    const context = createCodegenContext()
    const { push } = context

    // 处理导入
    genFunctionPreamble(ast,context)

    push('return ')
    const functionName = 'render'
    const args = ['ctx_','_cache']
    const signature = args.join(', ')
    push(`${functionName}(${signature}){`)
    push('return ')
    genNode(ast.codegenNode,context)
    push(`}`)
    return {
        code: context.code
    }
}
function genNode(node,context) {

    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node,context)
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node,context)
            break;
        case NodeTypes.SAMPLE_EXPRESSION:
            genExpression(node,context)
            break;
        default:
            break;
    }
}
function genText(node,context){
    const { push } = context
    push(`'${node.content}'`)
}
function genInterpolation(node,context) {
    const {push,healper} = context
    push(healper(TO_DISPLAY_STRING))
    genNode(node.content,context)
    push(')')
}
function genExpression(node,context) {
    const {push} = context
    push(`${node.content}`)
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source
        },
        healper(key) {
            return `_${helperMapName[key]}(`
        }
    }
    return context
}
function genFunctionPreamble(ast,context) {
    const { push } = context
    const vueBinging = 'Vue'
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`
    if(ast.helpers.length>0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${vueBinging}`)
    }
    push('\n')
}

