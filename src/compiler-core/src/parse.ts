import { NodeTypes } from "./ast"
const enum TagsType {
    Start,
    End
}
export function beseParse(content: string){
    const context = createParserContext(content)
    return createRoot(parseChildren(context,[]))
}
function parseTextData(context,length){
    const content = context.source.slice(0,length)
    advance(context,length)
    return content
}

function parseChildren(context,tagStack) {
    const nodes:any = []
    while (!isEnd(context,tagStack)) {
        let node
        let s = context.source
        if(s.startsWith('{{')) {
            node = parseInterpolation(context)
        }else if(s[0] === '<') {
            if(/[a-z]/i.test(s[1])) {
                node = parseElement(context,tagStack)
            }
        }
        if(!node) {
            node = parseText(context)
        }
        nodes.push(node)
    }
    return nodes
}
function isEnd(context,tagStack) {
    const s = context.source
    // 结束标签
    if(s.startsWith('</')) {
        for(let i = tagStack.length -1;i>=0;i--) {
            const tag = tagStack[i]
            if(startWithEndTagOpen(s,tag)) {
                return true
            }
        }
    }
    // 字符为空
    return !s
}
function parseInterpolation(context) {
    // {{ message }}
    const openDelimiter = '{{'
    const closeDelimiter = '}}'
    let endIndex = context.source.indexOf(closeDelimiter,openDelimiter.length)
    advance(context,openDelimiter.length)
    const contentLen = endIndex - openDelimiter.length
    const contentRaw = parseTextData(context,contentLen)
    advance(context,closeDelimiter.length)
    const content = contentRaw.trim()
    return   {
        type: NodeTypes.INTERPOLATION,//'interpolation',
        content: {
            type: NodeTypes.SAMPLE_INTERPOLATION,
            content: content
        }
    }
}
function parseElement(context: any,tagStack) {
    const element: any = parseTag(context,TagsType.Start)
    tagStack.push(element.tag)
    element.children = parseChildren(context,tagStack)
    tagStack.pop()
    if(startWithEndTagOpen(context.source,element.tag)) {
        parseTag(context,TagsType.End)
    } else {
        throw new Error(`缺少结束标签${element.tag}`)
    }
    return element
}
function startWithEndTagOpen(source,tag) {
    return source.startsWith('</') && source.slice(2,2+tag.length).toLowerCase() === tag.toLowerCase()
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
function parseText(context) {
    let endIndex = context.source.length
    let endTokens = ["<","{{"]
    for(const token of endTokens) {
        const index = context.source.indexOf(token)
        if( index !== -1 && endIndex > index) {
            endIndex = index
        }
    }
    
    const content = parseTextData(context,endIndex)
    return {
        type: NodeTypes.TEXT,
        content,
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

