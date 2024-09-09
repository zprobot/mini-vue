import { NodeTypes } from "../src/ast"
import { beseParse } from "../src/parse"

describe('parse',()=>{
    describe('interpolation',()=>{
        test('simple interpolation',()=>{
            const ast:any = beseParse("{{message }}")
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SAMPLE_INTERPOLATION,
                    content: 'message'
                }
            })
        })
    })
    describe('element',()=>{
        it('simple element',()=>{
            const ast:any = beseParse("<div></div>")
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: 'div',
                children: []
            })
        })    
    })
    describe('text',()=>{
        it('sample text', ()=> {
            const ast = beseParse('some text')
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.TEXT,
                content: 'some text'
            })
        })
    })
    test('hello world',()=>{
        const ast = beseParse('<div>hi,{{message}}</div>')
        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: 'div',
            children: [
                {
                    type: NodeTypes.TEXT,
                    content: 'hi,'
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SAMPLE_INTERPOLATION,
                        content: 'message'
                    }
                }
            ]
        })
    })
    test('nexted element',()=>{
        const ast = beseParse('<div><p>hi,</p>{{message}}</div>')
        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: 'div',
            children: [
                {
                    type: NodeTypes.ELEMENT,
                    tag: 'p',
                    children: [
                        {
                            type: NodeTypes.TEXT,
                            content: 'hi,'
                        }
                    ]
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SAMPLE_INTERPOLATION,
                        content: 'message'
                    }
                }
            ]
        })
    })
    test("throw err when lack end tag",()=>{
        expect(()=>{
            beseParse('<div><span></div>')
        }).toThrow('缺少结束标签span')
    })
})