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
})