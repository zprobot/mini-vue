import { NodeTypes } from "./ast"

export function beseParse(content: string){
    const context = createParserContext(content)
    return createRoot(parseChildren(context))
}

function parseChildren(context) {
    const nodes:any = []
    let node
    if(context.source.startsWith('{{')) {
        node = parseInterpolation(context)
    }
    nodes.push(node)
    return nodes
}
function parseInterpolation(context) {
    // {{ message }}
    const openDelimiter = '{{'
    const closeDelimiter = '}}'
    let endIndex = context.source.indexOf(closeDelimiter,openDelimiter.length)
    advance(context,openDelimiter.length)
    const contentLen = endIndex - openDelimiter.length
    const contentRaw = context.source.slice(0,contentLen)
    const content = contentRaw.trim()
    advance(context,contentLen+closeDelimiter.length)
    return   {
        type: NodeTypes.INTERPOLATION,//'interpolation',
        content: {
            type: NodeTypes.SAMPLE_INTERPOLATION,
            content: content
        }
    }
}
function advance(context,length) {
    context.source = context.source.slice(length)
}

function createRoot(children) {
    return {
        children
    }
}

function createParserContext(content: string) {
    return {
        source: content
    }
}
