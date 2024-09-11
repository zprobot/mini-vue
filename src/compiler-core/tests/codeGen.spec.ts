import { generate } from "../src/codeGen"
import { beseParse } from "../src/parse"
import { transform } from "../src/transform"
import { transformElement } from "../src/transforms/transformElement"
import { transformExpression } from "../src/transforms/transformExpression"
import { transformText } from "../src/transforms/transformText"

describe('codeGen',()=>{
    it('string',()=>{
        const ast = beseParse('hi')
        transform(ast)
        const {code} = generate(ast)
        expect(code).toMatchSnapshot()
    })
    it('interpolation',()=>{
        const ast = beseParse('{{message}}')
        transform(ast,{
            nodeTransforms:[transformExpression]
        })
        const {code} = generate(ast)
        expect(code).toMatchSnapshot()
    })
    it('element',()=>{
        const ast = beseParse('<div>hi,{{message}}</div>')
        transform(ast,{
            nodeTransforms:[transformExpression,transformElement,transformText]
        })
        const {code} = generate(ast)
        expect(code).toMatchSnapshot()
    })
})