import { NodeTypes } from "./ast"
const enum TagsType {
    Start,
    End
}
export function beseParse(content: string){
    const context = createParserContext(content)
    return createRoot(parseChildren(context))
}

function parseChildren(context) {
    const nodes:any = []
    let node
    let s = context.source
    if(s.startsWith('{{')) {
        node = parseInterpolation(context)
    }else if(s[0] === '<') {
        if(/[a-z]/i.test(s[1])) {
            node = parseElement(context)
        }
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
function parseElement(context: any) {
    const element = parseTag(context,TagsType.Start)
    parseTag(context,TagsType.End)
    return element
}
function parseTag(context,type) {
    // 解析tag
    // 前进
    const match: any = /^<\/?([a-z]*)/i.exec(context.source)
    const tag = match[1]
    advance(context,match[0].length)
    advance(context,1)
    if(type===TagsType.End) return
    return {
        type: NodeTypes.ELEMENT,
        tag,
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

