import { generate } from "../src/codeGen"
import { beseParse } from "../src/parse"
import { transform } from "../src/transform"
import { transformExpression } from "../src/transforms/transformExpression"

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
})